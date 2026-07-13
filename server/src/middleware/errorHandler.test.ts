/**
 * errorHandler must translate body-parser failures into typed envelopes:
 * an oversized body is a 413 (client's problem, surfaced as "CV too large"),
 * malformed JSON is a 400 — neither is a 500. AppErrors keep their status.
 */
import { describe, expect, it, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { errorHandler } from './errorHandler.js'
import { AppError } from '../utils/apiError.js'

function makeRes(): Response & { statusCode?: number; body?: unknown } {
  const res = {
    statusCode: undefined as number | undefined,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(payload: unknown) {
      res.body = payload
      return res
    },
  }
  return res as unknown as Response & { statusCode?: number; body?: unknown }
}

const fakeReq = { id: 'req-1', log: { error: vi.fn() } } as unknown as Request
const next = (() => {}) as NextFunction

function bodyOf(res: { body?: unknown }): { error: { code: string } } {
  return res.body as { error: { code: string } }
}

describe('errorHandler', () => {
  it('returns 413 PAYLOAD_TOO_LARGE for body-parser entity.too.large errors', () => {
    const err = Object.assign(new Error('request entity too large'), {
      type: 'entity.too.large',
      statusCode: 413,
    })
    const res = makeRes()
    errorHandler(err, fakeReq, res, next)

    expect(res.statusCode).toBe(413)
    expect(bodyOf(res).error.code).toBe('PAYLOAD_TOO_LARGE')
  })

  it('returns 400 INVALID_JSON for malformed request bodies', () => {
    const err = Object.assign(new Error('Unexpected token'), {
      type: 'entity.parse.failed',
      statusCode: 400,
    })
    const res = makeRes()
    errorHandler(err, fakeReq, res, next)

    expect(res.statusCode).toBe(400)
    expect(bodyOf(res).error.code).toBe('INVALID_JSON')
  })

  it('keeps AppError status codes (422 validation regression)', () => {
    const res = makeRes()
    errorHandler(new AppError('Validation failed', 422, 'VALIDATION_ERROR'), fakeReq, res, next)

    expect(res.statusCode).toBe(422)
    expect(bodyOf(res).error.code).toBe('VALIDATION_ERROR')
  })

  it('falls back to 500 for unexpected errors', () => {
    const res = makeRes()
    errorHandler(new Error('boom'), fakeReq, res, next)

    expect(res.statusCode).toBe(500)
    expect(bodyOf(res).error.code).toBe('INTERNAL_SERVER_ERROR')
  })
})
