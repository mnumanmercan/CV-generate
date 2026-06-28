# AI Integration — Techniques & Implementation

This document summarizes the AI techniques I used to make the **CV summary analyzer**
produce more effective, professional, and trustworthy output — and how each one is
applied in the codebase.

The feature asks an LLM (Claude) to critique a candidate's professional summary and
return a grounded rewrite. I treated it as a small but complete **AI Evals** problem:
improve the prompt, collect real user feedback, and *measure* every change instead of
guessing.

> **About the impact numbers:** values shown as `[X]` are produced by the offline
> eval harness (`npm run eval:summary`), which compares a new prompt against a committed
> baseline. I report measured numbers, not estimates — fitting for a feature whose core
> rule is "never fabricate a figure."

---

## 1. Base instruction + few-shot (contrastive) prompting

I separated a clear **base instruction** (the evaluation criteria) from a curated
**few-shot example bank**. The bank is *contrastive*: "transform" examples teach the
weak → strong rewrite, "reference" examples set the quality bar — each with a one-line
`principle` that is the real teaching signal. This moved the model from generic output
to specific, on-brand rewrites in both English and Turkish.

- **File:** `server/src/prompts/summaryAnalyzer.ts`
- **Impact:** `[X]%` higher eval pass-rate and `+[X]` rubric points vs. the zero-shot
  baseline (measure: `npm run eval:summary` before/after).

```ts
// Contrastive bank — good "reference" + bad "transform", each with a principle.
const EXAMPLE_BANK: FewShotExample[] = [
  {
    locale: 'en', role: 'Software Developer', kind: 'reference',
    suggestion:
      'Software developer with a decade building scalable web applications. Led a ' +
      'cloud-based SaaS platform that increased client retention by 20%, and cut ' +
      'server response time by 30% across several projects.',
    principle:
      'The power of specificity: names real systems and ties each to a number — ' +
      "but only with the candidate's real figures.",
  },
  // ...weak→strong transforms in EN + TR
]
const SYSTEM_PROMPT = BASE_INSTRUCTIONS + renderExamples(EXAMPLE_BANK)
```

---

## 2. Grounding rules (anti-hallucination)

The biggest risk on a real CV is the model inventing employers, metrics, or skills. I
added explicit **grounding rules**: use only facts in the input, and where a metric is
missing, insert a bracketed placeholder (`[X]%`) instead of making one up.

- **File:** `server/src/prompts/summaryAnalyzer.ts`
- **Impact:** zero fabrication failures enforced as a hard gate in the eval harness.

```text
GROUNDING — do not fabricate (critical, this is a real CV):
- Use ONLY facts present in the summary and the provided context.
- Only state a metric if it appears in the context; otherwise insert a clearly
  bracketed placeholder such as "[X]%" and tell the candidate to replace it.
- Never claim skills the context does not support.
```

---

## 3. Structured outputs (constrained JSON)

Instead of parsing free-form text, I constrain generation to a JSON schema, so the model
always returns schema-valid `{ feedback, suggestion }` — no markdown fences, no regex
clean-up, no shape surprises.

- **Files:** `server/src/services/ai.service.ts`, `packages/shared/src/schemas/ai.schema.ts`
- **Impact:** removed an entire class of parse/format errors; reliable, type-safe responses.

```ts
const OUTPUT_FORMAT = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: { feedback: { type: 'string' }, suggestion: { type: 'string' } },
    required: ['feedback', 'suggestion'],
    additionalProperties: false,
  },
}
// ...passed to the model so it emits schema-valid JSON:
output_config: { format: OUTPUT_FORMAT }
```

---

## 4. User feedback mechanism (the Evals signal)

I built a 👍/👎 voting mechanism on each AI output. On a downvote the user can also pick
**why** (reason chips). The reason taxonomy is deliberately the *inverse of the eval
rubric*, so a real-world complaint ("too generic") points straight at the rubric
dimension to fix. Every vote is stored against the exact analysis it refers to.

- **Files:** `packages/shared/src/constants/aiFeedback.ts`,
  `server/src/services/summaryFeedback.service.ts`, `src/components/form/SummaryForm.vue`
- **Impact:** turns subjective complaints into labeled data that drives the next prompt
  revision (human-in-the-loop, offline).

