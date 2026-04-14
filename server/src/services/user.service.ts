import { prisma } from '../db/prisma.js'
import { AppError } from '../utils/apiError.js'
import { buildUserResponse } from './auth.service.js'

export const userService = {
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })
    if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND')

    return {
      ...buildUserResponse(user),
      avatarUrl:     user.avatarUrl ?? null,
      emailVerified: user.emailVerified,
      subscription: user.subscription
        ? {
            status:            user.subscription.status,
            currentPeriodEnd:  user.subscription.currentPeriodEnd,
            cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
          }
        : null,
    }
  },

  async updateMe(userId: string, data: { name?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data:  { ...(data.name ? { name: data.name } : {}) },
    })
    return buildUserResponse(user)
  },

  async deleteAccount(userId: string): Promise<void> {
    // All related data cascades via onDelete: Cascade in Prisma schema
    await prisma.user.delete({ where: { id: userId } })
  },
}
