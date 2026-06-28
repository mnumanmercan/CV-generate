import { z } from 'zod'
import { FEEDBACK_VOTES, SUMMARY_FEEDBACK_REASONS } from '../constants/aiFeedback.js'

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
//
// Deliberately just feedback + suggestion — the model never emits `analysisId`
// (that's server-generated). Keep this schema in lockstep with the OUTPUT_FORMAT
// literal in server/src/services/ai.service.ts.
export const SummaryAnalysisResultSchema = z.object({
  feedback: z.string(),
  suggestion: z.string(),
})

// The 200 response `data`: the model output plus the server-generated
// `analysisId`. That id is the handle the client sends back when the user votes
// on this analysis (POST /ai/feedback), so each vote joins to its exact output.
export const AnalyzeSummaryDataSchema = SummaryAnalysisResultSchema.extend({
  analysisId: z.string().uuid(),
})

// Response: what the server returns on 200. Used by the controller (to shape
// the response) and the client composable (defensive validation in case a
// future server-side regression breaks the contract).
export const AnalyzeSummaryResponseSchema = z.object({
  success: z.literal(true),
  data: AnalyzeSummaryDataSchema,
})

export type AnalyzeSummaryInput = z.infer<typeof AnalyzeSummarySchema>
export type SummaryAnalysisResult = z.infer<typeof SummaryAnalysisResultSchema>
export type AnalyzeSummaryData = z.infer<typeof AnalyzeSummaryDataSchema>
export type AnalyzeSummaryResponse = z.infer<typeof AnalyzeSummaryResponseSchema>

// Request: a user's up/down vote on a prior analysis (POST /ai/feedback).
// `analysisId` is the handle returned by /ai/analyze-summary. `reasons` are only
// meaningful on a downvote and are constrained to the shared taxonomy; an upvote
// (or a downvote with no reason picked) simply omits them. The server enforces
// one vote per analysis (upsert) and that the analysis belongs to the caller.
export const SubmitFeedbackSchema = z.object({
  analysisId: z.string().uuid(),
  vote: z.enum(FEEDBACK_VOTES),
  reasons: z
    .array(z.enum(SUMMARY_FEEDBACK_REASONS))
    .max(SUMMARY_FEEDBACK_REASONS.length)
    .optional(),
})

export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackSchema>
