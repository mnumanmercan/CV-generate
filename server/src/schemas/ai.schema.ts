import { z } from 'zod'

export const AnalyzeSummarySchema = z.object({
  summary: z.string().trim().min(50).max(500),
})

export type AnalyzeSummaryInput = z.infer<typeof AnalyzeSummarySchema>
