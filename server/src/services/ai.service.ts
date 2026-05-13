import Anthropic from '@anthropic-ai/sdk'
import { env } from '../config/env.js'
import { AppError } from '../utils/apiError.js'

let _anthropic: Anthropic | null = null

function getAnthropicClient() {
  if (!_anthropic) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new AppError('AI service not configured', 503, 'AI_NOT_CONFIGURED')
    }
    _anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  }
  return _anthropic
}

const SUMMARY_ANALYZER_SYSTEM_PROMPT = `
You are a senior CV/resume specialist and ATS optimization expert.

Your job is to analyze a professional summary and return some feedback on how to improve it, along with a rewritten version that incorporates your suggestions.

When analyzing the summary, consider the following criteria:
1. Specific, actionable feedback (2-3 sentences)
2. A rewritten version that fixes the issues you identified

Evaluate the summary against these criteria:
- Action verb strength (Led, Built, Delivered) vs. weak phrases ("responsible for", "worked on")
- Quantifiable impact (numbers, percentages, scope)
- ATS-friendliness (plain text, common industry keywords)
- Length: 50-500 characters
- Specificity: concrete claims, not generic statements

Respond in the same language as the input summary (English in → English out, Turkish in → Turkish out).

Output format — STRICT:
Respond with ONLY a single JSON object. No markdown code fences. No text before or after.
Schema: {"feedback": string, "suggestion": string}
- feedback: 2-3 sentences of specific critique
- suggestion: a rewritten summary, 50-500 characters, plain text
`

// Hard ceiling on a single Anthropic call. Haiku 4.5 typically responds in
// 1–3 s for a 500-char input; 30 s is generous enough to absorb the long
// tail of network jitter and Anthropic rate-limit retries while still
// freeing the request slot if their API goes dark.
const AI_REQUEST_TIMEOUT_MS = 30_000

export const aiService = {
  async analyzeSummary(summary: string): Promise<{ feedback: string; suggestion: string }> {
    const anthropic = getAnthropicClient()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS)
    let response
    try {
      response = await anthropic.messages.create(
        {
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: SUMMARY_ANALYZER_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: summary }],
        },
        { signal: controller.signal },
      )
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AppError('AI service did not respond in time.', 504, 'AI_TIMEOUT')
      }
      throw err
    } finally {
      clearTimeout(timeout)
    }
    // Parse the JSON response from the AI model
    const block = response.content[0]

    if (block.type !== 'text') {
      throw new AppError('AI response invalid', 502, 'AI_INVALID_RESPONSE')
    }

    try {
      const cleaned = block.text
        .trim()
        .replace(/^```(?:json)?\n?/, '')
        .replace(/\n?```$/, '')

      const parsed = JSON.parse(cleaned)

      if (typeof parsed.feedback !== 'string' || typeof parsed.suggestion !== 'string') {
        throw new AppError('AI returned unexpected shape', 502, 'AI_INVALID_SHAPE')
      }

      return { feedback: parsed.feedback, suggestion: parsed.suggestion }
    } catch (error) {
      if (error instanceof AppError) throw error // bypass parsing error catch
      console.error('AI parse failed. Raw response:', block.text, 'Error:', error)
      throw new AppError('AI returned malformed JSON', 502, 'AI_PARSE_ERROR')
    }
  },
}
