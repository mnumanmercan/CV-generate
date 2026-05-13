import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

// Patches Zod's prototype with the `.openapi()` method the registry expects.
// Safe to call multiple times — the library no-ops on re-application.
extendZodWithOpenApi(z)
import {
  RegisterSchema,
  LoginSchema,
  AnalyzeSummarySchema,
  AnalyzeSummaryResponseSchema,
} from '@resumark/shared'

// Minimal OpenAPI spec covering the auth + AI endpoints — the surface most
// likely to be consumed by future external integrations or mobile clients.
// Add additional `registerPath` calls as new routes need documentation;
// schemas registered here can be re-used across multiple paths.

const registry = new OpenAPIRegistry()

const ErrorSchema = registry.register(
  'Error',
  z.object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
    requestId: z.string().optional(),
  }),
)

registry.register('Register', RegisterSchema)
registry.register('Login', LoginSchema)
registry.register('AnalyzeSummaryRequest', AnalyzeSummarySchema)
registry.register('AnalyzeSummaryResponse', AnalyzeSummaryResponseSchema)

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT (RS256)',
  description: 'Access token returned by /auth/login. Refresh handled via HttpOnly cookie.',
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/register',
  description: 'Create a new account. Returns an access token + sets the refresh cookie.',
  tags: ['auth'],
  request: {
    body: { content: { 'application/json': { schema: RegisterSchema } } },
  },
  responses: {
    201: {
      description: 'Account created',
      content: {
        'application/json': {
          schema: z.object({ success: z.literal(true), accessToken: z.string() }),
        },
      },
    },
    409: {
      description: 'Email already in use',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    429: { description: 'Rate-limited', content: { 'application/json': { schema: ErrorSchema } } },
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  description: 'Exchange credentials for an access token + refresh cookie.',
  tags: ['auth'],
  request: {
    body: { content: { 'application/json': { schema: LoginSchema } } },
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: z.object({ success: z.literal(true), accessToken: z.string() }),
        },
      },
    },
    401: {
      description: 'Invalid credentials',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    429: { description: 'Rate-limited', content: { 'application/json': { schema: ErrorSchema } } },
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/ai/analyze-summary',
  description: 'Ask Claude Haiku 4.5 to critique + rewrite a CV summary.',
  tags: ['ai'],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: AnalyzeSummarySchema } } },
  },
  responses: {
    200: {
      description: 'Analysis result',
      content: { 'application/json': { schema: AnalyzeSummaryResponseSchema } },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorSchema } } },
    429: {
      description: 'Per-user rate limit hit',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    503: {
      description: 'AI service not configured',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    504: {
      description: 'AI service timed out (30 s ceiling)',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
})

export function buildOpenApiSpec() {
  const generator = new OpenApiGeneratorV31(registry.definitions)
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Resumark API',
      version: '1.0.0',
      description:
        'REST API powering the Resumark CV builder. Only the auth + AI surface is documented here; CV / cover-letter / billing endpoints follow the same JSON envelope `{ success, data | error, requestId }`.',
    },
    servers: [{ url: '/api/v1', description: 'API root' }],
  })
}
