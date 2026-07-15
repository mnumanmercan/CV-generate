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

// The four prose parts of a cover letter the AI analyzer reviews. Order matters:
// it is the reading order of the letter and the render order of result cards.
// Keys match the CoverLetterData field names exactly (they double as the
// client→server wire format and the store write targets).
export const COVER_LETTER_PARTS = ['opening', 'bodyWhy', 'bodyBring', 'closing'] as const
export type CoverLetterPartKey = (typeof COVER_LETTER_PARTS)[number]

// Downvote taxonomy for cover-letter analyses: the summary reasons plus
// REPETITIVE, which maps onto the coherence dimension unique to a multi-part
// letter (the same claim appearing in more than one part). Spelled out as a
// literal tuple (not spread from SUMMARY_FEEDBACK_REASONS) so z.enum() gets
// the literal types it requires; keep the shared codes in sync by hand.
export const COVER_LETTER_FEEDBACK_REASONS = [
  'INACCURATE',
  'TOO_GENERIC',
  'NOT_RELEVANT',
  'WRONG_TONE',
  'BAD_LANGUAGE',
  'REPETITIVE', // repeats a claim made in another part of the letter
  'OTHER',
] as const

export type CoverLetterFeedbackReason = (typeof COVER_LETTER_FEEDBACK_REASONS)[number]
