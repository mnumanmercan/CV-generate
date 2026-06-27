/**
 * Unit tests for the summary-analyzer AI service. The Anthropic SDK is mocked,
 * so these run without credentials or network. We pin:
 *   1. Happy path returns the structured-output result.
 *   2. Tiered model selection: FREE → Haiku, paid → Sonnet.
 *   3. Context (target role, experience, skills, language) reaches the prompt.
 *   4. refusal / max_tokens / bad output map to the right AppErrors.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

// env.ts reads process.env when the service is imported below, so the optional
// ANTHROPIC_API_KEY must be set BEFORE the dynamic import (tests/setup.ts sets
// the required vars but not this optional one).
process.env.ANTHROPIC_API_KEY = 'sk-ant-test'

// Hoisted so the vi.mock factory (also hoisted) can close over it.
const createMock = vi.hoisted(() => vi.fn())

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: createMock }
  },
}))

const { aiService } = await import('./ai.service.js')

const baseInput = {
  summary: 'x'.repeat(60),
  locale: 'en' as const,
}

// A well-formed structured-outputs response.
function ok(feedback = 'fb', suggestion = 'sg') {
  return {
    stop_reason: 'end_turn',
    content: [{ type: 'text', text: JSON.stringify({ feedback, suggestion }) }],
  }
}

afterEach(() => {
  createMock.mockReset()
})

describe('aiService.analyzeSummary', () => {
  it('returns the parsed feedback/suggestion on success', async () => {
    createMock.mockResolvedValue(ok('fb', 'sg'))
    const result = await aiService.analyzeSummary(baseInput, 'FREE')
    expect(result).toEqual({ feedback: 'fb', suggestion: 'sg' })
  })

  it('uses Haiku for FREE and Sonnet for paid plans', async () => {
    createMock.mockResolvedValue(ok())
    await aiService.analyzeSummary(baseInput, 'FREE')
    await aiService.analyzeSummary(baseInput, 'PRO')
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
    await aiService.analyzeSummary(baseInput, 'FREE')
    expect(createMock.mock.calls[0][0].output_config.format.type).toBe('json_schema')
  })

  it('maps a refusal stop_reason to a 502 AppError', async () => {
    createMock.mockResolvedValue({ stop_reason: 'refusal', content: [] })
    await expect(aiService.analyzeSummary(baseInput, 'FREE')).rejects.toMatchObject({
      statusCode: 502,
      code: 'AI_REFUSED',
    })
  })

  it('maps max_tokens to a 502 AppError', async () => {
    createMock.mockResolvedValue({ stop_reason: 'max_tokens', content: [] })
    await expect(aiService.analyzeSummary(baseInput, 'FREE')).rejects.toMatchObject({
      statusCode: 502,
      code: 'AI_INCOMPLETE',
    })
  })

  it('throws AI_INVALID_SHAPE when the JSON is the wrong shape', async () => {
    createMock.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify({ feedback: 'only feedback' }) }],
    })
    await expect(aiService.analyzeSummary(baseInput, 'FREE')).rejects.toMatchObject({
      statusCode: 502,
      code: 'AI_INVALID_SHAPE',
    })
  })
})
