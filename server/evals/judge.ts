// LLM-as-judge for the summary-analyzer eval harness.
//
// A strong model grades each rewrite against a rubric whose dimensions mirror
// the analyzer's own criteria — and the inverse of the user-facing downvote
// reasons. The judge defaults to Sonnet and the model under test defaults to the
// FREE tier (Haiku), so by default the grader differs from the gradee (no
// self-grading bias). Set EVAL_JUDGE_MODEL to an Opus model when grading the
// paid (Sonnet) tier to keep that separation.
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { env } from '../src/config/env.js'
import type { AnalyzeSummaryInput, SummaryAnalysisResult } from '@resumark/shared'

export const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL ?? 'claude-sonnet-4-6'

export const RUBRIC_DIMENSIONS = [
  'actionVerbs',
  'specificity',
  'groundedQuantification',
  'atsFriendliness',
  'roleAlignment',
  'languageQuality',
] as const
export type RubricDimension = (typeof RUBRIC_DIMENSIONS)[number]

export const JudgeVerdictSchema = z.object({
  scores: z.object({
    actionVerbs: z.number().min(1).max(5),
    specificity: z.number().min(1).max(5),
    groundedQuantification: z.number().min(1).max(5),
    atsFriendliness: z.number().min(1).max(5),
    roleAlignment: z.number().min(1).max(5),
    languageQuality: z.number().min(1).max(5),
  }),
  faithful: z.boolean(),
  fabrications: z.array(z.string()),
  rationale: z.string(),
})
export type JudgeVerdict = z.infer<typeof JudgeVerdictSchema>

// Structured-outputs schema. Plain integers (no min/max — the structured-output
// schema doesn't enforce numeric bounds); we clamp + zod-validate below.
const JUDGE_OUTPUT_FORMAT = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      scores: {
        type: 'object',
        properties: {
          actionVerbs: { type: 'integer' },
          specificity: { type: 'integer' },
          groundedQuantification: { type: 'integer' },
          atsFriendliness: { type: 'integer' },
          roleAlignment: { type: 'integer' },
          languageQuality: { type: 'integer' },
        },
        required: [...RUBRIC_DIMENSIONS],
        additionalProperties: false,
      },
      faithful: { type: 'boolean' },
      fabrications: { type: 'array', items: { type: 'string' } },
      rationale: { type: 'string' },
    },
    required: ['scores', 'faithful', 'fabrications', 'rationale'],
    additionalProperties: false,
  },
} as const

const JUDGE_SYSTEM_PROMPT = `
You are a strict, fair evaluator of CV professional-summary rewrites. You receive
(a) the candidate's ORIGINAL input — their summary plus any provided target role,
real experience, and skills — and (b) an AI assistant's OUTPUT: a short feedback
critique and a single rewritten summary.

Score the OUTPUT's rewritten summary on each dimension, 1 (poor) to 5 (excellent):
- actionVerbs: leads with strong, active verbs (Led, Built, Shipped) over passive
  filler ("responsible for", "worked on").
- specificity: concrete technologies, scope, and outcomes over vague claims.
- groundedQuantification: includes impact where useful, BUT only metrics present in
  the input, or clearly bracketed placeholders like "[X]%" / "[N]+ users". Inventing
  a concrete number that is not in the input scores 1 on THIS dimension.
- atsFriendliness: plain text, role-relevant keywords, no formatting junk.
- roleAlignment: fits the stated target role and the candidate's real experience.
- languageQuality: fluent and natural in the SAME language as the input summary. For
  Turkish, judge idiomatic Turkish, not translated-sounding phrasing.

Then judge FAITHFULNESS — the most important check:
- faithful = false if the rewritten summary states ANY employer, job title, date,
  technology, seniority, metric, or skill NOT supported by the input. A bracketed
  placeholder ("[X]%") is NOT a fabrication; a concrete invented number IS.
- List each fabricated claim in "fabrications" (empty array when faithful).

Be calibrated: a strong, grounded rewrite scores 4-5; a vague but harmless one 2-3; a
fabricating one is faithful=false regardless of style. Respond ONLY with the required
JSON.
`

function buildJudgeUserMessage(input: AnalyzeSummaryInput, output: SummaryAnalysisResult): string {
  const lines: string[] = ['INPUT', `Language: ${input.locale}`]
  if (input.jobTitle?.trim()) lines.push(`Target role: ${input.jobTitle.trim()}`)
  if (input.experience?.length) {
    const exp = input.experience
      .map((e) => (e.company?.trim() ? `${e.title} at ${e.company}` : e.title))
      .join('; ')
    lines.push(`Experience: ${exp}`)
  }
  if (input.skills?.length) lines.push(`Skills: ${input.skills.join(', ')}`)
  lines.push(`Original summary: ${input.summary}`)
  lines.push(
    '',
    'OUTPUT',
    `Feedback: ${output.feedback}`,
    `Rewritten summary: ${output.suggestion}`,
  )
  return lines.join('\n')
}

const clamp = (n: number) => Math.max(1, Math.min(5, Math.round(n)))

let _client: Anthropic | null = null
function client(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required to run evals (set it in server/.env).')
  }
  _client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  return _client
}

export async function judgeAnalysis(
  input: AnalyzeSummaryInput,
  output: SummaryAnalysisResult,
): Promise<JudgeVerdict> {
  const response = await client().messages.create({
    model: JUDGE_MODEL,
    max_tokens: 1024,
    temperature: 0, // deterministic grading
    system: JUDGE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildJudgeUserMessage(input, output) }],
    output_config: { format: JUDGE_OUTPUT_FORMAT },
  } as Anthropic.MessageCreateParamsNonStreaming)

  const block = response.content[0]
  if (!block || block.type !== 'text') throw new Error('Judge returned a non-text block')
  const raw = JSON.parse(block.text) as JudgeVerdict

  // Clamp scores defensively (the schema can't bound integers) before validating.
  for (const dim of RUBRIC_DIMENSIONS) raw.scores[dim] = clamp(raw.scores[dim])
  return JudgeVerdictSchema.parse(raw)
}
