/**
 * Offline eval harness for the summary analyzer.
 *
 *   npm run eval:summary                  # grade the FREE tier (Haiku) with the judge
 *   npm run eval:summary -- --plan=pro    # grade the paid tier (Sonnet)
 *   npm run eval:summary -- --filter=tr-  # only cases whose id contains "tr-"
 *   npm run eval:summary -- --update-baseline   # save this run as the regression baseline
 *
 * Each case is run through the REAL generation path (generateSummaryAnalysis —
 * same prompt/model/parser as production, no DB write) and graded by the
 * LLM-as-judge. Exits non-zero on any fabrication failure or a pass-rate
 * regression vs. evals/baseline.json — wire it into a PROMPT_VERSION bump.
 */
import { config } from 'dotenv'
import { resolve } from 'node:path'

// Load server/.env before importing anything that reads env (env.ts has no auto-load).
config({ path: resolve(process.cwd(), '.env') })

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { z } from 'zod'
import { AnalyzeSummarySchema } from '@resumark/shared'
import type { Plan } from '@prisma/client'
import { generateSummaryAnalysis, modelForPlan } from '../src/services/ai.service.js'
import { SUMMARY_ANALYZER_PROMPT_VERSION } from '../src/prompts/summaryAnalyzer.js'
import { judgeAnalysis, RUBRIC_DIMENSIONS, JUDGE_MODEL, type JudgeVerdict } from './judge.js'

const EVAL_DIR = resolve(process.cwd(), 'evals')
const DATASET_PATH = resolve(EVAL_DIR, 'datasets/summary-cases.json')
const REPORTS_DIR = resolve(EVAL_DIR, 'reports')
const BASELINE_PATH = resolve(EVAL_DIR, 'baseline.json')

// Deterministic pass criteria (a case passes when all three hold).
const DIM_MIN = 3 // no single rubric dimension below this
const AVG_PASS = 3.5 // mean across dimensions at least this
const CONCURRENCY = 3 // parallel cases — gentle on the Anthropic rate limit

const CaseSchema = z.object({
  id: z.string(),
  locale: z.enum(['en', 'tr']),
  role: z.string(),
  qualityLevel: z.string(),
  notes: z.string().optional(),
  input: z.object({
    summary: z.string(),
    jobTitle: z.string().optional(),
    experience: z.array(z.object({ title: z.string(), company: z.string().optional() })).optional(),
    skills: z.array(z.string()).optional(),
  }),
})
const DatasetSchema = z.object({ datasetVersion: z.string(), cases: z.array(CaseSchema) })
type EvalCase = z.infer<typeof CaseSchema>

interface CaseResult {
  id: string
  locale: string
  role: string
  scores: JudgeVerdict['scores'] | null
  avg: number
  faithful: boolean
  fabrications: string[]
  pass: boolean
  suggestion: string
  error?: string
}

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (k: string) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1]
  const plan = (get('plan') ?? 'free').toUpperCase() as Plan
  return { plan, filter: get('filter'), updateBaseline: args.includes('--update-baseline') }
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const pct = (x: number) => `${(x * 100).toFixed(1)}%`
const f2 = (x: number) => x.toFixed(2)

async function mapPool<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

