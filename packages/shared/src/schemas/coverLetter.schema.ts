import { z } from 'zod'

const CoverLetterMetaSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.string().max(20),
})

export const CoverLetterDataSchema = z.object({
  fullName: z.string().min(1).max(100),
  jobTitle: z.string().max(100),
  email: z.string().email().max(254),
  phone: z.string().max(30),
  location: z.string().max(100),
  date: z.string().max(50),
  recipientName: z.string().max(100),
  recipientTitle: z.string().max(100),
  companyName: z.string().max(200),
  companyAddress: z.string().max(300),
  opening: z.string().max(500),
  bodyWhy: z.string().max(2000),
  bodyBring: z.string().max(2000),
  closing: z.string().max(500),
  // Optional pasted job posting used by the AI analyzer to tailor feedback.
  // .default('') keeps payloads from older clients (and older stored blobs)
  // parsing — without it, validate() would 400 every save from a stale client.
  targetJobDescription: z.string().max(5000).default(''),
  signature: z.string().max(100),
  meta: CoverLetterMetaSchema,
})

export const UpsertCoverLetterSchema = z.object({
  content: CoverLetterDataSchema,
})

export type CoverLetterData = z.infer<typeof CoverLetterDataSchema>
