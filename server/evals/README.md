# Summary-analyzer evals

A closed quality loop for the AI summary analyzer: **capture → collect → measure → improve → repeat.** It exists so a prompt change is shipped only when it's *proven* not to regress quality — and never silently starts fabricating.

## The loop

```
generate analysis ──► persisted (input + output + model + promptVersion + usage)
       │                         │ returns analysisId
       ▼                         ▼
  user votes 👍/👎 (+ reasons) ──► SummaryFeedback
       │
       ▼  [offline]
  export downvotes ──► curate into the golden dataset
       │                         │
       ▼                         ▼
  refine prompt + few-shot examples ──► eval:summary (LLM-as-judge)
       │                         │
       └──────── regression gate ◄┘   pass ⇒ bump PROMPT_VERSION ⇒ ship
```

## Pieces

| Path | What |
|---|---|
| `datasets/summary-cases.json` | Golden cases (roles × {en, tr} × quality; several fabrication-bait). |
| `judge.ts` | LLM-as-judge. Scores 6 rubric dimensions (1–5) + a binary **faithfulness** check that auto-fails on any invented fact. |
| `run.ts` | Runs each case through the real generation path, grades it, prints a scorecard, gates on regressions. |
| `export-downvotes.ts` | Pulls real downvotes into a curate-able dataset file. |
| `stats.ts` | Vote rate + downvote-reason mix by prompt version; usage by model. |
| `baseline.json` | The reference scorecard the gate compares against (committed). |

The rubric dimensions are the **inverse of the user-facing downvote reasons** (`packages/shared/src/constants/aiFeedback.ts`), so a spike in a downvote reason points straight at the rubric dimension — and the eval case — to fix.

## Commands (run from `server/`)

```bash
npm run eval:summary                    # grade FREE tier (Haiku), judged by Sonnet
npm run eval:summary -- --plan=pro      # grade the paid tier (Sonnet)
npm run eval:summary -- --filter=tr-    # only ids containing "tr-"
npm run eval:summary -- --update-baseline   # save this run as the new baseline
npm run eval:typecheck                  # type-check the harness
npm run eval:export-downvotes -- --limit=200
npm run eval:stats
```

Needs `ANTHROPIC_API_KEY` in `server/.env`. Override the judge with `EVAL_JUDGE_MODEL` (use an Opus model when grading the Sonnet tier, to avoid self-grading bias). A run writes `reports/<stamp>.json` + `reports/latest.json` (git-ignored).

## A case passes when

`faithful === true` **and** every rubric dimension ≥ 3 **and** the mean ≥ 3.5. The run exits non-zero on **any** fabrication failure or a pass-rate drop vs. `baseline.json`.

## Changing the prompt (the whole point)

1. Edit `src/prompts/summaryAnalyzer.ts` (base instructions or the few-shot bank).
2. Bump `SUMMARY_ANALYZER_PROMPT_VERSION`.
3. `npm run eval:summary` — confirm no regression, zero fabrications.
4. Happy with it? `npm run eval:summary -- --update-baseline` and commit.
5. After it ships, `npm run eval:stats` to watch real vote rates move across versions.

### Demonstrating the few-shot lift
To measure zero-shot vs. few-shot empirically, temporarily trim the example bank, run the harness, then restore it and compare the scorecards — the rubric means quantify what the examples buy you.

## Growing the dataset
Run `eval:export-downvotes`, read the cases, and fold the genuinely-bad ones into `summary-cases.json`. Real misses become permanent regression guards.
