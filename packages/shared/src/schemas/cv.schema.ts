import { z } from 'zod'

// ─── Strict schemas ───────────────────────────────────────────────────────────
// Used for completeness scoring and future "validate before export" endpoints.
// These enforce all business rules: non-empty required fields, date format, etc.

const PersonalInfoSchema = z.object({
  fullName:      z.string().min(1).max(100),
  jobTitle:      z.string().min(1).max(100),
  jobTitleColor: z.enum(['accent', 'dark']).optional(),
  email:         z.string().email().max(254),
  phone:         z.string().min(1).max(30),
  location:      z.string().min(1).max(100),
  linkedin:      z.string().url().optional().or(z.literal('')),
  github:        z.string().url().optional().or(z.literal('')),
  website:       z.string().url().optional().or(z.literal('')),
  profilePhoto:  z.string().url().optional().or(z.literal('')),
})

const WorkExperienceSchema = z.object({
  id:        z.string().uuid(),
  company:   z.string().min(1).max(200),
  position:  z.string().min(1).max(200),
  startDate: z.string().min(1).max(20),
  endDate:   z.string().min(1).max(20), // 'Present' or date string
  location:  z.string().max(100).optional(),
  bullets:   z.array(z.string().max(500)).max(20),
})

const EducationSchema = z.object({
  id:          z.string().uuid(),
  institution: z.string().min(1).max(200),
  degree:      z.string().min(1).max(200),
  field:       z.string().min(1).max(200),
  startDate:   z.string().min(1).max(20),
  endDate:     z.string().min(1).max(20),
  gpa:         z.string().max(10).optional(),
})

const SkillSchema = z.object({
  id:       z.string().uuid(),
  category: z.string().min(1).max(100),
  items:    z.array(z.string().max(100)).max(50),
})

const ProjectSchema = z.object({
  id:          z.string().uuid(),
  name:        z.string().min(1).max(200),
  description: z.string().max(1000),
  techStack:   z.array(z.string().max(50)).max(30),
  link:        z.string().url().optional().or(z.literal('')),
})

const CertificationSchema = z.object({
  id:            z.string().uuid(),
  name:          z.string().min(1).max(200),
  issuer:        z.string().min(1).max(200),
  date:          z.string().regex(/^\d{2}\/\d{4}$/, 'Format must be MM/YYYY'),
  credentialId:  z.string().max(100).optional(),
  credentialUrl: z.string().url().optional().or(z.literal('')),
})

const LanguageSchema = z.object({
  id:          z.string().uuid(),
  name:        z.string().min(1).max(100),
  proficiency: z.string().max(50),
})

const SECTION_KEYS = [
  'personal', 'summary', 'experience', 'education',
  'skills', 'projects', 'certifications', 'languages',
] as const

const CVMetaSchema = z.object({
  createdAt:    z.string(),
  updatedAt:    z.string(),
  version:      z.string().max(20),
  templateId:   z.enum(['classic', 'modern', 'technical']),
  sectionOrder: z.array(z.enum(SECTION_KEYS)).optional(),
})

export const CVDataSchema = z.object({
  personal:       PersonalInfoSchema,
  summary:        z.string().max(2000),
  experience:     z.array(WorkExperienceSchema).max(20),
  education:      z.array(EducationSchema).max(10),
  skills:         z.array(SkillSchema).max(20),
  projects:       z.array(ProjectSchema).max(20),
  certifications: z.array(CertificationSchema).max(20),
  languages:      z.array(LanguageSchema).max(30),
  meta:           CVMetaSchema,
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
  fullName:      z.string().max(100),
  jobTitle:      z.string().max(100),
  jobTitleColor: z.enum(['accent', 'dark']).optional(),
  email:         z.string().max(254),
  phone:         z.string().max(30),
  location:      z.string().max(100),
  linkedin:      z.string().max(500).optional().or(z.literal('')),
  github:        z.string().max(500).optional().or(z.literal('')),
  website:       z.string().max(500).optional().or(z.literal('')),
  profilePhoto:  z.string().max(2048).optional().or(z.literal('')),
})

const DraftWorkExperienceSchema = z.object({
  id:        z.string().uuid(),
  company:   z.string().max(200),
  position:  z.string().max(200),
  startDate: z.string().max(20),
  endDate:   z.string().max(20),
  location:  z.string().max(100).optional(),
  bullets:   z.array(z.string().max(500)).max(20),
})

const DraftEducationSchema = z.object({
  id:          z.string().uuid(),
  institution: z.string().max(200),
  degree:      z.string().max(200),
  field:       z.string().max(200),
  startDate:   z.string().max(20),
  endDate:     z.string().max(20),
  gpa:         z.string().max(10).optional(),
})

const DraftSkillSchema = z.object({
  id:       z.string().uuid(),
  category: z.string().max(100),
  items:    z.array(z.string().max(100)).max(50),
})

const DraftProjectSchema = z.object({
  id:          z.string().uuid(),
  name:        z.string().max(200),
  description: z.string().max(1000),
  techStack:   z.array(z.string().max(50)).max(30),
  link:        z.string().max(500).optional().or(z.literal('')),
})

const DraftCertificationSchema = z.object({
  id:            z.string().uuid(),
  name:          z.string().max(200),
  issuer:        z.string().max(200),
  date:          z.string().max(7),
  credentialId:  z.string().max(100).optional(),
  credentialUrl: z.string().max(500).optional().or(z.literal('')),
})

const DraftLanguageSchema = z.object({
  id:          z.string().uuid(),
  name:        z.string().max(100),
  proficiency: z.string().max(50),
})

export const DraftCVDataSchema = z.object({
  personal:       DraftPersonalInfoSchema,
  summary:        z.string().max(2000),
  experience:     z.array(DraftWorkExperienceSchema).max(20),
  education:      z.array(DraftEducationSchema).max(10),
  skills:         z.array(DraftSkillSchema).max(20),
  projects:       z.array(DraftProjectSchema).max(20),
  certifications: z.array(DraftCertificationSchema).max(20),
  languages:      z.array(DraftLanguageSchema).max(30),
  meta:           CVMetaSchema,
})

// ─── API request schemas ──────────────────────────────────────────────────────
// Save endpoints use DraftCVDataSchema — accept work-in-progress state.
// PatchCVSchema (title-only update) is not content-related, stays unchanged.

export const CreateCVSchema = z.object({
  content: DraftCVDataSchema,
  title:   z.string().max(200).optional(),
})

export const UpdateCVSchema = z.object({
  content: DraftCVDataSchema,
  title:   z.string().max(200).optional(),
})

export const PatchCVSchema = z.object({
  title: z.string().max(200).optional(),
}).refine(obj => Object.keys(obj).length > 0, { message: 'At least one field required' })

export type CVData = z.infer<typeof CVDataSchema>
export type DraftCVData = z.infer<typeof DraftCVDataSchema>
