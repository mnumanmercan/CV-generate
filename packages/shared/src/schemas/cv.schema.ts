import { z } from 'zod'

const PersonalInfoSchema = z.object({
  fullName:     z.string().min(1).max(100),
  jobTitle:     z.string().min(1).max(100),
  email:        z.string().email().max(254),
  phone:        z.string().min(1).max(30),
  location:     z.string().min(1).max(100),
  linkedin:     z.string().url().optional().or(z.literal('')),
  github:       z.string().url().optional().or(z.literal('')),
  website:      z.string().url().optional().or(z.literal('')),
  profilePhoto: z.string().url().optional().or(z.literal('')),
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

const SECTION_KEYS = [
  'personal', 'summary', 'experience', 'education',
  'skills', 'projects', 'certifications',
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
  meta:           CVMetaSchema,
})

export const CreateCVSchema = z.object({
  content: CVDataSchema,
  title:   z.string().max(200).optional(),
})

export const UpdateCVSchema = z.object({
  content: CVDataSchema,
  title:   z.string().max(200).optional(),
})

export const PatchCVSchema = z.object({
  title: z.string().max(200).optional(),
}).refine(obj => Object.keys(obj).length > 0, { message: 'At least one field required' })

export type CVData = z.infer<typeof CVDataSchema>
