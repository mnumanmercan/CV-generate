// Types
export type {
  CVData,
  CVMeta,
  PersonalInfo,
  WorkExperience,
  Education,
  Skill,
  Project,
  Certification,
  Language,
  SectionKey,
  ShareStatus,
  PublicCV,
} from './types/cv.types.js'
export type { CoverLetterData } from './types/coverLetter.types.js'

// CV Schemas
export { CVDataSchema, CreateCVSchema, UpdateCVSchema, PatchCVSchema } from './schemas/cv.schema.js'

// Cover Letter Schemas
export { CoverLetterDataSchema, UpsertCoverLetterSchema } from './schemas/coverLetter.schema.js'

// Auth Schemas
export {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
  MigrateLocalDataSchema,
} from './schemas/auth.schema.js'

// Waitlist Schema
export { WaitlistSchema } from './schemas/waitlist.schema.js'

// AI Schemas
export {
  AnalyzeSummarySchema,
  SummaryAnalysisResultSchema,
  AnalyzeSummaryDataSchema,
  AnalyzeSummaryResponseSchema,
  SubmitFeedbackSchema,
  AnalyzeCoverLetterSchema,
  CoverLetterPartResultSchema,
  CoverLetterAnalysisResultSchema,
  AnalyzeCoverLetterDataSchema,
  AnalyzeCoverLetterResponseSchema,
  SubmitCoverLetterFeedbackSchema,
  type AnalyzeSummaryInput,
  type SummaryAnalysisResult,
  type AnalyzeSummaryData,
  type AnalyzeSummaryResponse,
  type SubmitFeedbackInput,
  type AnalyzeCoverLetterInput,
  type CoverLetterPartResult,
  type CoverLetterAnalysisResult,
  type AnalyzeCoverLetterData,
  type AnalyzeCoverLetterResponse,
  type SubmitCoverLetterFeedbackInput,
} from './schemas/ai.schema.js'

// AI Feedback taxonomy
export {
  FEEDBACK_VOTES,
  SUMMARY_FEEDBACK_REASONS,
  COVER_LETTER_PARTS,
  COVER_LETTER_FEEDBACK_REASONS,
  type FeedbackVoteValue,
  type SummaryFeedbackReason,
  type CoverLetterPartKey,
  type CoverLetterFeedbackReason,
} from './constants/aiFeedback.js'

// Constants
export {
  CV_LIMIT,
  TEMPLATE_PLAN_MAP,
  ALLOWED_TEMPLATES_BY_PLAN,
  STRIPE_GRACE_PERIOD_DAYS,
} from './constants/plans.js'
export { CV_LIMITS } from './constants/limits.js'
export {
  SHARED_SECTION_KEYS,
  VARIANT_SECTION_KEYS,
  CV_VARIANT_LIMIT,
} from './constants/variants.js'
