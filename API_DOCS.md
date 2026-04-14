# Resumark API Documentation

> **Base URL:** `http://localhost:3000/api/v1`  
> **Production:** `https://api.resumark.app/api/v1`  
> **Content-Type:** `application/json` (all requests)  
> **Auth:** `Authorization: Bearer <accessToken>` header (where required)

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User](#2-user)
3. [CV](#3-cv)
4. [Cover Letter](#4-cover-letter)
5. [Billing](#5-billing)
6. [Waitlist](#6-waitlist)
7. [Error Format](#7-error-format)
8. [Rate Limits](#8-rate-limits)

---

## 1. Authentication

### POST `/auth/register`

Creates a new user account. Returns an access token and sets an HttpOnly refresh cookie so the user is immediately signed in after registration.

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiJ9...",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "plan": "FREE",
      "isPremium": false,
      "avatarUrl": null
    }
  }
}
```

---

### POST `/auth/login`

Authenticates an existing user with email and password. Returns a short-lived RS256 JWT access token (15 min) and sets a 7-day HttpOnly refresh cookie.

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "pro123@gmail.com",
    "password": "Pro123"
  }'
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiJ9...",
    "user": {
      "id": "uuid",
      "name": "ProUser",
      "email": "pro123@gmail.com",
      "plan": "PRO",
      "isPremium": true,
      "avatarUrl": null
    }
  }
}
```

---

### POST `/auth/refresh`

Issues a new access token using the HttpOnly refresh cookie, rotating the refresh token in the process. This is called silently by the frontend every 15 minutes to keep the user's session alive.

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiJ9..."
  }
}
```

---

### POST `/auth/logout`

Invalidates the current access token by adding its JTI to the Redis blacklist, and revokes the refresh token in the database. Clears the refresh cookie so the session is fully terminated.

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <accessToken>" \
  -b cookies.txt \
  -c cookies.txt
```

**Response `204` No Content**

---

### POST `/auth/forgot-password`

Generates a one-time password reset token and sends a reset link to the user's email address. Prevents email enumeration by always returning a success response regardless of whether the email exists.

```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "message": "If that email is registered, a reset link has been sent."
  }
}
```

---

### POST `/auth/reset-password`

Consumes a password reset token (from the emailed link), updates the user's password, and revokes all existing refresh tokens to force re-login on all devices.

```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<rawTokenFromEmail>",
    "password": "NewSecurePass456"
  }'
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully. Please log in with your new password."
  }
}
```

---

### POST `/auth/verify-email`

Marks a user's email address as verified using the token sent during registration. Required before accessing certain features that depend on a confirmed email.

```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<rawTokenFromVerificationEmail>"
  }'
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully."
  }
}
```

---

### POST `/auth/migrate-local-data`

Migrates a guest user's localStorage CV and cover letter data to the cloud on their first login. Uses a last-write-wins strategy based on `meta.updatedAt` to avoid overwriting newer cloud data with stale local data.

```bash
curl -X POST http://localhost:3000/api/v1/auth/migrate-local-data \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "cvData": { "meta": { "updatedAt": "2026-04-14T10:00:00.000Z" }, "personalInfo": {} },
    "coverLetterData": { "meta": { "updatedAt": "2026-04-14T09:00:00.000Z" } }
  }'
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "results": {
      "cv": "imported",
      "coverLetter": "cloud_kept"
    }
  }
}
```

> **`cv` / `coverLetter` result values:** `imported` | `local_overwrote_cloud` | `cloud_kept` | `skipped_invalid`

---

## 2. User

### GET `/user/me`

Returns the currently authenticated user's profile including their plan tier. Used on app load to hydrate the Pinia user store and determine which features are available.

```bash
curl -X GET http://localhost:3000/api/v1/user/me \
  -H "Authorization: Bearer <accessToken>"
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "ProUser",
    "email": "pro123@gmail.com",
    "plan": "PRO",
    "isPremium": true,
    "avatarUrl": null
  }
}
```

---

### PATCH `/user/me`

Updates the authenticated user's display name. Currently the only mutable profile field in Phase 2; avatar and email changes are handled by dedicated endpoints.

```bash
curl -X PATCH http://localhost:3000/api/v1/user/me \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated"
  }'
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Updated",
    "email": "john@example.com",
    "plan": "FREE",
    "isPremium": false,
    "avatarUrl": null
  }
}
```

---

### DELETE `/user/me`

Permanently deletes the user's account and all associated data (CVs, cover letters, tokens). Also cancels any active Stripe subscription to prevent continued billing after deletion.

```bash
curl -X DELETE http://localhost:3000/api/v1/user/me \
  -H "Authorization: Bearer <accessToken>"
```

**Response `204` No Content**

---

### POST `/user/me/avatar` _(Pro only)_

Uploads a profile photo for the user. Requires an active Pro subscription. In Phase 2 this endpoint is stubbed; full Cloudflare R2 upload support is planned for Phase 3.

```bash
curl -X POST http://localhost:3000/api/v1/user/me/avatar \
  -H "Authorization: Bearer <accessToken>" \
  -F "avatar=@/path/to/photo.jpg"
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.resumark.app/avatars/uuid.jpg"
  }
}
```

---

### DELETE `/user/me/avatar` _(Pro only)_

Removes the user's profile photo and deletes the file from cloud storage. Requires Pro — avatars are a Pro-exclusive feature.

```bash
curl -X DELETE http://localhost:3000/api/v1/user/me/avatar \
  -H "Authorization: Bearer <accessToken>"
```

**Response `204` No Content**

---

## 3. CV

> All CV endpoints require authentication.  
> FREE plan: maximum **1 CV**, `classic` template only.  
> PRO plan: unlimited CVs, all templates.

---

### GET `/cv`

Returns a summary list of all CVs belonging to the authenticated user. Used by the dashboard to display the user's CV cards without loading full content.

```bash
curl -X GET http://localhost:3000/api/v1/cv \
  -H "Authorization: Bearer <accessToken>"
```

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Software Engineer CV",
      "updatedAt": "2026-04-14T10:00:00.000Z",
      "templateId": "classic"
    }
  ]
}
```

---

### POST `/cv`

Creates a new CV. Enforces the FREE plan limit (max 1 CV) and rejects Pro-only template IDs for FREE users. Returns the created CV's ID which is stored by the frontend for subsequent auto-save calls.

```bash
curl -X POST http://localhost:3000/api/v1/cv \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Software Engineer CV",
    "content": {
      "meta": {
        "templateId": "classic",
        "language": "en",
        "updatedAt": "2026-04-14T10:00:00.000Z"
      },
      "personalInfo": {
        "fullName": "John Doe",
        "title": "Software Engineer",
        "email": "john@example.com",
        "phone": "+1 555 000 0000",
        "location": "San Francisco, CA",
        "linkedin": "",
        "website": "",
        "summary": ""
      },
      "experience": [],
      "education": [],
      "skills": [],
      "languages": [],
      "certifications": [],
      "projects": []
    }
  }'
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Software Engineer CV",
    "content": { "..." },
    "createdAt": "2026-04-14T10:00:00.000Z",
    "updatedAt": "2026-04-14T10:00:00.000Z"
  }
}
```

> **FREE plan errors:**  
> `402 PLAN_LIMIT_EXCEEDED` — already has 1 CV  
> `403 TEMPLATE_NOT_ALLOWED` — tried to use `modern` or `technical` template

---

### GET `/cv/:id`

Retrieves the full content of a single CV by its UUID. Used when the builder loads to populate the editor with the user's existing data.

```bash
curl -X GET http://localhost:3000/api/v1/cv/YOUR_CV_UUID \
  -H "Authorization: Bearer <accessToken>"
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Software Engineer CV",
    "content": { "..." },
    "createdAt": "2026-04-14T10:00:00.000Z",
    "updatedAt": "2026-04-14T10:00:00.000Z"
  }
}
```

---

### PUT `/cv/:id`

Full replacement of a CV's content — the primary auto-save target. The frontend debounces this call (500 ms) and fires it on every meaningful editor change, validating the template against the user's plan before persisting.

```bash
curl -X PUT http://localhost:3000/api/v1/cv/YOUR_CV_UUID \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Engineer CV",
    "content": {
      "meta": {
        "templateId": "classic",
        "language": "en",
        "updatedAt": "2026-04-14T11:00:00.000Z"
      },
      "personalInfo": { "fullName": "John Doe", "..." },
      "experience": [],
      "education": [],
      "skills": [],
      "languages": [],
      "certifications": [],
      "projects": []
    }
  }'
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Senior Engineer CV",
    "updatedAt": "2026-04-14T11:00:00.000Z"
  }
}
```

---

### PATCH `/cv/:id`

Partially updates a CV — currently used for title-only changes without sending the full content payload. Lighter than PUT for metadata-only edits.

```bash
curl -X PATCH http://localhost:3000/api/v1/cv/YOUR_CV_UUID \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Lead Engineer CV"
  }'
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Lead Engineer CV",
    "updatedAt": "2026-04-14T11:05:00.000Z"
  }
}
```

---

### DELETE `/cv/:id`

Permanently deletes a CV and its content from the database. Ownership is verified — users can only delete their own CVs.

```bash
curl -X DELETE http://localhost:3000/api/v1/cv/YOUR_CV_UUID \
  -H "Authorization: Bearer <accessToken>"
