import { z } from 'zod'

export const RegisterSchema = z.object({
  name:     z.string().min(1).max(100).trim(),
  email:    z.string().email().max(254).toLowerCase(),
  password: z.string().min(8).max(128),
})

export const LoginSchema = z.object({
  email:    z.string().email().max(254).toLowerCase(),
  password: z.string().min(1).max(128),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email().max(254).toLowerCase(),
})

export const ResetPasswordSchema = z.object({
  token:       z.string().min(1),
  newPassword: z.string().min(8).max(128),
})

export const VerifyEmailSchema = z.object({
  token: z.string().min(1),
})

export const MigrateLocalDataSchema = z.object({
  cvData:          z.record(z.unknown()).optional(),
  coverLetterData: z.record(z.unknown()).optional(),
})
