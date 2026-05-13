import { z } from 'zod'

// Request: what the client sends to /ai/analyze-summary.
// Bounds match the system prompt's 50–500 character contract.
export const AnalyzeSummarySchema = z.object({
  summary: z.string().trim().min(50).max(500),
})

// Response: what the server returns on 200. Used by both the controller (to
// shape the response) and the client composable (defensive validation in
// case a future server-side regression breaks the contract).
export const AnalyzeSummaryResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    feedback: z.string(),
    suggestion: z.string(),
  }),
})

export type AnalyzeSummaryInput = z.infer<typeof AnalyzeSummarySchema>
export type AnalyzeSummaryResponse = z.infer<typeof AnalyzeSummaryResponseSchema>
