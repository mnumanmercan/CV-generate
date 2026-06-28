/**
 * Feedback + usage stats, broken down by prompt version — the payoff of
 * versioning every analysis. Compare vote rates across prompt revisions to see
 * whether a change actually helped real users, and read the downvote-reason mix
 * to know which rubric dimension to target next.
 *
 *   npm run eval:stats
 */
import { config } from 'dotenv'
import { resolve } from 'node:path'

config({ path: resolve(process.cwd(), '.env') })

import { prisma } from '../src/db/prisma.js'

const pct = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(1)}%` : '—')
const k = (n: number | null) => (n == null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`)

async function main() {
  const [analysesByVersion, usageByModel, feedback] = await Promise.all([
    prisma.summaryAnalysis.groupBy({ by: ['promptVersion'], _count: { _all: true } }),
    prisma.summaryAnalysis.groupBy({
      by: ['model'],
      _count: { _all: true },
      _sum: { inputTokens: true, outputTokens: true, cacheReadTokens: true },
      _avg: { latencyMs: true },
    }),
    prisma.summaryFeedback.findMany({
      select: { vote: true, reasons: true, analysis: { select: { promptVersion: true } } },
    }),
  ])

  if (!analysesByVersion.length) {
    console.log('\nNo analyses recorded yet.\n')
    return
  }

  const votes: Record<string, { up: number; down: number }> = {}
  const reasonCounts: Record<string, number> = {}
  for (const f of feedback) {
    const v = f.analysis.promptVersion
    votes[v] ??= { up: 0, down: 0 }
    if (f.vote === 'UP') votes[v].up++
    else {
      votes[v].down++
      for (const r of f.reasons) reasonCounts[r] = (reasonCounts[r] ?? 0) + 1
    }
  }

  // ── Per prompt version ──────────────────────────────────────────────────
  console.log('\n  prompt        analyses  votes   up  down   up%    vote%')
  console.log('  ' + '─'.repeat(56))
  for (const row of analysesByVersion.sort((a, b) =>
    a.promptVersion < b.promptVersion ? -1 : 1,
  )) {
    const v = row.promptVersion
    const a = row._count._all
    const { up, down } = votes[v] ?? { up: 0, down: 0 }
    const total = up + down
    console.log(
      `  ${v.padEnd(12)}  ${String(a).padStart(8)}  ${String(total).padStart(5)}  ` +
        `${String(up).padStart(3)}  ${String(down).padStart(4)}  ${pct(up, total).padStart(5)}  ${pct(total, a).padStart(6)}`,
    )
  }

  // ── Downvote reasons ────────────────────────────────────────────────────
  const reasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])
  if (reasons.length) {
    console.log('\n  downvote reasons:')
    for (const [r, n] of reasons) console.log(`    ${r.padEnd(16)} ${n}`)
  }

  // ── Per model usage ─────────────────────────────────────────────────────
  console.log('\n  model                 analyses  in-tok  out-tok  cache  avg-ms')
  console.log('  ' + '─'.repeat(58))
  for (const m of usageByModel) {
    console.log(
      `  ${m.model.padEnd(20)}  ${String(m._count._all).padStart(8)}  ` +
        `${k(m._sum.inputTokens).padStart(6)}  ${k(m._sum.outputTokens).padStart(7)}  ` +
        `${k(m._sum.cacheReadTokens).padStart(5)}  ${(m._avg.latencyMs?.toFixed(0) ?? '—').padStart(6)}`,
    )
  }
  console.log('')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
