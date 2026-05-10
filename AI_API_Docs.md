# AI API Documentation

## Overview

The AI API provides endpoints for analyzing and improving CV content using Claude AI. Currently, one endpoint is available for analyzing professional summaries.

**Base URL:** `http://localhost:3000/api/v1`

**Authentication:** Bearer token (required for all endpoints)

---

## Authentication

All requests require a valid access token. Include it in the `Authorization` header:

```
Authorization: Bearer <ACCESS_TOKEN>
```

### Getting an Access Token

1. **Register a new account:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "your-email@example.com",
       "password": "Password123!",
       "name": "Your Name"
     }'
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "your-email@example.com",
       "password": "Password123!"
     }'
   ```

   Response includes `accessToken` in the data object. Use this token for all subsequent requests.

---

## Endpoints

### Analyze Professional Summary

**Endpoint:** `POST /ai/analyze-summary`

**Description:** Analyzes a professional summary and returns specific feedback along with an improved version.

#### Request

```http
POST /api/v1/ai/analyze-summary HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Authorization: Bearer <ACCESS_TOKEN>

{
  "summary": "Led a team of 5 developers to rebuild the payment system, increasing transaction speed by 40%."
}
```

**Parameters:**

| Name | Type | Required | Constraints | Description |
|------|------|----------|-------------|-------------|
| `summary` | string | Yes | Min 50, Max 500 characters | The professional summary to analyze |

#### Response

**Status: 200 OK**

```json
{
  "success": true,
  "data": {
    "feedback": "Strong action verbs and quantifiable metrics. Consider making it more concise and adding specific technologies or methodologies used.",
    "suggestion": "Led a team of 5 developers to rebuild the payment system, increasing transaction speed by 40% and reducing latency from 2s to 300ms using microservices architecture."
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful requests |
| `data.feedback` | string | Specific critique and improvement suggestions (2-3 sentences) |
| `data.suggestion` | string | An improved version of the summary (50-500 characters, plain text) |

---

## Error Responses

### 400 Bad Request

**When:** Summary is invalid (too short, too long, or missing)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "String must contain at least 50 character(s)"
  }
}
```

---

### 401 Unauthorized

**When:** Missing or invalid authentication token

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Fix:** Include valid Bearer token in `Authorization` header

---

### 429 Too Many Requests

**When:** Rate limit exceeded (10 requests per minute per user)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many AI requests. Please try again in a moment."
  }
}
```

**Details:**
- Limit: 10 requests per minute per authenticated user
- Window: Rolling 1-minute window
- Retry after: Check `Retry-After` header (in seconds)

---

### 502 Bad Gateway

**When:** AI service returns invalid response format

```json
{
  "success": false,
  "error": {
    "code": "AI_INVALID_RESPONSE",
    "message": "AI response invalid"
  }
}
```

**Possible causes:**
- AI returned non-text content block
- AI returned malformed JSON
- AI returned unexpected response shape

---

### 503 Service Unavailable

**When:** AI service not configured (missing API key)

```json
{
  "success": false,
  "error": {
    "code": "AI_NOT_CONFIGURED",
    "message": "AI service not configured"
  }
}
```

**Fix:** Ensure `ANTHROPIC_API_KEY` is set in `server/.env`

---

## Usage Examples

### Example 1: Analyze a Basic Summary

```bash
curl -X POST http://localhost:3000/api/v1/ai/analyze-summary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "summary": "Experienced software engineer with 10 years of experience in full-stack web development, specializing in React and Node.js."
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "feedback": "Good experience span and tech stack clarity. Strengthen with quantifiable achievements and specific business impact rather than just technologies used.",
    "suggestion": "Full-stack engineer with 10 years building high-traffic web applications in React/Node.js. Led migration to microservices, improving system scalability by 3x and reducing deployment time from 2 hours to 15 minutes."
  }
}
```

---

### Example 2: Analyze a Summary in Turkish