```

**Response `204` No Content**

---

## 4. Cover Letter

> All cover letter endpoints require authentication **and an active Pro subscription**.  
> FREE users receive `403 PLAN_REQUIRED`.  
> Phase 2: one cover letter per user. Multi-cover-letter support is planned for Phase 3.

---

### GET `/cover-letter`

Retrieves the authenticated Pro user's cover letter. Returns `null` data if no cover letter has been saved yet, rather than a 404, to simplify frontend initialization.

```bash
curl -X GET http://localhost:3000/api/v1/cover-letter \
  -H "Authorization: Bearer <accessToken>"
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Cover Letter",
    "content": {
      "meta": { "updatedAt": "2026-04-14T10:00:00.000Z" },
      "recipientName": "Hiring Manager",
      "companyName": "Acme Corp",
      "position": "Software Engineer",
      "body": "Dear Hiring Manager, ..."
    },
    "updatedAt": "2026-04-14T10:00:00.000Z"
  }
}
```

---

### PUT `/cover-letter`

Creates or updates (upserts) the user's cover letter — the auto-save target for the Cover Letter editor. Like CV auto-save, the frontend debounces this call on every keystroke.

```bash
curl -X PUT http://localhost:3000/api/v1/cover-letter \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Cover Letter — Acme Corp",
    "content": {
      "meta": { "updatedAt": "2026-04-14T12:00:00.000Z" },
      "recipientName": "Hiring Manager",
      "companyName": "Acme Corp",
      "position": "Software Engineer",
      "body": "Dear Hiring Manager, I am excited to apply..."
    }
  }'
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Cover Letter — Acme Corp",
    "updatedAt": "2026-04-14T12:00:00.000Z"
  }
}
```

---

### DELETE `/cover-letter`

Permanently deletes the user's cover letter. Used when the user explicitly clears their cover letter from the editor.

```bash
curl -X DELETE http://localhost:3000/api/v1/cover-letter \
  -H "Authorization: Bearer <accessToken>"
