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

/**
 * A spoken / written language and the user's self-assessed proficiency.
 * `proficiency` is a free-form string so users can write whatever they like
 * (e.g. "C1", "Native or bilingual"), but the form offers a dropdown of
 * common levels to nudge consistent language across CVs.
 */
export interface Language {
  id: string
  name: string
  proficiency: string
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
  languages: Language[]
  meta: CVMeta
}

export type SectionKey = keyof Omit<CVData, 'meta'>

/** The 6 sections that participate in drag-to-reorder. Personal and Summary are always static. */
export const DRAGGABLE_SECTION_KEYS: readonly SectionKey[] = [
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
] as const

export const SECTION_LABELS: Record<SectionKey, string> = {
  personal: 'Personal Info',
  summary: 'Professional Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  languages: 'Languages',
}

/** Common proficiency levels offered in the form. Free-form input is still allowed. */
export const LANGUAGE_PROFICIENCY_LEVELS: readonly string[] = [
  'Native',
  'Fluent',
  'Professional',
  'Conversational',
  'Basic',
] as const

export const CURRENT_VERSION = '1.3.0'
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
  // v1.1.0 → v1.2.0: introduce `languages`
  // Fallback for blobs serialized before the field existed.
  if (!Array.isArray((stored as Partial<CVData>).languages)) {
    stored.languages = []
  }
  // Append 'languages' to existing sectionOrder if missing, so users who
  // already had a custom order keep their order with languages added at the end.
  if (!stored.meta.sectionOrder.includes('languages')) {
    stored.meta.sectionOrder = [...stored.meta.sectionOrder, 'languages']
  }
  // v1.2.0 → v1.3.0: introduce jobTitleColor
  if (!stored.personal.jobTitleColor) {
    stored.personal.jobTitleColor = 'accent'
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
      jobTitleColor: 'accent',
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
    languages: [],
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

export function createLanguage(): Language {
  return {
    id: crypto.randomUUID(),
    name: '',
    proficiency: '',
  }
}
