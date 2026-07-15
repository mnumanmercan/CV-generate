export interface CoverLetterData {
  fullName: string
  jobTitle: string
  email: string
  phone: string
  location: string
  date: string
  recipientName: string
  recipientTitle: string
  companyName: string
  companyAddress: string
  opening: string
  bodyWhy: string
  bodyBring: string
  closing: string
  // Optional pasted job posting; the AI analyzer uses it to tailor feedback.
  targetJobDescription: string
  signature: string
  meta: {
    createdAt: string
    updatedAt: string
    version: string
  }
}

export const COVER_LETTER_CURRENT_VERSION = '1.1.0'

export function createEmptyCoverLetterData(): CoverLetterData {
  const now = new Date().toISOString()
  return {
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: '',
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    recipientName: '',
    recipientTitle: '',
    companyName: '',
    companyAddress: '',
    opening: '',
    bodyWhy: '',
    bodyBring: '',
    closing: '',
    targetJobDescription: '',
    signature: 'Sincerely,',
    meta: { createdAt: now, updatedAt: now, version: COVER_LETTER_CURRENT_VERSION },
  }
}

/**
 * Migrate a stored cover letter to the current shape. Runs on every
 * loadFromStorage() — the cover-letter counterpart of migrateCVData(), added
 * with the first schema change the letter has had.
 *
 * Ladder:
 * - 1.0.0 → 1.1.0 — introduce `targetJobDescription` (default '')
 */
export function migrateCoverLetterData(stored: CoverLetterData): CoverLetterData {
  if (typeof (stored as Partial<CoverLetterData>).targetJobDescription !== 'string') {
    stored.targetJobDescription = ''
  }
  stored.meta.version = COVER_LETTER_CURRENT_VERSION
  return stored
}
