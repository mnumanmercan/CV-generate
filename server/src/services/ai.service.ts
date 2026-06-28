import Anthropic from '@anthropic-ai/sdk'
import type { Plan } from '@prisma/client'
import {
  SummaryAnalysisResultSchema,
  type AnalyzeSummaryInput,
  type AnalyzeSummaryData,
  type SummaryAnalysisResult,
} from '@resumark/shared'
import { env } from '../config/env.js'
import { prisma } from '../db/prisma.js'
import { AppError } from '../utils/apiError.js'
import { toPrismaJson } from '../utils/jsonb.js'
import {
  SUMMARY_ANALYZER_PROMPT_VERSION,
  buildSummaryAnalyzerSystemPrompt,
} from '../prompts/summaryAnalyzer.js'

// Structured-outputs format: the API constrains generation to this JSON schema,
// so the model returns schema-valid JSON (no markdown fences, no free-form
// text) and we never hand-clean the response. We pass a plain JSON schema
// literal rather than the SDK's zodOutputFormat() helper, which expects a
// zod-v4 schema while this codebase is on zod v3. Mirror of
// SummaryAnalysisResultSchema; the response is still zod-validated below.
const OUTPUT_FORMAT = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      feedback: { type: 'string' },
      suggestion: { type: 'string' },
    },
    required: ['feedback', 'suggestion'],
    additionalProperties: false,
  },
} as const

let _anthropic: Anthropic | null = null

function getAnthropicClient() {
  if (!_anthropic) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new AppError('AI service not configured', 503, 'AI_NOT_CONFIGURED')
    }
    _anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  }
  return _anthropic
}

// Tiered model: FREE gets the fast/cheap Haiku, any paid tier gets the
// higher-quality Sonnet. Aliases (no date suffix) per Anthropic convention;
// both support structured outputs. A function (rather than an exhaustive map)
// keeps this correct if new paid plans are added.
export const FREE_MODEL = 'claude-haiku-4-5'
export const PREMIUM_MODEL = 'claude-sonnet-4-6'

export function modelForPlan(plan: Plan): string {
  return plan === 'FREE' ? FREE_MODEL : PREMIUM_MODEL
}

// Hard ceiling on a single Anthropic call. Haiku/Sonnet typically respond in
// 1–3 s for this input; 30 s absorbs network jitter and rate-limit retries
// while still freeing the request slot if their API goes dark.
const AI_REQUEST_TIMEOUT_MS = 30_000

// Build the per-request user message: the volatile bits (target language,
// context, summary) live here, after the cached system prefix.
function buildUserMessage(input: AnalyzeSummaryInput): string {
  const lines: string[] = []
  lines.push(
    `Write the feedback and suggestion in ${input.locale === 'tr' ? 'Turkish' : 'English'}.`,
  )

  if (input.jobTitle?.trim()) {
    lines.push(`Target role: ${input.jobTitle.trim()}`)
  }
  if (input.experience?.length) {
    const exp = input.experience
      .map((e) => (e.company?.trim() ? `${e.title} at ${e.company}` : e.title))
      .join('; ')
    lines.push(`Experience: ${exp}`)
  }
  if (input.skills?.length) {
    lines.push(`Skills: ${input.skills.join(', ')}`)
  }

  lines.push('')
  lines.push(`Summary to analyze:\n${input.summary}`)
  return lines.join('\n')
}

// Token + latency telemetry captured from one Anthropic call.
export interface AnalysisUsage {
  inputTokens: number | null
  outputTokens: number | null
  cacheReadTokens: number | null
  latencyMs: number
}

export interface GeneratedAnalysis {
  result: SummaryAnalysisResult
  usage: AnalysisUsage
}

// Pure generation: one Anthropic call for the given model, parsed + validated,
// with NO database write. This is the exact path production and the offline
// evals share — the eval harness calls it directly so it grades the real
// prompt / model / parser, and never persists an eval row.
export async function generateSummaryAnalysis(
  input: AnalyzeSummaryInput,
  model: string,
): Promise<GeneratedAnalysis> {
  const anthropic = getAnthropicClient()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS)

  const startedAt = Date.now()
  let response
  try {
    response = await anthropic.messages.create(
      {
        model,
        max_tokens: 1024,
        // Low but non-zero: keeps the rewrite stable and the offline evals
        // reproducible without making the prose robotic. Pinned (the SDK
        // default is higher) so a model change doesn't silently shift output
        // character or eval scores.
        temperature: 0.4,
        system: [
          {
            type: 'text',
            text: buildSummaryAnalyzerSystemPrompt({
              locale: input.locale,
              jobTitle: input.jobTitle,
            }),
            // Shared, byte-identical prefix across every request. Caching
            // engages only once this prefix exceeds the per-model minimum
            // (Haiku 4096 / Sonnet 2048 tokens); below that it is inert, not
            // an error. Kept here so it activates automatically if the prompt
            // grows. Verify via response.usage.cache_read_input_tokens.
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: buildUserMessage(input) }],
        output_config: { format: OUTPUT_FORMAT },
      },
      { signal: controller.signal },
    )
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new AppError('AI service did not respond in time.', 504, 'AI_TIMEOUT')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
  const latencyMs = Date.now() - startedAt

  if (response.stop_reason === 'refusal') {
    throw new AppError('AI declined to process this request.', 502, 'AI_REFUSED')
  }
  if (response.stop_reason === 'max_tokens') {
    throw new AppError('AI response was incomplete.', 502, 'AI_INCOMPLETE')
  }

  const block = response.content[0]
  if (!block || block.type !== 'text') {
    throw new AppError('AI response invalid', 502, 'AI_INVALID_RESPONSE')
  }

  // Structured outputs guarantees schema-valid JSON (no fences to strip); we
  // still parse + zod-validate defensively against any future regression.
  let json: unknown
  try {
    json = JSON.parse(block.text)
  } catch {
    throw new AppError('AI returned malformed JSON', 502, 'AI_PARSE_ERROR')
  }

  const parsed = SummaryAnalysisResultSchema.safeParse(json)
  if (!parsed.success) {
    throw new AppError('AI returned unexpected shape', 502, 'AI_INVALID_SHAPE')
  }

  return {
    result: parsed.data,
    usage: {
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
      cacheReadTokens: response.usage?.cache_read_input_tokens ?? null,
      latencyMs,
    },
  }
}

export const aiService = {
  async analyzeSummary(
    input: AnalyzeSummaryInput,
    userId: string,
    plan: Plan,
  ): Promise<AnalyzeSummaryData> {
    const model = modelForPlan(plan)
    const { result, usage } = await generateSummaryAnalysis(input, model)

    // Persist the analysis so it becomes an attributable, votable data point:
    // the input snapshot + output are tied to the exact model and prompt version
    // that produced them, with token/latency telemetry for cost tracking. The
    // returned id is the handle the client sends back when the user votes.
    // If this write fails the whole request fails (the client can re-run) —
    // simpler and more honest than returning an un-votable analysis.
    const analysis = await prisma.summaryAnalysis.create({
      data: {
        userId,
        input: toPrismaJson(input),
        output: toPrismaJson(result),
        model,
        promptVersion: SUMMARY_ANALYZER_PROMPT_VERSION,
        plan,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cacheReadTokens: usage.cacheReadTokens,
        latencyMs: usage.latencyMs,
      },
      select: { id: true },
    })

    return { analysisId: analysis.id, feedback: result.feedback, suggestion: result.suggestion }
  },
}
