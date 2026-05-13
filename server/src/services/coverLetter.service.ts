import { prisma } from '../db/prisma.js'
import { AppError } from '../utils/apiError.js'
import { toPrismaJson } from '../utils/jsonb.js'
import type { CoverLetterData } from '@resumark/shared'

export const coverLetterService = {
  async get(userId: string) {
    const cl = await prisma.coverLetter.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })
    return cl ? cl.content : null
  },

  async upsert(userId: string, content: CoverLetterData) {
    const existing = await prisma.coverLetter.findFirst({ where: { userId } })
    if (existing) {
      return prisma.coverLetter.update({
        where: { id: existing.id },
        data: { content: toPrismaJson(content) },
      })
    }
    return prisma.coverLetter.create({
      data: {
        userId,
        content: toPrismaJson(content),
        title: `${content.fullName || 'My'} Cover Letter`,
      },
    })
  },

  async delete(userId: string) {
    const existing = await prisma.coverLetter.findFirst({ where: { userId } })
    if (!existing) throw new AppError('Cover letter not found.', 404, 'NOT_FOUND')
    await prisma.coverLetter.delete({ where: { id: existing.id } })
  },
}
