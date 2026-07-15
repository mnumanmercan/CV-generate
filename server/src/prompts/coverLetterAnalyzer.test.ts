import { describe, expect, it } from 'vitest'
import { COVER_LETTER_PARTS } from '@resumark/shared'
import {
  buildCoverLetterAnalyzerSystemPrompt,
  COVER_LETTER_ANALYZER_PROMPT_VERSION,
  _exampleBank,
} from './coverLetterAnalyzer.js'

describe('coverLetterAnalyzer prompt', () => {
  it('is byte-stable across calls regardless of opts (keeps the prompt cache warm)', () => {
    expect(buildCoverLetterAnalyzerSystemPrompt()).toBe(
      buildCoverLetterAnalyzerSystemPrompt({ locale: 'tr', jobTitle: 'Backend Engineer' }),
    )
  })

  it('contains all four expert rubrics, the coherence pass, and the grounding rule', () => {
    const p = buildCoverLetterAnalyzerSystemPrompt()
    expect(p).toContain('OPENING')
    expect(p).toContain('BODY_WHY')
    expect(p).toContain('BODY_BRING')
    expect(p).toContain('CLOSING')
    expect(p).toContain('COHERENCE')
    expect(p).toContain('GROUNDING')
    expect(p).toContain('return null') // the missing-part contract
  })

  it('ships contrastive, bilingual examples for every part', () => {
    const p = buildCoverLetterAnalyzerSystemPrompt()
    expect(p).toContain('EXAMPLES')
    expect(p).toContain('strong reference') // a "reference" example
    expect(p).toContain('Ideal rewrite') // a "transform" example
    expect(p).toContain('Principle:') // the distilled teaching signal
    expect(p).toContain('English')
    expect(p).toContain('Türkçe') // Turkish example present

    // Every part has at least one example, and every example targets a real part.
    for (const part of COVER_LETTER_PARTS) {
      expect(_exampleBank.some((ex) => ex.part === part)).toBe(true)
    }
    for (const ex of _exampleBank) {
      expect(COVER_LETTER_PARTS).toContain(ex.part)
    }
  })

  it('exposes a semver-ish version string', () => {
    expect(COVER_LETTER_ANALYZER_PROMPT_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
