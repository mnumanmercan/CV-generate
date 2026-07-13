import { z } from 'zod'
import { CV_LIMITS } from '../constants/limits.js'

// ─── Strict schemas ───────────────────────────────────────────────────────────
// Used for completeness scoring and future "validate before export" endpoints.
// These enforce all business rules: non-empty required fields, date format, etc.
// All size caps come from CV_LIMITS (constants/limits.ts) — the same values the
// builder forms use as input maxlengths.

const PersonalInfoSchema = z.object({
  fullName: z.string().min(1).max(CV_LIMITS.personal.fullName),
  jobTitle: z.string().min(1).max(CV_LIMITS.personal.jobTitle),
  jobTitleColor: z.enum(['accent', 'dark']).optional(),
  email: z.string().email().max(CV_LIMITS.personal.email),
  phone: z.string().min(1).max(CV_LIMITS.personal.phone),
  location: z.string().min(1).max(CV_LIMITS.personal.location),
  linkedin: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  profilePhoto: z.string().url().optional().or(z.literal('')),
})

const WorkExperienceSchema = z.object({
  id: z.string().uuid(),
  company: z.string().min(1).max(CV_LIMITS.experience.company),
  position: z.string().min(1).max(CV_LIMITS.experience.position),
  startDate: z.string().min(1).max(CV_LIMITS.experience.date),
  endDate: z.string().min(1).max(CV_LIMITS.experience.date), // 'Present' or date string
  location: z.string().max(CV_LIMITS.experience.location).optional(),
  bullets: z
    .array(z.string().max(CV_LIMITS.experience.bullet))
    .max(CV_LIMITS.experience.maxBullets),
})

const EducationSchema = z.object({
  id: z.string().uuid(),
  institution: z.string().min(1).max(CV_LIMITS.education.institution),
  degree: z.string().min(1).max(CV_LIMITS.education.degree),
  field: z.string().min(1).max(CV_LIMITS.education.field),
  startDate: z.string().min(1).max(CV_LIMITS.education.date),
  endDate: z.string().min(1).max(CV_LIMITS.education.date),
  gpa: z.string().max(CV_LIMITS.education.gpa).optional(),
})

const SkillSchema = z.object({
  id: z.string().uuid(),
  category: z.string().min(1).max(CV_LIMITS.skills.category),
  items: z.array(z.string().max(CV_LIMITS.skills.item)).max(CV_LIMITS.skills.maxItemsPerCategory),
})

const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(CV_LIMITS.projects.name),
  description: z.string().max(CV_LIMITS.projects.description),
  techStack: z.array(z.string().max(CV_LIMITS.projects.techItem)).max(CV_LIMITS.projects.maxTech),
  link: z.string().url().optional().or(z.literal('')),
})

const CertificationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(CV_LIMITS.certifications.name),
  issuer: z.string().min(1).max(CV_LIMITS.certifications.issuer),
  date: z.string().regex(/^\d{2}\/\d{4}$/, 'Format must be MM/YYYY'),
  credentialId: z.string().max(CV_LIMITS.certifications.credentialId).optional(),
  credentialUrl: z.string().url().optional().or(z.literal('')),
})

const LanguageSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(CV_LIMITS.languages.name),
  proficiency: z.string().max(CV_LIMITS.languages.proficiency),
})

const SECTION_KEYS = [
  'personal',
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
] as const

const CVMetaSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.string().max(20),
  templateId: z.enum(['classic', 'modern', 'technical']),
  sectionOrder: z.array(z.enum(SECTION_KEYS)).optional(),
  educationInColumns: z.boolean().optional(),
})

export const CVDataSchema = z.object({
  personal: PersonalInfoSchema,
  summary: z.string().max(CV_LIMITS.summary.max),
  experience: z.array(WorkExperienceSchema).max(CV_LIMITS.experience.maxItems),
  education: z.array(EducationSchema).max(CV_LIMITS.education.maxItems),
  skills: z.array(SkillSchema).max(CV_LIMITS.skills.maxItems),
  projects: z.array(ProjectSchema).max(CV_LIMITS.projects.maxItems),
  certifications: z.array(CertificationSchema).max(CV_LIMITS.certifications.maxItems),
  languages: z.array(LanguageSchema).max(CV_LIMITS.languages.maxItems),
  meta: CVMetaSchema,
})

// ─── Draft schemas ────────────────────────────────────────────────────────────
// Used by CreateCVSchema / UpdateCVSchema (the save endpoints).
//
// A CV in progress is always incomplete: required fields are empty right after
// clicking "Add Certification", auto-save fires within 500 ms, and the server
// must accept that state — saving is not publishing.
//
// Rules relaxed vs. the strict schemas above:
//   • All required string fields: min(1) removed → allows empty string
//   • Email: .email() removed → allows partial / in-progress value
//   • Optional URL fields: .url() removed → allows mid-typing (e.g. "https://li…")
//   • Certification date: regex removed → allows empty or partial date
//   • All .max(N) size caps are kept for abuse prevention
//   • Item UUIDs (.uuid()) are kept — client always uses crypto.randomUUID()
//   • CVMetaSchema (templateId enum, sectionOrder enum) stays strict — the
//     service layer's assertTemplateAllowed() checks templateId independently
//     and would throw 403 for an unknown value regardless

