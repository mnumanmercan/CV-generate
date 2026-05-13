import { pinoHttp } from 'pino-http'
import { nanoid } from 'nanoid'
import { logger } from '../utils/logger.js'

// pino-http attaches `req.log` (a child logger bound to this request's id)
// and emits one structured line per request. `genReqId` returns the existing
// X-Request-Id header when present (so an upstream proxy / load-balancer's
// correlation ID flows through) and otherwise mints a short nanoid.
export const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const incoming = req.headers['x-request-id']
    const id = typeof incoming === 'string' && incoming.length > 0 ? incoming : nanoid(12)
    res.setHeader('x-request-id', id)
    return id
  },
  // Quiet successful health probes — they'd otherwise spam logs every few
  // seconds when liveness/readiness probes are wired into k8s/Render/etc.
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error'
    if (res.statusCode >= 400) return 'warn'
    if (req.url?.startsWith('/health')) return 'debug'
    return 'info'
  },
})
