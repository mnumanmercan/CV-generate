import 'dotenv/config'
import type { Server } from 'node:http'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { prisma } from './db/prisma.js'

/**
 * Graceful shutdown on SIGTERM / SIGINT.
 *
 * Why it matters: Railway (and any orchestrator) sends SIGTERM before
 * SIGKILL. Without graceful shutdown:
 *   - In-flight requests get dropped mid-response.
 *   - Prisma connections leak back to PG until the idle timeout fires.
 *   - A webhook being processed when the restart happens gets retried by
 *     Stripe — which is now idempotent, but still better to finish cleanly.
 *
 * We give active requests up to 10 s to complete, then force-exit. The 10 s
 * budget matches Railway's default kill-after-SIGTERM window.
 */
const SHUTDOWN_TIMEOUT_MS = 10_000

async function shutdown(server: Server, signal: string): Promise<void> {
  console.log(`\n🛑  ${signal} received — starting graceful shutdown`)

  // Force-exit if cleanup hangs (e.g. a long-running request won't finish).
  const killTimer = setTimeout(() => {
    console.error('❌  Shutdown timed out — forcing exit')
    process.exit(1)
  }, SHUTDOWN_TIMEOUT_MS)
  killTimer.unref() // don't keep the event loop alive just for this timer

  try {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()))
    })
    console.log('   ↳ HTTP server closed')

    await prisma.$disconnect()
    console.log('   ↳ Prisma disconnected')

    console.log('✅  Shutdown complete')
    clearTimeout(killTimer)
    process.exit(0)
  } catch (err) {
    console.error('❌  Error during shutdown:', err)
    clearTimeout(killTimer)
    process.exit(1)
  }
}

async function main(): Promise<void> {
  // Verify DB connection before starting
  await prisma.$connect()
  console.log('✅  Database connected')

  const app = createApp()
  const server = app.listen(env.PORT, () => {
    console.log(`🚀  Resumark API running on http://localhost:${env.PORT}`)
    console.log(`📋  Environment: ${env.NODE_ENV}`)
  })

  // Register signal handlers
  process.on('SIGTERM', () => { void shutdown(server, 'SIGTERM') })
  process.on('SIGINT',  () => { void shutdown(server, 'SIGINT')  })

  // Surface unhandled errors — exit so the orchestrator restarts us.
  process.on('unhandledRejection', (reason) => {
    console.error('❌  Unhandled promise rejection:', reason)
    void shutdown(server, 'unhandledRejection')
  })
  process.on('uncaughtException', (err) => {
    console.error('❌  Uncaught exception:', err)
    void shutdown(server, 'uncaughtException')
  })
}

main().catch((err) => {
  console.error('❌  Failed to start server:', err)
  process.exit(1)
})