```

**Response `204` No Content**

---

## 5. Billing

### POST `/billing/checkout`

Creates a Stripe Checkout Session for upgrading to Pro. Returns a redirect URL — the frontend navigates the user directly to Stripe's hosted checkout page.

```bash
curl -X POST http://localhost:3000/api/v1/billing/checkout \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_...",
    "successUrl": "http://localhost:5173/dashboard?checkout=success",
    "cancelUrl": "http://localhost:5173/pricing"
  }'
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "url": "https://checkout.stripe.com/pay/cs_test_..."
  }
}
```

---

### POST `/billing/portal`

Creates a Stripe Customer Portal session so the user can manage their subscription, update payment methods, or cancel. Returns a redirect URL to Stripe's hosted portal.

```bash
curl -X POST http://localhost:3000/api/v1/billing/portal \
  -H "Authorization: Bearer <accessToken>"
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/session/bps_test_..."
  }
}
```

---

### GET `/billing/status`

Returns the current subscription status for the authenticated user. Used by the dashboard to show plan details, renewal dates, and cancellation state.

```bash
curl -X GET http://localhost:3000/api/v1/billing/status \
  -H "Authorization: Bearer <accessToken>"
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "plan": "PRO",
    "status": "ACTIVE",
    "currentPeriodEnd": "2027-04-14T00:00:00.000Z",
    "cancelAtPeriodEnd": false
  }
}
```

---

### POST `/webhooks/stripe`

Receives and processes Stripe lifecycle events (checkout completed, invoice paid/failed, subscription updated/deleted). This endpoint must receive the **raw request body** — do not send it manually unless you are Stripe.

```bash
# This endpoint is called by Stripe, not by your frontend.
# For local testing, use the Stripe CLI:
stripe listen --forward-to http://localhost:3000/api/v1/webhooks/stripe

