import 'dotenv/config'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { prisma } from './db/prisma.js'

async function main() {
  // Verify DB connection before starting
  await prisma.$connect()
  console.log('✅  Database connected')

  const app = createApp()

  app.listen(env.PORT, () => {
    console.log(`🚀  Resumark API running on http://localhost:${env.PORT}`)
    console.log(`📋  Environment: ${env.NODE_ENV}`)
  })
}

main().catch((err) => {
  console.error('❌  Failed to start server:', err)
  process.exit(1)
})
