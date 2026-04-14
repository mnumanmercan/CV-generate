import { prisma } from '../db/prisma.js'
import { AppError } from '../utils/apiError.js'
import { CV_LIMIT, ALLOWED_TEMPLATES_BY_PLAN } from '@resumark/shared'
import type { CVData } from '@resumark/shared'
import type { Plan } from '@prisma/client'

function assertTemplateAllowed(templateId: string, plan: Plan): void {
  const allowed = ALLOWED_TEMPLATES_BY_PLAN[plan] ?? ['classic']
  if (!allowed.includes(templateId)) {
    throw new AppError(
      `Template '${templateId}' requires a Pro subscription.`,
      403,
      'TEMPLATE_NOT_ALLOWED',
    )
  }
}

export const cvService = {
  async list(userId: string) {
    const cvs = await prisma.cV.findMany({
      where:   { userId },
      orderBy: { updatedAt: 'desc' },
      select:  { id: true, title: true, updatedAt: true, content: true },
    })

    return cvs.map(cv => ({
      id:         cv.id,
      title:      cv.title,
      updatedAt:  cv.updatedAt,
      templateId: (cv.content as { meta?: { templateId?: string } })?.meta?.templateId ?? 'classic',
      content:    cv.content,
    }))
  },

  async create(userId: string, plan: Plan, content: CVData, title?: string) {
    const limit = CV_LIMIT[plan] ?? 1
    if (isFinite(limit)) {
      const count = await prisma.cV.count({ where: { userId } })
      if (count >= limit) {
        throw new AppError(
          `Free plan allows a maximum of ${limit} CV. Upgrade to Pro for unlimited CVs.`,
          402,
          'PLAN_LIMIT_EXCEEDED',
        )
      }
    }

    assertTemplateAllowed(content.meta.templateId, plan)

    return prisma.cV.create({
      data: {
        userId,
        content: content as unknown as object,
        title:   title ?? content.personal.fullName ?? 'My CV',
      },
    })
  },

  async get(userId: string, id: string) {
    const cv = await prisma.cV.findUnique({ where: { id } })
    if (!cv || cv.userId !== userId) {
      throw new AppError('CV not found.', 404, 'NOT_FOUND')
    }
    return cv
  },

  async update(userId: string, id: string, plan: Plan, content: CVData, title?: string) {
    const cv = await prisma.cV.findUnique({ where: { id } })
    if (!cv || cv.userId !== userId) {
      throw new AppError('CV not found.', 404, 'NOT_FOUND')
    }

    assertTemplateAllowed(content.meta.templateId, plan)

    return prisma.cV.update({
      where: { id },
      data: {
        content: content as unknown as object,
        ...(title !== undefined ? { title } : {}),
      },
    })
  },

  async patch(userId: string, id: string, title: string) {
    const cv = await prisma.cV.findUnique({ where: { id } })
    if (!cv || cv.userId !== userId) {
      throw new AppError('CV not found.', 404, 'NOT_FOUND')
    }
    return prisma.cV.update({ where: { id }, data: { title } })
  },

  async delete(userId: string, id: string) {
    const cv = await prisma.cV.findUnique({ where: { id } })
    if (!cv || cv.userId !== userId) {
      throw new AppError('CV not found.', 404, 'NOT_FOUND')
    }
    await prisma.cV.delete({ where: { id } })
  },
}