async function evalCase(c: EvalCase, model: string): Promise<CaseResult> {
  const base = { id: c.id, locale: c.locale, role: c.role }
  try {
    const input = AnalyzeSummarySchema.parse({ ...c.input, locale: c.locale })
    const { result } = await generateSummaryAnalysis(input, model)
    const verdict = await judgeAnalysis(input, result)
    const dims = RUBRIC_DIMENSIONS.map((d) => verdict.scores[d])
    const avg = mean(dims)
    const pass = verdict.faithful && Math.min(...dims) >= DIM_MIN && avg >= AVG_PASS
    return {
      ...base,
      scores: verdict.scores,
      avg,
      faithful: verdict.faithful,
      fabrications: verdict.fabrications,
      pass,
      suggestion: result.suggestion,
    }
  } catch (err) {
    return {
      ...base,
      scores: null,
      avg: 0,
      faithful: true, // unknown ≠ fabrication; errors are counted separately
      fabrications: [],
      pass: false,
      suggestion: '',
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('✗ ANTHROPIC_API_KEY is not set in server/.env — evals need it.')
    process.exit(1)
  }
  const { plan, filter, updateBaseline } = parseArgs()
  const model = modelForPlan(plan)

  const dataset = DatasetSchema.parse(JSON.parse(readFileSync(DATASET_PATH, 'utf8')))
  const cases = filter ? dataset.cases.filter((c) => c.id.includes(filter)) : dataset.cases
  if (!cases.length) {
    console.error(`✗ No cases matched filter "${filter}".`)
    process.exit(1)
  }

  console.log(
    `\nRunning ${cases.length} case(s) · under-test=${model} (${plan}) · judge=${JUDGE_MODEL} · prompt v${SUMMARY_ANALYZER_PROMPT_VERSION}\n`,
  )

  const results = await mapPool(cases, CONCURRENCY, (c) => evalCase(c, model))

  const ok = results.filter((r) => !r.error)
  const errored = results.length - ok.length
  const passRate = ok.length ? ok.filter((r) => r.pass).length / ok.length : 0
  const avgOverall = mean(ok.map((r) => r.avg))
  const fabricationFailures = results.filter((r) => !r.error && !r.faithful).length
  const perDim = Object.fromEntries(
    RUBRIC_DIMENSIONS.map((d) => [d, mean(ok.map((r) => r.scores![d]))]),
  ) as Record<string, number>

  // ── Per-case table ────────────────────────────────────────────────────────
  console.log('  case                       avg   faith  pass')
  console.log('  ' + '─'.repeat(46))
  for (const r of results) {
    if (r.error) {
      console.log(`  ${r.id.padEnd(26)} ERROR  ${r.error.slice(0, 40)}`)
      continue
    }
    const flag = r.pass ? '✓' : '✗'
    console.log(
      `  ${r.id.padEnd(26)} ${f2(r.avg)}  ${r.faithful ? ' ✓ ' : ' ✗ '}   ${flag}` +
        (r.fabrications.length ? `   ⚠ ${r.fabrications.join('; ').slice(0, 50)}` : ''),
    )
  }

  // ── Rubric means ──────────────────────────────────────────────────────────
  console.log('\n  rubric means (1–5):')
  for (const d of RUBRIC_DIMENSIONS) console.log(`    ${d.padEnd(24)} ${f2(perDim[d])}`)

  console.log(
    `\n  pass rate ${pct(passRate)}   overall avg ${f2(avgOverall)}   fabrications ${fabricationFailures}` +
      (errored ? `   errored ${errored}` : ''),
  )

  const report = {
    timestamp: new Date().toISOString(),
    promptVersion: SUMMARY_ANALYZER_PROMPT_VERSION,
    datasetVersion: dataset.datasetVersion,
    model,
    plan,
    judgeModel: JUDGE_MODEL,
    total: results.length,
    errored,
    passRate,
    avgOverall,
    fabricationFailures,
    perDim,
    cases: results,
  }
  mkdirSync(REPORTS_DIR, { recursive: true })
  const stamp = report.timestamp.replace(/[:.]/g, '-')
  writeFileSync(resolve(REPORTS_DIR, `${stamp}.json`), JSON.stringify(report, null, 2))
  writeFileSync(resolve(REPORTS_DIR, 'latest.json'), JSON.stringify(report, null, 2))

  // ── Regression gate ───────────────────────────────────────────────────────
  const failures: string[] = []
  if (fabricationFailures > 0) failures.push(`${fabricationFailures} fabrication failure(s)`)
  if (existsSync(BASELINE_PATH) && !updateBaseline) {
    const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as { passRate: number }
    if (passRate + 1e-9 < baseline.passRate) {
      failures.push(`pass rate ${pct(passRate)} < baseline ${pct(baseline.passRate)}`)
    }
    console.log(`\n  baseline: pass rate ${pct(baseline.passRate)} (prompt comparison)`)
  }

  if (updateBaseline) {
    writeFileSync(BASELINE_PATH, JSON.stringify(report, null, 2))
    console.log(`\n✓ Baseline updated → evals/baseline.json (pass rate ${pct(passRate)}).\n`)
    return
  }

  if (failures.length) {
    console.error(`\n✗ REGRESSION: ${failures.join(' · ')}\n`)
    process.exit(1)
  }
  console.log('\n✓ No regressions.\n')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
