// ATS compliance utilities — no external deps, pure functions

export interface ATSWarning {
  field: string
  message: string
  severity: 'error' | 'warning' | 'hint'
}

// ─── Standard ATS section headings ──────────────────────────────────────────
const STANDARD_HEADINGS: Record<string, string> = {
  'work experience': 'Work Experience',
  experience: 'Work Experience',
  employment: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  'technical skills': 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  certificates: 'Certifications',
  summary: 'Professional Summary',
  'professional summary': 'Professional Summary',
  objective: 'Professional Summary',
}

// ─── Date format validation (MM/YYYY) ───────────────────────────────────────
const DATE_REGEX = /^(0[1-9]|1[0-2])\/\d{4}$/

export function validateDateFormat(date: string): boolean {
  if (date === 'Present' || date === '') return true
  return DATE_REGEX.test(date)
}

export function validateDateRange(start: string, end: string): boolean {
  if (!validateDateFormat(start) || !validateDateFormat(end)) return false
  if (end === 'Present') return true

  const [startMonth, startYear] = start.split('/').map(Number)
  const [endMonth, endYear] = end.split('/').map(Number)

  if (startYear !== endYear) return (endYear ?? 0) > (startYear ?? 0)
  return (endMonth ?? 0) >= (startMonth ?? 0)
}

// ─── Enforce standard section naming ────────────────────────────────────────
export function normalizeHeading(raw: string): string {
  const lower = raw.toLowerCase().trim()
  return STANDARD_HEADINGS[lower] ?? raw
}

// ─── Strip ATS-unfriendly special characters from section headers ────────────
export function stripSpecialChars(text: string): string {
  return text.replace(/[^\w\s\-.,()&/]/g, '').trim()
}

// ─── Summary analysis ───────────────────────────────────────────────────────
export function analyzeSummary(summary: string): ATSWarning[] {
  const warnings: ATSWarning[] = []
  const len = summary.trim().length

  if (len > 0 && len < 50) {
    warnings.push({
      field: 'summary',
      message: `Summary is too short (${len} chars). ATS scanners prefer 50–500 characters.`,
      severity: 'warning',
    })
  }

  if (len > 500) {
    warnings.push({
      field: 'summary',
      message: `Summary is too long (${len} chars). Keep under 500 characters for ATS compatibility.`,
      severity: 'warning',
    })
  }

  return warnings
}

// ─── Bullet point analysis ───────────────────────────────────────────────────
export function analyzeBullet(bullet: string, index: number): ATSWarning[] {
  const warnings: ATSWarning[] = []
  const len = bullet.trim().length

  if (len > 120) {
    warnings.push({
      field: `bullet_${index}`,
      message: `Bullet point ${index + 1} is ${len} chars — ATS recommends under 120.`,
      severity: 'warning',
    })
  }

  return warnings
}

// ─── Keyword density hint ────────────────────────────────────────────────────
const WEAK_PHRASES = [
  'responsible for',
  'worked on',
  'helped with',
  'assisted in',
  'duties included',
]

export function getKeywordHints(summary: string): string[] {
  const hints: string[] = []
  const lower = summary.toLowerCase()

  for (const phrase of WEAK_PHRASES) {
    if (lower.includes(phrase)) {
      hints.push(
        `Avoid weak phrase "${phrase}" — use strong action verbs like "Led", "Built", "Delivered".`,
      )
    }
  }

  // Word count hint
  const wordCount = summary.trim().split(/\s+/).filter(Boolean).length
  if (wordCount < 30 && wordCount > 0) {
    hints.push('Add more keywords relevant to your target role to increase ATS match rate.')
  }

  return hints
}

// ─── URL validation ──────────────────────────────────────────────────────────
export function validateUrl(url: string): boolean {
  if (!url) return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// ─── Email validation (RFC-compliant) ────────────────────────────────────────
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/

export function validateEmail(email: string): boolean {
  if (!email) return false
  return EMAIL_REGEX.test(email)
}

// ─── Phone validation (E.164 or local) ───────────────────────────────────────
const PHONE_REGEX = /^(\+?[\d\s\-().]{7,20})$/

export function validatePhone(phone: string): boolean {
  if (!phone) return false
  return PHONE_REGEX.test(phone.trim())
}

// ─── Aggregate CV-level warnings ─────────────────────────────────────────────
import type { CVData } from '@/types/cv.types'

export function getFullCVWarnings(cv: CVData): ATSWarning[] {
  const warnings: ATSWarning[] = []

  warnings.push(...analyzeSummary(cv.summary))

  for (const exp of cv.experience) {
    if (!validateDateFormat(exp.startDate)) {
      warnings.push({
        field: `exp_${exp.id}_startDate`,
        message: `Work experience "${exp.company}": start date must be MM/YYYY.`,
        severity: 'error',
      })
    }
    if (exp.endDate !== 'Present' && !validateDateFormat(exp.endDate)) {
      warnings.push({
        field: `exp_${exp.id}_endDate`,
        message: `Work experience "${exp.company}": end date must be MM/YYYY or "Present".`,
        severity: 'error',
      })
    }
    exp.bullets.forEach((b, i) => warnings.push(...analyzeBullet(b, i)))
  }

  for (const edu of cv.education) {
    if (!validateDateFormat(edu.startDate) || !validateDateFormat(edu.endDate)) {
      warnings.push({
        field: `edu_${edu.id}`,
        message: `Education "${edu.institution}": dates must be MM/YYYY.`,
        severity: 'error',
      })
    }
  }

  return warnings
}
