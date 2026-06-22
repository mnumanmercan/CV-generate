// Mirror of frontend src/types/cv.types.ts
// Keep in sync with the frontend interface — this is the source of truth for the shared package.

export interface PersonalInfo {
  fullName: string
  jobTitle: string
  jobTitleColor?: 'accent' | 'dark'
  email: string
  phone: string
  location: string
  linkedin?: string
  github?: string
  website?: string
  profilePhoto?: string
}

export interface WorkExperience {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string | 'Present'
  location?: string
  bullets: string[]
}

export interface Education {
  id: string
  institution: string
  degree: string
  field: string
  startDate: string
  endDate: string
  gpa?: string
}

export interface Skill {
  id: string
  category: string
  items: string[]
}

export interface Project {
  id: string
  name: string
  description: string
  techStack: string[]
  link?: string
}

export interface Certification {
  id: string
  name: string
  issuer: string
  date: string
  credentialId?: string
  credentialUrl?: string
}

export interface Language {
  id: string
  name: string
  proficiency: string
}

export type SectionKey =
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'

export interface CVMeta {
  createdAt: string
  updatedAt: string
  version: string
  templateId: string
  sectionOrder?: SectionKey[]
  /** When true, Education joins Certifications & Languages as a third column in the compact bottom row. */
  educationInColumns?: boolean
}

export interface CVData {
  personal: PersonalInfo
  summary: string
  experience: WorkExperience[]
  education: Education[]
  skills: Skill[]
  projects: Project[]
  certifications: Certification[]
  languages: Language[]
  meta: CVMeta
}

/** Share-link state for a CV. `slug` is null when the CV is private. */
export interface ShareStatus {
  slug: string | null
}

/** Payload returned by the unauthenticated public-CV endpoint. */
export interface PublicCV {
  title: string
  content: CVData
}
