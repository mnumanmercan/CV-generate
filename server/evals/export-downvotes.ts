/**
 * Close the loop: turn real downvotes into eval cases.
 *
 *   npm run eval:export-downvotes              # newest 100 downvoted analyses
 *   npm run eval:export-downvotes -- --limit=300
 *
 * Joins SummaryFeedback (vote=DOWN) to its SummaryAnalysis, emits each input in
 * the golden-dataset shape, and writes evals/datasets/downvotes-<stamp>.json.
 * Review + curate those cases, then fold the good ones into summary-cases.json
 * so the harness regression-guards against failures users actually hit.
 */
import { config } from 'dotenv'
import { resolve } from 'node:path'

config({ path: resolve(process.cwd(), '.env') })

import { writeFileSync, mkdirSync } from 'node:fs'
import { AnalyzeSummarySchema } from '@resumark/shared'
import { prisma } from '../src/db/prisma.js'

async function main() {
  const limitArg = process.argv
    .slice(2)
    .find((a) => a.startsWith('--limit='))
    ?.split('=')[1]
  const take = Math.max(1, Math.min(2000, Number(limitArg) || 100))

  const downvotes = await prisma.summaryFeedback.findMany({
    where: { vote: 'DOWN' },
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      reasons: true,
      analysis: { select: { id: true, input: true, model: true, promptVersion: true } },
    },
  })

  const cases = downvotes.flatMap((d) => {
    const parsed = AnalyzeSummarySchema.safeParse(d.analysis.input)
    if (!parsed.success) return [] // skip rows whose stored input no longer matches the schema
    const inp = parsed.data
    return [
      {
        id: `dv-${d.analysis.id.slice(0, 8)}`,
        locale: inp.locale,
        role: inp.jobTitle ?? 'Unknown',
        qualityLevel: 'downvoted',
        notes: `Real downvote · reasons: ${d.reasons.join(', ') || 'none'} · prompt v${d.analysis.promptVersion} · ${d.analysis.model}`,
        input: {
          summary: inp.summary,
          jobTitle: inp.jobTitle,
          experience: inp.experience,
          skills: inp.skills,
        },
      },
    ]
  })

  const out = {
    datasetVersion: `downvotes-${new Date().toISOString().slice(0, 10)}`,
    description:
      'Auto-exported downvoted analyses. Review + curate, then merge worthy cases into summary-cases.json.',
    cases,
  }

  const dir = resolve(process.cwd(), 'evals/datasets')
  mkdirSync(dir, { recursive: true })
  const path = resolve(dir, `downvotes-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  writeFileSync(path, JSON.stringify(out, null, 2))

  console.log(
    `\n✓ Exported ${cases.length} downvoted case(s) of ${downvotes.length} fetched → ${path}\n` +
      '  Curate them, then merge into evals/datasets/summary-cases.json.\n',
  )
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
