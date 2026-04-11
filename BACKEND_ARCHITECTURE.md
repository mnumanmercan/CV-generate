# CVForge — Backend Architecture & Project Plan

> **Project:** ATS Friendly Professional CV Generator  
> **Phase:** 2 — Backend Integration  
> **Prerequisite:** Phase 1 (Vue 3 frontend with localStorage) must be complete  
> **Last Updated:** 2026-04-07

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Design](#4-database-design)
5. [API Design](#5-api-design)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Payment System Integration](#7-payment-system-integration)
8. [Storage & File Management](#8-storage--file-management)
9. [Environment Configuration](#9-environment-configuration)
10. [Development Phases & Milestones](#10-development-phases--milestones)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Security Checklist](#12-security-checklist)

---

## 1. Architecture Overview

CVForge uses a **decoupled monorepo** architecture with a clear separation between the frontend client and the backend API server.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Vue 3)                       │
│          localhost:5173  /  https://cvforge.app             │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS / REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   API SERVER (Node.js + Express)            │
│              localhost:3000  /  https://api.cvforge.app     │
│                                                             │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │    Routes   │  │  Middleware  │  │    Controllers   │  │
│   │  /auth      │  │  auth guard  │  │  CVController    │  │
│   │  /cv        │  │  rate limit  │  │  AuthController  │  │
│   │  /user      │  │  validation  │  │  UserController  │  │
│   │  /payment   │  │  error hand. │  │  PaymentCtrl     │  │
│   └─────────────┘  └──────────────┘  └──────────────────┘  │
└──────────────┬──────────────────┬───────────────────────────┘
               │                  │
    ┌──────────▼───────┐  ┌───────▼──────────┐
    │   MongoDB Atlas  │  │  Cloudinary /    │
    │   (Primary DB)   │  │  AWS S3 (Files)  │
    └──────────────────┘  └──────────────────┘
               │
    ┌──────────▼───────┐
    │  Redis (Cache +  │
    │  Session Store)  │
    └──────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Runtime | Node.js | 18+ LTS | Server runtime |
| Framework | Express.js | 4.x | HTTP server & routing |
| Language | TypeScript | 5.x | Type safety |
| Database | MongoDB | 7.x | Primary data store |
| ODM | Mongoose | 8.x | MongoDB object modeling |
| Cache / Sessions | Redis | 7.x | Token blacklist, rate limit |
| Authentication | JWT + bcrypt | — | Stateless auth |
| OAuth | Passport.js | 0.7.x | Google / GitHub login |
| Payments | Stripe | Latest | Subscription billing |
| File Storage | Cloudinary | 2.x | CV exports, profile photos |
| Email | Nodemailer + Resend | — | Transactional emails |
| Validation | Zod | 3.x | Request schema validation |
| Testing | Vitest + Supertest | — | Unit & integration tests |
| API Docs | Swagger / OpenAPI | 3.x | Auto-generated docs |
| Process Manager | PM2 | — | Production process management |

---

## 3. Project Structure

```
cvforge/
├── client/                          # Vue 3 frontend (Phase 1)
│   └── src/
│       └── utils/
│           └── storageService.ts    # ← Swap LocalStorage → API here
│
├── server/                          # Node.js backend (Phase 2)
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts          # MongoDB connection
│   │   │   ├── redis.ts             # Redis connection
│   │   │   ├── stripe.ts            # Stripe initialization
│   │   │   ├── cloudinary.ts        # File storage config
│   │   │   └── passport.ts          # OAuth strategies
│   │   │
│   │   ├── models/
│   │   │   ├── User.model.ts
│   │   │   ├── CV.model.ts
│   │   │   ├── Subscription.model.ts
│   │   │   └── AuditLog.model.ts
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── cv.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── payment.controller.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── cv.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   └── payment.routes.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── authenticate.ts      # JWT verification
│   │   │   ├── authorize.ts         # Role / plan guard
│   │   │   ├── rateLimiter.ts       # Per-route rate limiting
│   │   │   ├── validate.ts          # Zod schema validation
│   │   │   └── errorHandler.ts      # Global error handler
│   │   │
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── cv.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── payment.service.ts
│   │   │   └── storage.service.ts
│   │   │
│   │   ├── schemas/                 # Zod validation schemas
│   │   │   ├── cv.schema.ts
│   │   │   ├── auth.schema.ts
│   │   │   └── payment.schema.ts
│   │   │
│   │   ├── types/
│   │   │   ├── express.d.ts         # Extend Express Request type
│   │   │   └── api.types.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── apiResponse.ts       # Standardized response helper
│   │   │   ├── asyncHandler.ts      # Async error wrapper
│   │   │   └── logger.ts            # Winston logger
│   │   │
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   │
│   │   └── app.ts                   # Express app setup
│   │
│   ├── index.ts                     # Server entry point
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
│
├── shared/                          # Shared types between client & server
│   └── types/
│       └── cv.types.ts              # Identical to client cv.types.ts
│
├── docker-compose.yml               # Local dev: MongoDB + Redis
├── .env.example
└── README.md
```

---

## 4. Database Design

### 4.1 User Model

```typescript
// models/User.model.ts
{
  _id: ObjectId,
  email: string,                  // unique, indexed
  passwordHash: string,           // bcrypt, nullable for OAuth users
  fullName: string,
  avatar?: string,                // Cloudinary URL
  provider: 'local' | 'google' | 'github',
  providerId?: string,            // OAuth provider user ID
  isEmailVerified: boolean,
  emailVerificationToken?: string,
  passwordResetToken?: string,
  passwordResetExpires?: Date,
  subscription: {
    plan: 'free' | 'pro' | 'enterprise',
    stripeCustomerId?: string,
    stripeSubscriptionId?: string,
    currentPeriodEnd?: Date,
    status: 'active' | 'canceled' | 'past_due' | 'trialing'
  },
  preferences: {
    theme: 'dark' | 'light',
    defaultTemplateId: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 4.2 CV Model

```typescript
// models/CV.model.ts
{
  _id: ObjectId,
  userId: ObjectId,               // ref: User, indexed
  title: string,                  // User-defined label e.g. "Software Engineer CV"
  isDefault: boolean,
  templateId: string,
  data: {
    personal: PersonalInfo,
    summary: string,
    experience: WorkExperience[],
    education: Education[],
    skills: Skill[],
    projects: Project[],
    certifications: Certification[]
  },
  exports: [{
    exportedAt: Date,
    fileUrl: string,              // Cloudinary URL
    format: 'pdf'
  }],
  version: number,                // Auto-incremented on each save
  createdAt: Date,
  updatedAt: Date
}
```

### 4.3 Subscription Model

```typescript
// models/Subscription.model.ts
{
  _id: ObjectId,
  userId: ObjectId,               // ref: User
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  plan: 'pro' | 'enterprise',
  status: 'active' | 'canceled' | 'past_due' | 'trialing',
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: boolean,
  trialEnd?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 4.4 Indexes

```typescript
// Performance-critical indexes
User:         { email: 1 }             // unique
User:         { 'subscription.stripeCustomerId': 1 }
CV:           { userId: 1, updatedAt: -1 }
CV:           { userId: 1, isDefault: 1 }
Subscription: { stripeSubscriptionId: 1 } // unique
```

---

## 5. API Design

### Base URL
```
Development:  http://localhost:3000/api/v1
Production:   https://api.cvforge.app/api/v1
```

### Standardized Response Format

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "message": "CV saved successfully"
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [ ... ]             // Zod errors array (dev only)
  }
}

// Paginated
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### 5.1 Auth Routes (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register with email + password |
| POST | `/login` | — | Login, returns JWT |
| POST | `/logout` | ✓ | Blacklist token in Redis |
| POST | `/refresh` | — | Refresh access token |
| GET | `/verify-email/:token` | — | Verify email address |
| POST | `/forgot-password` | — | Send reset email |
| POST | `/reset-password/:token` | — | Reset password |
| GET | `/google` | — | OAuth redirect |
| GET | `/google/callback` | — | OAuth callback |
| GET | `/github` | — | OAuth redirect |
| GET | `/github/callback` | — | OAuth callback |

### 5.2 CV Routes (`/api/v1/cv`)

| Method | Endpoint | Auth | Plan | Description |
|---|---|---|---|---|
| GET | `/` | ✓ | Any | List all user CVs |
| POST | `/` | ✓ | Any | Create new CV |
| GET | `/:id` | ✓ | Any | Get CV by ID |
| PUT | `/:id` | ✓ | Any | Full CV update |
| PATCH | `/:id` | ✓ | Any | Partial CV update (auto-save) |
| DELETE | `/:id` | ✓ | Any | Delete CV |
| POST | `/:id/export/pdf` | ✓ | Any | Generate & store PDF export |
| GET | `/:id/exports` | ✓ | Any | List export history |
| POST | `/:id/duplicate` | ✓ | Pro | Duplicate a CV |

> **Free plan limit:** Maximum 1 CV. Creating a second CV returns `403 PLAN_LIMIT_EXCEEDED`.

### 5.3 User Routes (`/api/v1/user`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/me` | ✓ | Get current user profile |
| PUT | `/me` | ✓ | Update profile |
| POST | `/me/avatar` | ✓ | Upload profile photo (Pro) |
| DELETE | `/me` | ✓ | Delete account + all data |

### 5.4 Payment Routes (`/api/v1/payment`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/checkout` | ✓ | Create Stripe Checkout session |
| POST | `/portal` | ✓ | Open Stripe Customer Portal |
| GET | `/subscription` | ✓ | Get current subscription status |
| POST | `/webhook` | — | Stripe webhook handler (raw body) |

---

## 6. Authentication & Authorization

### 6.1 JWT Strategy

```
Access Token:   15 minutes expiry  → stored in memory (Pinia store)
Refresh Token:  7 days expiry      → stored in HttpOnly cookie
```

- On login: issue both tokens
- On every request: validate access token via `authenticate` middleware
- On 401: client silently calls `/auth/refresh` using the cookie
- On logout: access token is added to Redis blacklist (TTL = remaining token lifetime)

### 6.2 Middleware Chain

```
Request → rateLimiter → authenticate → authorize(plan) → validate(schema) → controller
```

### 6.3 Role & Plan Guards

```typescript
// middleware/authorize.ts
// Usage in routes:
router.post('/duplicate', authenticate, authorize('pro'), cvController.duplicate)

// Plans hierarchy: free < pro < enterprise
// Enterprise can access all pro features
```

### 6.4 Rate Limiting (Redis-backed)

| Route Group | Limit |
|---|---|
| `/auth/login` | 10 requests / 15 min per IP |
| `/auth/register` | 5 requests / hour per IP |
| `/auth/forgot-password` | 3 requests / hour per IP |
| `/cv` (write) | 60 requests / min per user |
| `/cv/*/export` | 10 requests / hour per user (free), 50 (pro) |
| Global | 300 requests / min per IP |

---

## 7. Payment System Integration

### 7.1 Stripe Products Setup

```
Products to create in Stripe Dashboard:

┌─────────────────────────────────────┐
│  CVForge Pro                        │
│  Price: $9.99 / month               │
│  Price ID: price_pro_monthly        │
├─────────────────────────────────────┤
│  CVForge Pro (Annual)               │
│  Price: $79.99 / year (~33% off)    │
│  Price ID: price_pro_annual         │
└─────────────────────────────────────┘
```

### 7.2 Stripe Webhook Events to Handle

```typescript
// payment.service.ts — handle these events:

'checkout.session.completed'       → activate subscription, update user plan
'customer.subscription.updated'    → sync plan changes
'customer.subscription.deleted'    → downgrade to free plan
'invoice.payment_succeeded'        → log successful payment
'invoice.payment_failed'           → notify user, set status to past_due
```

### 7.3 Plan Feature Matrix

| Feature | Free | Pro | Enterprise |
|---|---|---|---|
| CV count | 1 | Unlimited | Unlimited |
| PDF exports / month | 5 | Unlimited | Unlimited |
| CV templates | 1 | All | All + Custom |
| Profile photo | ✗ | ✓ | ✓ |
| CV duplication | ✗ | ✓ | ✓ |
| Export history | Last 3 | Unlimited | Unlimited |
| Priority support | ✗ | ✗ | ✓ |

---

## 8. Storage & File Management

### 8.1 Cloudinary Configuration

```typescript
// config/cloudinary.ts
// Folder structure in Cloudinary:
cvforge/
├── avatars/
│   └── {userId}/profile.jpg
└── exports/
    └── {userId}/
        └── {cvId}/
            └── {timestamp}_CV.pdf
```

### 8.2 File Lifecycle

```
PDF Export Request
       │
       ▼
Generate PDF on server (puppeteer or pdf-lib)
       │
       ▼
Upload to Cloudinary → get secure URL
       │
       ▼
Save URL to CV.exports[] in MongoDB
       │
       ▼
Return signed URL to client (expires in 1 hour)
       │
       ▼
Cron job: delete exports older than 30 days (free) / 1 year (pro)
```

---

## 9. Environment Configuration

### 9.1 `.env.example`

```env
# Server
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173

# MongoDB
MONGODB_URI=mongodb://localhost:27017/cvforge

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OAuth — Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# OAuth — GitHub
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/github/callback

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@cvforge.app
```

### 9.2 `docker-compose.yml` (Local Dev)

```yaml
version: '3.9'
services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:
```

---

## 10. Development Phases & Milestones

### Phase 2A — Foundation (Week 1–2)

- [ ] Initialize Express + TypeScript server project
- [ ] Configure MongoDB connection with Mongoose
- [ ] Configure Redis connection
- [ ] Define all Mongoose models (User, CV, Subscription)
- [ ] Set up global error handler and response utilities
- [ ] Set up Winston logger
- [ ] Configure ESLint + Prettier for server
- [ ] Write Docker Compose for local dev environment
- [ ] Set up Swagger / OpenAPI documentation scaffold

### Phase 2B — Authentication (Week 3)

- [ ] Implement register / login with JWT
- [ ] Implement HttpOnly cookie refresh token flow
- [ ] Implement token blacklisting via Redis
- [ ] Implement email verification (Resend)
- [ ] Implement forgot / reset password flow
- [ ] Integrate Google OAuth via Passport.js
- [ ] Integrate GitHub OAuth via Passport.js
- [ ] Write auth middleware (`authenticate`, `authorize`)
- [ ] Write integration tests for all auth routes

### Phase 2C — CV API (Week 4)

- [ ] Implement CRUD endpoints for CV
- [ ] Implement partial update (PATCH) for auto-save
- [ ] Implement PDF export endpoint with Cloudinary upload
- [ ] Implement export history endpoint
- [ ] Implement free plan CV count enforcement (max 1)
- [ ] Swap client `LocalStorageService` → `ApiStorageService`
- [ ] Write integration tests for all CV routes

### Phase 2D — Payments (Week 5)

- [ ] Set up Stripe products and prices in dashboard
- [ ] Implement Stripe Checkout session creation
- [ ] Implement Stripe Customer Portal
- [ ] Implement Stripe webhook handler with signature verification
- [ ] Sync subscription status to User model on all webhook events
- [ ] Implement plan enforcement in `authorize` middleware
- [ ] Build pricing page UI in Vue (replace placeholder)
- [ ] Write integration tests for webhook handler

### Phase 2E — Polish & Launch Prep (Week 6)

- [ ] Set up rate limiting on all routes (Redis-backed)
- [ ] Security audit: helmet, cors, hpp, sanitize inputs
- [ ] Load test critical endpoints
- [ ] Complete Swagger / OpenAPI documentation
- [ ] Set up PM2 configuration for production
- [ ] Configure CI/CD pipeline (GitHub Actions)
- [ ] Set up MongoDB Atlas for production
- [ ] Configure environment variables in deployment platform
- [ ] Final end-to-end testing (auth → CV create → export → payment)

---

## 11. Deployment Architecture

### Recommended Stack (Cost-Optimized)

```
Frontend (Vue 3)    → Vercel (free tier)
Backend (Node.js)   → Railway or Render (starter plan)
Database            → MongoDB Atlas (M0 free → M10 paid)
Cache               → Redis Cloud (free tier → paid)
File Storage        → Cloudinary (free tier → paid)
Email               → Resend (free tier → paid)
Payments            → Stripe (no monthly fee, % per transaction)
```

### Environment Promotion Flow

```
local (docker-compose)
        │
        ▼
staging (Railway preview deploy on PR)
        │
        ▼
production (Railway main branch deploy)
```

---

## 12. Security Checklist

### Server Hardening

- [ ] `helmet` — sets secure HTTP headers
- [ ] `cors` — whitelist only `CLIENT_URL`
- [ ] `express-rate-limit` + Redis store — per-route rate limits
- [ ] `hpp` — prevent HTTP parameter pollution
- [ ] `express-mongo-sanitize` — prevent NoSQL injection
- [ ] `zod` — validate and strip all incoming request bodies
- [ ] JWT stored in memory (access) + HttpOnly cookie (refresh)
- [ ] Stripe webhook signature verification on every webhook event
- [ ] Passwords hashed with bcrypt (min 12 rounds)
- [ ] Sensitive env vars never logged or exposed in responses

### Data Privacy

- [ ] Users can delete their account and all associated data (`DELETE /user/me`)
- [ ] PDF export URLs are signed and time-limited (1 hour)
- [ ] No CV data stored in plain text logs
- [ ] MongoDB Atlas IP whitelist configured in production

---

> **Next Step:** Once Phase 1 frontend is complete, begin Phase 2A by running `docker-compose up` to spin up local MongoDB and Redis, then scaffold the Express server with `npm create` + TypeScript config as specified above.
