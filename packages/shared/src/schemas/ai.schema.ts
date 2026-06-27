import { z } from 'zod'

// A single prior role from the candidate's CV, sent only to ground the rewrite
// in real facts (prevents generic, fabricated output).
const ContextExperienceSchema = z.object({
  title: z.string().trim().max(150),
  company: z.string().trim().max(150).optional(),
})

// Request: what the client sends to /ai/analyze-summary.
// `summary` bounds match the system prompt's 50–500 character contract. The
// optional context fields let the model tailor the rewrite to the real target
// role and ground it in the candidate's actual experience/skills. Caps bound
// prompt size and abuse — the server is the contract owner. The client
// truncates to these limits before sending, so a long field never 400s.
export const AnalyzeSummarySchema = z.object({
  summary: z.string().trim().min(50).max(500),
  locale: z.enum(['en', 'tr']).default('en'),
  jobTitle: z.string().trim().max(150).optional(),
  skills: z.array(z.string().trim().max(60)).max(20).optional(),
  experience: z.array(ContextExperienceSchema).max(8).optional(),
})

// The structured shape Claude must return — drives `output_config.format` so
// the model emits schema-valid JSON instead of free-form text we have to
// regex-clean and shape-check. Intentionally free of length constraints:
// structured-output JSON schema does not support string min/max, and the SDK
// would otherwise enforce them client-side and reject a slightly-long
// suggestion. Length guidance lives in the system prompt instead.
export const SummaryAnalysisResultSchema = z.object({
  feedback: z.string(),
  suggestion: z.string(),
})

// Response: what the server returns on 200. Used by the controller (to shape
// the response) and the client composable (defensive validation in case a
// future server-side regression breaks the contract).
export const AnalyzeSummaryResponseSchema = z.object({
  success: z.literal(true),
  data: SummaryAnalysisResultSchema,
})

export type AnalyzeSummaryInput = z.infer<typeof AnalyzeSummarySchema>
export type SummaryAnalysisResult = z.infer<typeof SummaryAnalysisResultSchema>
export type AnalyzeSummaryResponse = z.infer<typeof AnalyzeSummaryResponseSchema>
