// Mirror of frontend src/types/coverLetter.types.ts

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
  signature: string
  meta: {
    createdAt: string
    updatedAt: string
    version: string
  }
}