const DraftPersonalInfoSchema = z.object({
  fullName: z.string().max(CV_LIMITS.personal.fullName),
  jobTitle: z.string().max(CV_LIMITS.personal.jobTitle),
  jobTitleColor: z.enum(['accent', 'dark']).optional(),
  email: z.string().max(CV_LIMITS.personal.email),
  phone: z.string().max(CV_LIMITS.personal.phone),
  location: z.string().max(CV_LIMITS.personal.location),
  linkedin: z.string().max(CV_LIMITS.personal.url).optional().or(z.literal('')),
  github: z.string().max(CV_LIMITS.personal.url).optional().or(z.literal('')),
  website: z.string().max(CV_LIMITS.personal.url).optional().or(z.literal('')),
  profilePhoto: z.string().max(CV_LIMITS.personal.profilePhoto).optional().or(z.literal('')),
})

const DraftWorkExperienceSchema = z.object({
  id: z.string().uuid(),
  company: z.string().max(CV_LIMITS.experience.company),
  position: z.string().max(CV_LIMITS.experience.position),
  startDate: z.string().max(CV_LIMITS.experience.date),
  endDate: z.string().max(CV_LIMITS.experience.date),
  location: z.string().max(CV_LIMITS.experience.location).optional(),
  bullets: z
    .array(z.string().max(CV_LIMITS.experience.bullet))
    .max(CV_LIMITS.experience.maxBullets),
})

const DraftEducationSchema = z.object({
  id: z.string().uuid(),
  institution: z.string().max(CV_LIMITS.education.institution),
  degree: z.string().max(CV_LIMITS.education.degree),
  field: z.string().max(CV_LIMITS.education.field),
  startDate: z.string().max(CV_LIMITS.education.date),
  endDate: z.string().max(CV_LIMITS.education.date),
  gpa: z.string().max(CV_LIMITS.education.gpa).optional(),
})

const DraftSkillSchema = z.object({
  id: z.string().uuid(),
  category: z.string().max(CV_LIMITS.skills.category),
  items: z.array(z.string().max(CV_LIMITS.skills.item)).max(CV_LIMITS.skills.maxItemsPerCategory),
})

const DraftProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(CV_LIMITS.projects.name),
  description: z.string().max(CV_LIMITS.projects.description),
  techStack: z.array(z.string().max(CV_LIMITS.projects.techItem)).max(CV_LIMITS.projects.maxTech),
  link: z.string().max(CV_LIMITS.projects.link).optional().or(z.literal('')),
})

const DraftCertificationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(CV_LIMITS.certifications.name),
  issuer: z.string().max(CV_LIMITS.certifications.issuer),
  date: z.string().max(CV_LIMITS.certifications.date),
  credentialId: z.string().max(CV_LIMITS.certifications.credentialId).optional(),
  credentialUrl: z
    .string()
    .max(CV_LIMITS.certifications.credentialUrl)
    .optional()
    .or(z.literal('')),
})

const DraftLanguageSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(CV_LIMITS.languages.name),
  proficiency: z.string().max(CV_LIMITS.languages.proficiency),
})

export const DraftCVDataSchema = z.object({
  personal: DraftPersonalInfoSchema,
  summary: z.string().max(CV_LIMITS.summary.max),
  experience: z.array(DraftWorkExperienceSchema).max(CV_LIMITS.experience.maxItems),
  education: z.array(DraftEducationSchema).max(CV_LIMITS.education.maxItems),
  skills: z.array(DraftSkillSchema).max(CV_LIMITS.skills.maxItems),
  projects: z.array(DraftProjectSchema).max(CV_LIMITS.projects.maxItems),
  certifications: z.array(DraftCertificationSchema).max(CV_LIMITS.certifications.maxItems),
  languages: z.array(DraftLanguageSchema).max(CV_LIMITS.languages.maxItems),
  meta: CVMetaSchema,
})

// ─── API request schemas ──────────────────────────────────────────────────────
// Save endpoints use DraftCVDataSchema — accept work-in-progress state.
// PatchCVSchema (title-only update) is not content-related, stays unchanged.

export const CreateCVSchema = z.object({
  content: DraftCVDataSchema,
  title: z.string().max(CV_LIMITS.cvTitle).optional(),
})

export const UpdateCVSchema = z.object({
  content: DraftCVDataSchema,
  title: z.string().max(CV_LIMITS.cvTitle).optional(),
})

export const PatchCVSchema = z
  .object({
    title: z.string().max(CV_LIMITS.cvTitle).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: 'At least one field required' })

export type CVData = z.infer<typeof CVDataSchema>
export type DraftCVData = z.infer<typeof DraftCVDataSchema>
