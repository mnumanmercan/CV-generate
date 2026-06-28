import { describe, expect, it } from 'vitest'
import {
  buildSummaryAnalyzerSystemPrompt,
  SUMMARY_ANALYZER_PROMPT_VERSION,
} from './summaryAnalyzer.js'

describe('summaryAnalyzer prompt', () => {
  it('is byte-stable across calls regardless of opts (keeps the prompt cache warm)', () => {
    expect(buildSummaryAnalyzerSystemPrompt()).toBe(
      buildSummaryAnalyzerSystemPrompt({ locale: 'tr', jobTitle: 'Backend Engineer' }),
    )
  })

  it('keeps the grounding rule and ships contrastive, bilingual examples', () => {
    const p = buildSummaryAnalyzerSystemPrompt()
    expect(p).toContain('GROUNDING')
    expect(p).toContain('EXAMPLES')
    expect(p).toContain('strong reference') // a "reference" example
    expect(p).toContain('Ideal rewrite') // a "transform" example
    expect(p).toContain('Principle:') // the distilled teaching signal
    expect(p).toContain('English')
    expect(p).toContain('Türkçe') // Turkish example present
  })

  it('exposes a semver-ish version string', () => {
    expect(SUMMARY_ANALYZER_PROMPT_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