```bash
curl -X POST http://localhost:3000/api/v1/ai/analyze-summary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "summary": "5 yıl deneyimli yazılım geliştirici, React ve Node.js'de uzmanlaşmış. Ekip lideri olarak 3 kişilik ekibi yönettim."
  }'
```

**Response:** (Feedback and suggestion will be in Turkish)
```json
{
  "success": true,
  "data": {
    "feedback": "İyi bir temel ancak ölçülebilir sonuçlar ve somut etkileri eklemeniz gerekli. Zayıf fiiller yerine güçlü action verb'ler kullanın.",
    "suggestion": "Yazılım mimarisinde 5 yıllık deneyim ve takım liderliği geçmişim var. 3 kişilik ekibi React/Node.js projesinde yöneterek ürün teslim hızını 2 kattan fazla artırdım."
  }
}
```

---

### Example 3: Error - Summary Too Short

```bash
curl -X POST http://localhost:3000/api/v1/ai/analyze-summary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "summary": "Developer"
  }'
```

**Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "String must contain at least 50 character(s)"
  }
}
```

---

### Example 4: Rate Limit Check

```bash
# First 5 requests succeed (200 OK)
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/v1/ai/analyze-summary \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer eyJhbGc..." \
    -d '{"summary": "This is a test summary with enough characters to pass validation requirements without any issue."}'
done

# 6th request fails (429 Too Many Requests)
curl -X POST http://localhost:3000/api/v1/ai/analyze-summary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{"summary": "This is a test summary with enough characters to pass validation requirements without any issue."}'
```

**6th Response (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many AI requests. Please try again in a moment."
  }
}
```

---

## Response Headers

All responses include standard rate-limit headers:

```
RateLimit-Limit: 10
RateLimit-Remaining: 9
RateLimit-Reset: 1715427600
```

---

## Implementation Notes

### Language Support

The API automatically detects the language of the input summary and responds in the same language. For example:
- English input → English feedback & suggestion
- Turkish input → Turkish feedback & suggestion
- Other languages → Feedback in that language

### Character Limits

- **Minimum:** 50 characters (enforced on client & server)
- **Maximum:** 500 characters (enforced on client & server)
- **Feedback:** ~200-300 characters (AI-generated, no hard limit)
- **Suggestion:** 50-500 characters (AI-generated, follows input constraints)

### Rate Limiting

- **Limit:** 10 requests per minute
- **Scope:** Per authenticated user
- **Window:** Rolling 1-minute window
- **Storage:** Redis (if configured) or in-memory (development)

### AI Model Details

- **Model:** Claude Haiku 4.5 (fast and cost-effective)
- **Max Tokens:** 1024 (allows detailed feedback + suggestion)
- **System Prompt:** Professional CV analyzer role with specific evaluation criteria

---

## Troubleshooting

### Issue: Always getting 503 "AI service not configured"

**Solution:** Check that `ANTHROPIC_API_KEY` is set in `server/.env`:
```bash
echo $ANTHROPIC_API_KEY  # Should output your API key
```

If empty, add it:
```
ANTHROPIC_API_KEY=sk-ant-v1-xxxxx
```

### Issue: Getting 502 "AI response invalid" errors

**Solution:** This indicates the AI returned an unexpected format. Check server logs:
```bash
npm run dev:server  # Look for "AI parse failed" logs with raw response
```

The system prompt may need tuning. Contact the development team with the raw response logged.

### Issue: Rate limit being hit too frequently

**Solution:** The limit is 10 requests per minute per user. If you need to:
- Test heavily: Wait between requests or use multiple test accounts
- Increase limit: Modify `max: 10` in `server/src/middleware/rateLimiter.ts` and restart server

### Issue: Token expired / 401 errors

**Solution:** Get a fresh token:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "password": "your-password"}'
```

Copy the new `accessToken` and update your requests.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-05-10 | Initial release - POST /ai/analyze-summary endpoint |

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs: `npm run dev:server`
3. Verify your request matches the examples in this documentation
4. Contact the development team with error codes and raw responses
