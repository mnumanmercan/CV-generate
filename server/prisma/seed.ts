/**
 * Seed script — creates two test users for local development.
 *
 * Run:  npx tsx prisma/seed.ts
 *
 * Pro user  → pro123@gmail.com   / Pro123   (plan=PRO  + active Subscription)
 * Free user → free123@gmail.com  / Free123  (plan=FREE, no Subscription)
 *
 * Safe to re-run: uses upsert so existing records are updated, not duplicated.
 */

import { config } from 'dotenv'
import { resolve } from 'node:path'

// Load server/.env before anything else (prisma.config.ts disables auto-loading)
config({ path: resolve(process.cwd(), '.env') })

import bcrypt from 'bcryptjs'
import { PrismaClient, Plan, SubscriptionStatus } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['warn', 'error'],
})

const BCRYPT_ROUNDS = 12

async function main() {
  console.log('🌱  Seeding database...\n')

  // ── 1. Free user ──────────────────────────────────────────────────────────

  const freePasswordHash = await bcrypt.hash('Free123', BCRYPT_ROUNDS)

  const freeUser = await prisma.user.upsert({
    where:  { email: 'free123@gmail.com' },
    update: { passwordHash: freePasswordHash, plan: Plan.FREE, emailVerified: true },
    create: {
      email:         'free123@gmail.com',
      name:          'FreeUser',
      passwordHash:  freePasswordHash,
      plan:          Plan.FREE,
      emailVerified: true,
    },
  })

  console.log(`✅  Free user   id=${freeUser.id}  email=${freeUser.email}  plan=${freeUser.plan}`)

  // ── 2. Pro user + Subscription ────────────────────────────────────────────

  const proPasswordHash = await bcrypt.hash('Pro123', BCRYPT_ROUNDS)

  const proUser = await prisma.user.upsert({
    where:  { email: 'pro123@gmail.com' },
    update: { passwordHash: proPasswordHash, plan: Plan.PRO, emailVerified: true },
    create: {
      email:         'pro123@gmail.com',
      name:          'ProUser',
      passwordHash:  proPasswordHash,
      plan:          Plan.PRO,
      emailVerified: true,
    },
  })

  console.log(`✅  Pro user    id=${proUser.id}  email=${proUser.email}  plan=${proUser.plan}`)

  const now = new Date()
  const oneYearLater = new Date(now)
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)

  const subscription = await prisma.subscription.upsert({
    where:  { userId: proUser.id },
    update: {
      status:              SubscriptionStatus.ACTIVE,
      currentPeriodStart:  now,
      currentPeriodEnd:    oneYearLater,
      gracePeriodEndsAt:   null,
      cancelAtPeriodEnd:   false,
    },
    create: {
      userId:              proUser.id,
      stripeCustomerId:    'cus_test_pro123',
      stripeSubscriptionId:'sub_test_pro123',
      stripePriceId:       'price_test_monthly',
      status:              SubscriptionStatus.ACTIVE,
      currentPeriodStart:  now,
      currentPeriodEnd:    oneYearLater,
      gracePeriodEndsAt:   null,
      cancelAtPeriodEnd:   false,
    },
  })

  console.log(`   └─ Subscription  id=${subscription.id}  status=${subscription.status}  expires=${oneYearLater.toISOString().split('T')[0]}`)

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log('\n📋  Test credentials:')
  console.log('   Free  →  free123@gmail.com  /  Free123  (plan=FREE)')
  console.log('   Pro   →  pro123@gmail.com   /  Pro123   (plan=PRO)')
  console.log('\n✔   Seed complete.')
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
