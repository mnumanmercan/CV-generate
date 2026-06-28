// Taxonomy for user feedback on an AI summary analysis.
//
// The downvote reason codes are deliberately the INVERSE of the eval rubric
// dimensions graded by the offline LLM-as-judge (server/evals): a `TOO_GENERIC`
// downvote maps onto the judge's *specificity* score, `INACCURATE` onto its
// *faithfulness* check, and so on. That alignment is the point — real-world
// error analysis then lines up 1:1 with the offline grader, and a spike in one
// reason tells you exactly which rubric dimension to target in the prompt.
//
// Keep three things in sync: this list, the judge rubric, and the i18n
// `ai.feedback.reasons.*` keys (en.ts / tr.ts).

export const FEEDBACK_VOTES = ['UP', 'DOWN'] as const
export type FeedbackVoteValue = (typeof FEEDBACK_VOTES)[number]

export const SUMMARY_FEEDBACK_REASONS = [
  'INACCURATE', // invented an employer / title / metric / skill not in the CV
  'TOO_GENERIC', // vague, no concrete specifics
  'NOT_RELEVANT', // doesn't fit the target role or real experience
  'WRONG_TONE', // tone or register is off
  'BAD_LANGUAGE', // unnatural phrasing or grammar (notably Turkish)
  'OTHER',
] as const

export type SummaryFeedbackReason = (typeof SUMMARY_FEEDBACK_REASONS)[number]
