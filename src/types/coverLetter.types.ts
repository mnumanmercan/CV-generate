export interface CoverLetterData {
  fullName:       string
  jobTitle:       string
  email:          string
  phone:          string
  location:       string
  date:           string
  recipientName:  string
  recipientTitle: string
  companyName:    string
  companyAddress: string
  opening:        string
  bodyWhy:        string
  bodyBring:      string
  closing:        string
  signature:      string
  meta: {
    createdAt: string
    updatedAt: string
    version:   string
  }
}

export function createEmptyCoverLetterData(): CoverLetterData {
  const now = new Date().toISOString()
  return {
    fullName:       '',
    jobTitle:       '',
    email:          '',
    phone:          '',
    location:       '',
    date:           new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    recipientName:  '',
    recipientTitle: '',
    companyName:    '',
    companyAddress: '',
    opening:        '',
    bodyWhy:        '',
    bodyBring:      '',
    closing:        '',
    signature:      'Sincerely,',
    meta: { createdAt: now, updatedAt: now, version: '1.0.0' },
  }
}