```ts
// Downvote reasons = inverse of the judge's rubric dimensions.
export const SUMMARY_FEEDBACK_REASONS = [
  'INACCURATE', 'TOO_GENERIC', 'NOT_RELEVANT', 'WRONG_TONE', 'BAD_LANGUAGE', 'OTHER',
] as const

// One vote per analysis; upsert lets the user flip it.
prisma.summaryFeedback.upsert({
  where: { analysisId },
  create: { analysisId, userId, vote, reasons },
  update: { vote, reasons },
})
```

---

## 5. LLM-as-judge (automated quality scoring)

To know whether a prompt change actually helps, I added an **LLM-as-judge**: a stronger
model scores each output on six rubric dimensions (1–5) plus a binary **faithfulness**
check that auto-fails on any invented fact. A case passes only if it is faithful and
clears the score thresholds.

- **Files:** `server/evals/judge.ts`, `server/evals/run.ts`
- **Impact:** quality became measurable; no prompt ships without a green scorecard.

```ts
// faithful = false if the rewrite states any employer/metric/skill NOT in the input.
const dims = RUBRIC_DIMENSIONS.map((d) => verdict.scores[d])
const pass = verdict.faithful && Math.min(...dims) >= 3 && mean(dims) >= 3.5
```

---

## 6. Golden dataset + regression gate

I curated a bilingual **golden dataset** (roles × EN/TR × quality levels, including
"fabrication-bait" cases) and a runner that gates on regressions: it fails on any
fabrication or a pass-rate drop versus the saved baseline.

- **Files:** `server/evals/datasets/summary-cases.json`, `server/evals/run.ts`,
  `server/evals/baseline.json`
- **Impact:** prompt changes are safe by default — a regression blocks the change.

```bash
npm run eval:summary -- --update-baseline   # save the reference scorecard
npm run eval:summary                         # later runs fail on any regression
```

---

## 7. Prompt versioning + usage telemetry (attribution & A/B)

Every analysis is persisted with the exact **prompt version**, model, token usage, and
latency. This is the spine that ties each output → each vote → each eval score back to
the prompt that produced it, enabling A/B comparison across revisions and cost tracking.

- **Files:** `server/prisma/schema.prisma` (`SummaryAnalysis`),
  `server/src/services/ai.service.ts`, `server/evals/stats.ts`
- **Impact:** can answer "did v1.1.0 actually beat v1.0.0?" with vote-rate and token data.

```ts
await prisma.summaryAnalysis.create({
  data: {
    input, output, model,
    promptVersion: SUMMARY_ANALYZER_PROMPT_VERSION,   // e.g. "1.1.0"
    inputTokens, outputTokens, cacheReadTokens, latencyMs,
  },
})
```

---

## 8. Cost & performance engineering

Three production-minded choices: **tiered model routing** (cheap/fast model for free
users, stronger model for paid), **prompt caching** of the static system prefix, and a
**pinned low temperature** for consistent, reproducible output.

- **File:** `server/src/services/ai.service.ts`
- **Impact:** lower cost per call and stable outputs that the eval harness can reproduce.

```ts
const FREE_MODEL = 'claude-haiku-4-5'
const PREMIUM_MODEL = 'claude-sonnet-4-6'      // tiered by plan

temperature: 0.4,                              // reproducible, not robotic
system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }]
```

---

## 9. Closing the loop (downvotes → new eval cases)

Real misses become permanent regression guards: a script exports downvoted analyses into
the golden-dataset shape so I can curate them back into the test set.

- **Files:** `server/evals/export-downvotes.ts`, `server/evals/stats.ts`
- **Impact:** the test set grows from real-world failures, not just my imagination.

```ts
const downvotes = await prisma.summaryFeedback.findMany({
  where: { vote: 'DOWN' },
  include: { analysis: true },
})
// → emit as eval cases → curate → merge into summary-cases.json
```

---

## How it all connects

```
generate (versioned, structured, grounded)  →  user votes 👍/👎 + reasons
        ↑                                              ↓
   refine prompt + few-shot   ←  LLM-as-judge  ←  export downvotes → golden dataset
        (ship only if the eval scorecard is green and faithful)
```

**Stack:** Claude (Anthropic SDK), TypeScript, Vue 3, Express, Prisma/PostgreSQL, Zod.

**To reproduce the measured impact:** set `ANTHROPIC_API_KEY` in `server/.env`, then run
`npm run eval:summary` (baseline) and again after a prompt change to fill in the `[X]`
values above.
