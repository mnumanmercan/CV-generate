import { randomBytes } from 'node:crypto'
import { prisma } from '../db/prisma.js'
import { AppError } from '../utils/apiError.js'
import { toPrismaJson } from '../utils/jsonb.js'
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

// Fetch a CV and assert the caller owns it, mirroring the 404-on-mismatch
// pattern used everywhere else in this service (a 403 would leak existence).
async function findOwnedCV(userId: string, id: string) {
  const cv = await prisma.cV.findUnique({ where: { id } })
  if (!cv || cv.userId !== userId) {
    throw new AppError('CV not found.', 404, 'NOT_FOUND')
  }
  return cv
}

// 16 random bytes (~128 bits) base64url-encoded → a short, URL-safe slug that
// is infeasible to guess or enumerate. Loops on the rare unique collision.
async function generateUniqueSlug(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = randomBytes(16).toString('base64url')
    const existing = await prisma.cV.findUnique({ where: { shareSlug: slug } })
    if (!existing) return slug
  }
  throw new AppError('Could not generate a share link. Please try again.', 500, 'INTERNAL')
}

export const cvService = {
  async list(userId: string) {
    // Slim list — don't read the JSONB `content` blob just to count rows or
    // render dashboard cards. Callers that need the full document (e.g. the
    // editor's load flow) follow up with `cvService.get(userId, id)`.
    return prisma.cV.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true },
    })
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
        content: toPrismaJson(content),
        title: title ?? content.personal.fullName ?? 'My CV',
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

  // Most-recently-updated CV *with* its content, in a single query. The editor's
  // cold load uses this instead of a slim `list()` (to resolve the id) followed
  // by `get()` (to fetch the content) — halving the load to one round-trip.
  // Returns null when the user has no CV yet (a new account).
  async getLatest(userId: string) {
    return prisma.cV.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })
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
        content: toPrismaJson(content),
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

  // ─── Public sharing ──────────────────────────────────────────────────────
  // A non-null `shareSlug` makes the CV readable at GET /public/cv/:slug.

  async getShareStatus(userId: string, id: string): Promise<{ slug: string | null }> {
    const cv = await findOwnedCV(userId, id)
    return { slug: cv.shareSlug }
  },

  // Idempotent — returns the existing slug if already shared, otherwise mints one.
  async share(userId: string, id: string): Promise<{ slug: string }> {
    const cv = await findOwnedCV(userId, id)
    if (cv.shareSlug) return { slug: cv.shareSlug }
    const slug = await generateUniqueSlug()
    await prisma.cV.update({ where: { id }, data: { shareSlug: slug } })
    return { slug }
  },

  // Always assigns a fresh slug — the previous URL stops resolving immediately.
  async regenerateShare(userId: string, id: string): Promise<{ slug: string }> {
    await findOwnedCV(userId, id)
    const slug = await generateUniqueSlug()
    await prisma.cV.update({ where: { id }, data: { shareSlug: slug } })
    return { slug }
  },

  async unshare(userId: string, id: string): Promise<void> {
    await findOwnedCV(userId, id)
    await prisma.cV.update({ where: { id }, data: { shareSlug: null } })
  },

  // Unauthenticated read. Returns ONLY title + content — never userId, the row
  // id, or timestamps, so the public response leaks no owner identity beyond
  // what the user deliberately put inside their CV.
  async getPublicBySlug(slug: string): Promise<{ title: string; content: CVData }> {
    const cv = await prisma.cV.findUnique({
      where: { shareSlug: slug },
      select: { title: true, content: true },
    })
    if (!cv) {
      throw new AppError('CV not found.', 404, 'NOT_FOUND')
    }
    return { title: cv.title, content: cv.content as unknown as CVData }
  },
}
