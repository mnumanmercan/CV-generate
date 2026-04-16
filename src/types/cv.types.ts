export interface PersonalInfo {
  fullName: string
  jobTitle: string
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

export interface CVMeta {
  createdAt: string
  updatedAt: string
  version: string
  templateId: string
  sectionOrder?: SectionKey[]
}

export interface CVData {
  personal: PersonalInfo
  summary: string
  experience: WorkExperience[]
  education: Education[]
  skills: Skill[]
  projects: Project[]
  certifications: Certification[]
  meta: CVMeta
}

export type SectionKey = keyof Omit<CVData, 'meta'>

/** The 5 sections that participate in drag-to-reorder. Personal and Summary are always static. */
export const DRAGGABLE_SECTION_KEYS: readonly SectionKey[] = [
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
] as const

export const SECTION_LABELS: Record<SectionKey, string> = {
  personal: 'Personal Info',
  summary: 'Professional Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
}

export const CURRENT_VERSION = '1.1.0'
export const DEFAULT_TEMPLATE_ID = 'classic'

/**
 * Run all pending migrations on a blob loaded from storage.
 * Add a new `case` here for every schema version bump.
 */
export function migrateCVData(stored: CVData): CVData {
  // v1.0.0 → v1.1.0: populate missing sectionOrder
  if (!stored.meta.sectionOrder || stored.meta.sectionOrder.length === 0) {
    stored.meta.sectionOrder = [...DRAGGABLE_SECTION_KEYS]
  }
  // Stamp with current version so future migrations can gate on it.
  stored.meta.version = CURRENT_VERSION
  return stored
}

export function createEmptyCVData(): CVData {
  const now = new Date().toISOString()
  return {
    personal: {
      fullName: '',
      jobTitle: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      website: '',
      profilePhoto: '',
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    meta: {
      createdAt: now,
      updatedAt: now,
      version: CURRENT_VERSION,
      templateId: DEFAULT_TEMPLATE_ID,
    },
  }
}

export function createWorkExperience(): WorkExperience {
  return {
    id: crypto.randomUUID(),
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    location: '',
    bullets: [],
  }
}

export function createEducation(): Education {
  return {
    id: crypto.randomUUID(),
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    gpa: '',
  }
}

export function createSkill(): Skill {
  return {
    id: crypto.randomUUID(),
    category: '',
    items: [],
  }
}

export function createProject(): Project {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    techStack: [],
    link: '',
  }
}

export function createCertification(): Certification {
  return {
    id: crypto.randomUUID(),
    name: '',
    issuer: '',
    date: '',
    credentialId: '',
    credentialUrl: '',
  }
}
