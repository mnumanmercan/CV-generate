import Anthropic from '@anthropic-ai/sdk'
import type { Plan } from '@prisma/client'
import {
  SummaryAnalysisResultSchema,
  type AnalyzeSummaryInput,
  type SummaryAnalysisResult,
} from '@resumark/shared'
import { env } from '../config/env.js'
import { AppError } from '../utils/apiError.js'

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
const FREE_MODEL = 'claude-haiku-4-5'
const PREMIUM_MODEL = 'claude-sonnet-4-6'

function modelForPlan(plan: Plan): string {
  return plan === 'FREE' ? FREE_MODEL : PREMIUM_MODEL
}

const SUMMARY_ANALYZER_SYSTEM_PROMPT = `
You are a senior CV/resume specialist and ATS-optimization expert.

You will receive a candidate's professional summary, and optionally the role they
are targeting plus a short digest of their real experience and skills. Produce:
1. feedback — 2–3 sentences of specific, actionable critique of the summary.
2. suggestion — a single rewritten summary (roughly 50–500 characters, plain
   text, no line breaks or bullet points) that fixes the issues you identified.

Evaluate the summary against these criteria:
- Action-verb strength (Led, Built, Delivered) over weak phrasing ("responsible
  for", "worked on").
- Concrete specificity over generic claims.
- Quantifiable impact (numbers, percentages, scope) — but follow the grounding
  rules below.
- ATS-friendliness: plain text and common, role-relevant keywords.
- Alignment with the target role and the candidate's actual experience, when
  provided.

GROUNDING — do not fabricate (critical, this is a real CV):
- Use ONLY facts present in the summary and the provided context. Never invent
  employers, job titles, dates, technologies, or seniority.
- Only state a metric if it genuinely appears in the provided context. Otherwise
  do NOT make one up: either omit it, or insert a clearly bracketed placeholder
  such as "[X]%" or "[N]+ users" and tell the candidate, in the feedback, to
  replace it with a real figure.
- Never claim skills the context does not support.

LANGUAGE:
- Write both feedback and suggestion in the requested language (stated in the
  user message). For Turkish, write natural, idiomatic Turkish — not a
  word-for-word translation of English phrasing.

Examples (illustrative only):

[English] Target role: Backend Engineer.
Input summary: "Responsible for working on backend systems and helping the team
with various tasks."
Ideal feedback: "This is generic and passive — it leans on 'responsible for' and
never names a technology, scope, or result. Lead with strong verbs and concrete
systems, and add a real metric where you have one."
Ideal suggestion: "Backend engineer who designs and ships REST APIs and data
pipelines, cutting request latency and serving [N]+ daily users. Owns
reliability from code to production."

[Türkçe] Hedef rol: Pazarlama Uzmanı.
Input summary: "Çeşitli pazarlama işlerinden sorumluydum ve kampanyalara yardımcı
oldum."
Ideal feedback: "İfade edilgen ve genel kalmış; somut bir kanal, ölçek veya
sonuç yok. Güçlü fiillerle başla, yürüttüğün kampanyaları ve elindeki gerçek bir
metriği ekle."
Ideal suggestion: "Dijital kampanyaları baştan sona yürüten pazarlama uzmanı;
sosyal medya ve e-posta kanallarında dönüşümü [X]% artırdı. Veriye dayalı içerik
ve performans takibinde güçlü."
`

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

export const aiService = {
  async analyzeSummary(input: AnalyzeSummaryInput, plan: Plan): Promise<SummaryAnalysisResult> {
    const anthropic = getAnthropicClient()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS)

    let response
    try {
      response = await anthropic.messages.create(
        {
          model: modelForPlan(plan),
          max_tokens: 1024,
          system: [
            {
              type: 'text',
              text: SUMMARY_ANALYZER_SYSTEM_PROMPT,
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
    return parsed.data
  },
}
