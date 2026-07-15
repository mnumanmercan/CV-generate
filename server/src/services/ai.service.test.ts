/**
 * Unit tests for the summary-analyzer AI service. The Anthropic SDK and the
 * Prisma client are mocked, so these run without credentials, network, or a DB.
 * We pin:
 *   1. Happy path returns the structured-output result + the persisted id.
 *   2. Tiered model selection: FREE → Haiku, paid → Sonnet.
 *   3. Context (target role, experience, skills, language) reaches the prompt.
 *   4. The analysis is persisted with model, prompt version, and usage.
 *   5. A low temperature is pinned for reproducibility.
 *   6. refusal / max_tokens / bad output map to the right AppErrors.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// env.ts reads process.env when the service is imported below, so the optional
// ANTHROPIC_API_KEY must be set BEFORE the dynamic import (tests/setup.ts sets
// the required vars but not this optional one).
process.env.ANTHROPIC_API_KEY = 'sk-ant-test'

// Hoisted so the vi.mock factories (also hoisted) can close over them.
const createMock = vi.hoisted(() => vi.fn())
const createAnalysisMock = vi.hoisted(() => vi.fn())
const createCoverLetterAnalysisMock = vi.hoisted(() => vi.fn())

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: createMock }
  },
}))

vi.mock('../db/prisma.js', () => ({
  prisma: {
    summaryAnalysis: { create: createAnalysisMock },
    coverLetterAnalysis: { create: createCoverLetterAnalysisMock },
  },
}))

const { aiService } = await import('./ai.service.js')
const { SUMMARY_ANALYZER_PROMPT_VERSION } = await import('../prompts/summaryAnalyzer.js')
const { COVER_LETTER_ANALYZER_PROMPT_VERSION } = await import('../prompts/coverLetterAnalyzer.js')

const USER = 'user-1'

const baseInput = {
  summary: 'x'.repeat(60),
  locale: 'en' as const,
}

// A well-formed structured-outputs response (with usage telemetry).
function ok(feedback = 'fb', suggestion = 'sg') {
  return {
    stop_reason: 'end_turn',
    content: [{ type: 'text', text: JSON.stringify({ feedback, suggestion }) }],
    usage: { input_tokens: 1200, output_tokens: 80, cache_read_input_tokens: 1024 },
  }
}

beforeEach(() => {
  // Default: persistence succeeds and returns a stable id. Error-path tests
  // throw before reaching the DB, so they don't depend on this.
  createAnalysisMock.mockResolvedValue({ id: 'analysis-default' })
  createCoverLetterAnalysisMock.mockResolvedValue({ id: 'cl-analysis-default' })
})

afterEach(() => {
  createMock.mockReset()
  createAnalysisMock.mockReset()
  createCoverLetterAnalysisMock.mockReset()
})

describe('aiService.analyzeSummary', () => {
  it('returns analysisId + parsed feedback/suggestion on success', async () => {
    createMock.mockResolvedValue(ok('fb', 'sg'))
    createAnalysisMock.mockResolvedValue({ id: 'a1' })
    const result = await aiService.analyzeSummary(baseInput, USER, 'FREE')
    expect(result).toEqual({ analysisId: 'a1', feedback: 'fb', suggestion: 'sg' })
  })

  it('uses Haiku for FREE and Sonnet for paid plans', async () => {
    createMock.mockResolvedValue(ok())
    await aiService.analyzeSummary(baseInput, USER, 'FREE')
    await aiService.analyzeSummary(baseInput, USER, 'PRO')
    expect(createMock.mock.calls[0][0].model).toBe('claude-haiku-4-5')
    expect(createMock.mock.calls[1][0].model).toBe('claude-sonnet-4-6')
  })

  it('puts target role, experience, skills, and language in the user message', async () => {
    createMock.mockResolvedValue(ok())
    await aiService.analyzeSummary(
      {
        ...baseInput,
        locale: 'tr',
        jobTitle: 'Backend Engineer',
        experience: [{ title: 'Engineer', company: 'Acme' }],
        skills: ['Node', 'SQL'],
      },
      USER,
      'PRO',
    )
    const userMsg = createMock.mock.calls[0][0].messages[0].content as string
    expect(userMsg).toContain('Turkish')
    expect(userMsg).toContain('Backend Engineer')
    expect(userMsg).toContain('Engineer at Acme')
    expect(userMsg).toContain('Node, SQL')
    expect(userMsg).toContain(baseInput.summary)
  })

  it('requests structured-output JSON format', async () => {
    createMock.mockResolvedValue(ok())
    await aiService.analyzeSummary(baseInput, USER, 'FREE')
    expect(createMock.mock.calls[0][0].output_config.format.type).toBe('json_schema')
  })

  it('pins a low temperature for reproducibility', async () => {
    createMock.mockResolvedValue(ok())
    await aiService.analyzeSummary(baseInput, USER, 'FREE')
    expect(createMock.mock.calls[0][0].temperature).toBe(0.4)
  })

  it('persists the analysis with owner, model, prompt version, and usage', async () => {
    createMock.mockResolvedValue(ok('fb', 'sg'))
    createAnalysisMock.mockResolvedValue({ id: 'analysis-xyz' })

    const result = await aiService.analyzeSummary(baseInput, USER, 'PRO')

    expect(result.analysisId).toBe('analysis-xyz')
    const writeData = createAnalysisMock.mock.calls[0][0].data
    expect(writeData).toMatchObject({
      userId: USER,
      model: 'claude-sonnet-4-6',
      promptVersion: SUMMARY_ANALYZER_PROMPT_VERSION,
      plan: 'PRO',
      inputTokens: 1200,
      outputTokens: 80,
      cacheReadTokens: 1024,
    })
    // The output snapshot is the model's feedback/suggestion (no analysisId).
    expect(writeData.output).toEqual({ feedback: 'fb', suggestion: 'sg' })
    expect(typeof writeData.latencyMs).toBe('number')
  })

  it('maps a refusal stop_reason to a 502 AppError', async () => {
    createMock.mockResolvedValue({ stop_reason: 'refusal', content: [] })
    await expect(aiService.analyzeSummary(baseInput, USER, 'FREE')).rejects.toMatchObject({
      statusCode: 502,
      code: 'AI_REFUSED',
    })
  })

  it('maps max_tokens to a 502 AppError', async () => {
    createMock.mockResolvedValue({ stop_reason: 'max_tokens', content: [] })
    await expect(aiService.analyzeSummary(baseInput, USER, 'FREE')).rejects.toMatchObject({
      statusCode: 502,
      code: 'AI_INCOMPLETE',
    })
  })

  it('throws AI_INVALID_SHAPE when the JSON is the wrong shape', async () => {
    createMock.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify({ feedback: 'only feedback' }) }],
    })
    await expect(aiService.analyzeSummary(baseInput, USER, 'FREE')).rejects.toMatchObject({
      statusCode: 502,
      code: 'AI_INVALID_SHAPE',
    })
  })
})

// ─── Cover letter analysis ───────────────────────────────────────────────────

const clInput = {
  parts: {
    opening: 'o'.repeat(60),
    bodyBring: 'b'.repeat(80),
  },
  locale: 'en' as const,
}

// A well-formed cover-letter structured-outputs response: results for the two
// provided parts, null for the absent ones, plus a coherence verdict.
function clOk() {
  return {
    stop_reason: 'end_turn',
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          opening: { feedback: 'op-fb', suggestion: 'op-sg' },
          bodyWhy: null,
          bodyBring: { feedback: 'br-fb', suggestion: 'br-sg' },
          closing: null,
          coherence: { verdict: 'consistent', issues: [] },
        }),
      },
    ],
    usage: { input_tokens: 3200, output_tokens: 700, cache_read_input_tokens: 2900 },
  }
}

describe('aiService.analyzeCoverLetter', () => {
  it('returns analysisId + per-part results (null for absent parts) + coherence', async () => {
    createMock.mockResolvedValue(clOk())
    createCoverLetterAnalysisMock.mockResolvedValue({ id: 'cl-1' })
    const result = await aiService.analyzeCoverLetter(clInput, USER, 'FREE')
    expect(result).toEqual({
      analysisId: 'cl-1',
      opening: { feedback: 'op-fb', suggestion: 'op-sg' },
      bodyWhy: null,
      bodyBring: { feedback: 'br-fb', suggestion: 'br-sg' },
      closing: null,
      coherence: { verdict: 'consistent', issues: [] },
    })
  })

  it('uses Haiku for FREE and Sonnet for paid plans', async () => {
    createMock.mockResolvedValue(clOk())
    await aiService.analyzeCoverLetter(clInput, USER, 'FREE')
    await aiService.analyzeCoverLetter(clInput, USER, 'PRO')
    expect(createMock.mock.calls[0][0].model).toBe('claude-haiku-4-5')
    expect(createMock.mock.calls[1][0].model).toBe('claude-sonnet-4-6')
  })

  it('puts context, provided parts, and the absent-part list in the user message', async () => {
    createMock.mockResolvedValue(clOk())
    await aiService.analyzeCoverLetter(
      {
        ...clInput,
        locale: 'tr',
        jobTitle: 'Backend Engineer',
        companyName: 'Acme Corp',
        recipientName: 'Sarah Johnson',
        targetJobDescription: 'We need someone who owns reliability.',
        experience: [{ title: 'Engineer', company: 'Initech' }],
        skills: ['Node', 'SQL'],
      },
      USER,
      'PRO',
    )
    const userMsg = createMock.mock.calls[0][0].messages[0].content as string
    expect(userMsg).toContain('Turkish')
    expect(userMsg).toContain('Backend Engineer')
    expect(userMsg).toContain('Acme Corp')
    expect(userMsg).toContain('Sarah Johnson')
    expect(userMsg).toContain('owns reliability')
    expect(userMsg).toContain('Engineer at Initech')
    expect(userMsg).toContain('Node, SQL')
    expect(userMsg).toContain(`OPENING:\n${clInput.parts.opening}`)
    expect(userMsg).toContain(`BODY_BRING:\n${clInput.parts.bodyBring}`)
    expect(userMsg).toContain('Parts not provided (return null for these): BODY_WHY, CLOSING')
  })

  it('requests structured-output JSON with the four nullable parts + coherence', async () => {
    createMock.mockResolvedValue(clOk())
    await aiService.analyzeCoverLetter(clInput, USER, 'FREE')
    const format = createMock.mock.calls[0][0].output_config.format
    expect(format.type).toBe('json_schema')
    expect(format.schema.required).toEqual([
      'opening',
      'bodyWhy',
      'bodyBring',
      'closing',
      'coherence',
    ])
  })

  it('persists the analysis with owner, model, prompt version, and usage', async () => {
    createMock.mockResolvedValue(clOk())
    createCoverLetterAnalysisMock.mockResolvedValue({ id: 'cl-xyz' })

    const result = await aiService.analyzeCoverLetter(clInput, USER, 'PRO')

    expect(result.analysisId).toBe('cl-xyz')
    const writeData = createCoverLetterAnalysisMock.mock.calls[0][0].data
    expect(writeData).toMatchObject({
      userId: USER,
      model: 'claude-sonnet-4-6',
      promptVersion: COVER_LETTER_ANALYZER_PROMPT_VERSION,
      plan: 'PRO',
      inputTokens: 3200,
      outputTokens: 700,
      cacheReadTokens: 2900,
    })
    expect(writeData.output.coherence).toEqual({ verdict: 'consistent', issues: [] })
    expect(typeof writeData.latencyMs).toBe('number')
  })

  it('maps a refusal stop_reason to a 502 AppError', async () => {
    createMock.mockResolvedValue({ stop_reason: 'refusal', content: [] })
    await expect(aiService.analyzeCoverLetter(clInput, USER, 'FREE')).rejects.toMatchObject({
      statusCode: 502,
      code: 'AI_REFUSED',
    })
  })

  it('maps max_tokens to a 502 AppError', async () => {
    createMock.mockResolvedValue({ stop_reason: 'max_tokens', content: [] })
    await expect(aiService.analyzeCoverLetter(clInput, USER, 'FREE')).rejects.toMatchObject({
      statusCode: 502,
      code: 'AI_INCOMPLETE',
    })
  })

  it('throws AI_PARSE_ERROR on malformed JSON', async () => {
    createMock.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: 'not json {' }],
    })
    await expect(aiService.analyzeCoverLetter(clInput, USER, 'FREE')).rejects.toMatchObject({
      statusCode: 502,
      code: 'AI_PARSE_ERROR',
    })
  })

  it('throws AI_INVALID_SHAPE when coherence is missing', async () => {
    createMock.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            opening: { feedback: 'fb', suggestion: 'sg' },
            bodyWhy: null,
            bodyBring: null,
            closing: null,
          }),
        },
      ],
    })
    await expect(aiService.analyzeCoverLetter(clInput, USER, 'FREE')).rejects.toMatchObject({
      statusCode: 502,
      code: 'AI_INVALID_SHAPE',
    })
  })
})