# Then trigger a test event:
stripe trigger checkout.session.completed
```

**Handled events:**

| Event | Action |
|---|---|
| `checkout.session.completed` | Activate subscription, set `user.plan = PRO` |
| `invoice.paid` | Renew `currentPeriodEnd`, clear `PAST_DUE` if applicable |
| `invoice.payment_failed` | Set `status = PAST_DUE`, start 3-day grace period |
| `customer.subscription.updated` | Sync price, period dates, cancellation flag |
| `customer.subscription.deleted` | Cancel subscription, set `user.plan = FREE` |

**Response `200`**
```json
{ "received": true }
```

---

## 6. Waitlist

### POST `/waitlist`

Registers an email address on the Pro feature waitlist. Idempotent — submitting the same email twice returns success without creating a duplicate entry, preventing enumeration.

```bash
curl -X POST http://localhost:3000/api/v1/waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "email": "interested@example.com",
    "source": "upgrade_modal"
  }'
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "message": "You're on the list! We'll notify you when Pro launches."
  }
}
```

---

## 7. Error Format

All errors follow a consistent envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description"
  }
}
```

**Common error codes:**

| HTTP | Code | Meaning |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Request body failed Zod schema validation |
| `401` | `UNAUTHORIZED` | No access token provided |
| `401` | `INVALID_TOKEN` | Token expired or signature invalid |
| `401` | `TOKEN_REVOKED` | Token was blacklisted (post-logout) |
| `402` | `PLAN_LIMIT_EXCEEDED` | FREE user hit the 1-CV limit |
| `403` | `TEMPLATE_NOT_ALLOWED` | FREE user attempted a Pro-only template |
| `403` | `PLAN_REQUIRED` | Endpoint requires Pro subscription |
| `404` | `NOT_FOUND` | Resource doesn't exist or belongs to another user |
| `409` | `EMAIL_EXISTS` | Registration attempted with an already-registered email |
| `429` | `RATE_LIMITED` | Too many requests — see rate limits below |
| `500` | `INTERNAL_ERROR` | Unexpected server error |

---

## 8. Rate Limits

Limits are per-IP. Headers `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` are included on every response.

| Endpoints | Window | Limit |
|---|---|---|
| `POST /auth/login`, `POST /auth/register` | 15 min | 10 requests |
| `POST /auth/forgot-password`, `POST /auth/reset-password` | 1 hour | 5 requests |
| `POST /auth/refresh` | 1 min | 30 requests |
| `PUT /cv/:id`, `POST /cv`, `PUT /cover-letter` | 1 min | 60 requests |
| `GET /cv`, `GET /user/me`, `GET /cover-letter` | 1 min | 120 requests |
| `POST /waitlist` | 1 hour | 3 requests |
| `POST /webhooks/stripe` | None | — (Stripe signature is the gate) |

---

## Quick Reference — Test Users

> Seeded via `npm run db:seed` in the `server/` directory.

| User | Email | Password | Plan |
|---|---|---|---|
| ProUser | `pro123@gmail.com` | `Pro123` | PRO |
| FreeUser | `free123@gmail.com` | `Free123` | FREE |

```bash
# Quick login and capture token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"pro123@gmail.com","password":"Pro123"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

echo "Token: $TOKEN"

# Use it
curl http://localhost:3000/api/v1/user/me \
  -H "Authorization: Bearer $TOKEN"
```
