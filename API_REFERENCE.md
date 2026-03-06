# OneAccord API Reference

Complete reference for all OneAccord API endpoints.

## Authentication

### Magic Link Sign In
**POST** `/api/auth/signin`
- **Body:**
  ```json
  { "email": "user@example.com" }
  ```
- **Response:** `{ success: true, message: "Check your email for magic link" }`
- **Notes:** Magic link sent via email, valid for 24 hours

### OAuth Callback
**GET** `/auth/callback`
- **Query Params:**
  - `code` - Authorization code from Supabase
  - `next` - Redirect path after auth
- **Response:** Redirects to dashboard or specified path
- **Notes:** Called by Supabase after magic link click

### Sign Out
**POST** `/api/auth/signout`
- **Response:** `{ success: true }`
- **Notes:** Clears session and cookies

## Sessions

### List User Sessions
**GET** `/api/sessions`
- **Headers:** Authorization (bearer token)
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "category_key": "faith",
      "status": "in-progress",
      "mode": "deep",
      "started_at": "2024-03-06T10:00:00Z",
      "completed_at": null
    }
  ]
  ```

### Create Session
**POST** `/api/sessions`
- **Headers:** Authorization
- **Body:**
  ```json
  {
    "categoryKey": "communication",
    "mode": "deep",
    "coupleId": "uuid-optional"
  }
  ```
- **Response:**
  ```json
  {
    "id": "session-uuid",
    "category_key": "communication",
    "status": "in-progress",
    "mode": "deep",
    "created_at": "2024-03-06T10:00:00Z"
  }
  ```

### Get Session Details
**GET** `/api/sessions/:sessionId`
- **Headers:** Authorization
- **Response:** Session object with all details
- **Notes:** Includes category info and user's responses

### Complete Session
**POST** `/api/sessions/:sessionId/complete`
- **Headers:** Authorization
- **Response:** Updated session with `completed_at` timestamp
- **Notes:** Marks session as completed

## Responses

### Save Response
**POST** `/api/responses`
- **Headers:** Authorization
- **Body:**
  ```json
  {
    "sessionId": "uuid",
    "step": "mystory",
    "responses": {
      "q1": "My answer to question 1",
      "q2": "My answer to question 2"
    }
  }
  ```
- **Response:**
  ```json
  {
    "id": "response-uuid",
    "session_id": "uuid",
    "step": "mystory",
    "responses_json": { ... },
    "created_at": "2024-03-06T10:15:00Z"
  }
  ```

### Get Session Responses
**GET** `/api/responses?sessionId=uuid`
- **Headers:** Authorization
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "step": "mystory",
      "responses_json": { ... },
      "created_at": "2024-03-06T10:15:00Z"
    }
  ]
  ```

### Get Partner Responses
**GET** `/api/responses?sessionId=uuid&partnerId=uuid`
- **Headers:** Authorization
- **Response:** Partner's responses (only if couple linked)
- **Notes:** RLS policy ensures only couple members can access

## Couples

### Generate Coupling Code
**POST** `/api/couples/generate-code`
- **Headers:** Authorization
- **Response:**
  ```json
  {
    "coupleId": "uuid",
    "couplingCode": "ABC123",
    "status": "pending"
  }
  ```
- **Notes:** Code is 6 characters, valid for 7 days

### Join Couple
**POST** `/api/couples/join`
- **Headers:** Authorization
- **Body:**
  ```json
  {
    "couplingCode": "ABC123"
  }
  ```
- **Response:**
  ```json
  {
    "id": "couple-uuid",
    "user1_id": "uuid",
    "user2_id": "uuid",
    "status": "active",
    "created_at": "2024-03-06T09:00:00Z"
  }
  ```
- **Error Cases:**
  - `{ error: "Invalid coupling code" }`
  - `{ error: "Coupling code already used" }`

### Get Couple Info
**GET** `/api/couples/:coupleId`
- **Headers:** Authorization
- **Response:**
  ```json
  {
    "id": "couple-uuid",
    "user1_id": "uuid",
    "user2_id": "uuid",
    "user1_email": "user1@example.com",
    "user2_email": "user2@example.com",
    "status": "active",
    "created_at": "2024-03-06T09:00:00Z"
  }
  ```

### Get User's Couple
**GET** `/api/couples/current`
- **Headers:** Authorization
- **Response:** Current couple or null if not linked
- **Notes:** Convenience endpoint to get user's couple

## Declarations

### Generate AI Declaration
**POST** `/api/declarations/generate`
- **Headers:** Authorization
- **Body:**
  ```json
  {
    "sessionId": "uuid",
    "coupleId": "uuid",
    "includeResponses": true
  }
  ```
- **Response:** Server-sent event stream
  ```
  data: {"type": "thinking", "content": "..."}
  data: {"type": "text-delta", "content": "Part of "}
  data: {"type": "text-delta", "content": "generated text"}
  data: {"type": "done"}
  ```
- **Notes:** Streaming response, listen for text-delta events
- **Time:** Takes 30+ seconds for complete generation

### List Declarations
**GET** `/api/declarations`
- **Headers:** Authorization
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "session_id": "uuid",
      "couple_id": "uuid",
      "draft_text": "...",
      "final_text": null,
      "ai_generated": true,
      "user1_approved": false,
      "user2_approved": false,
      "sealed_at": null,
      "created_at": "2024-03-06T11:00:00Z"
    }
  ]
  ```

### Get Declaration
**GET** `/api/declarations/:declarationId`
- **Headers:** Authorization
- **Response:** Single declaration object

### Approve Declaration
**POST** `/api/declarations/:declarationId/approve`
- **Headers:** Authorization
- **Body:**
  ```json
  {
    "approved": true
  }
  ```
- **Response:**
  ```json
  {
    "id": "uuid",
    "user1_approved": true,
    "user2_approved": false,
    "updated_at": "2024-03-06T11:15:00Z"
  }
  ```
- **Notes:** Sets approval for current user

### Seal Declaration
**POST** `/api/declarations/:declarationId/seal`
- **Headers:** Authorization
- **Body:**
  ```json
  {
    "finalText": "Edited or final declaration text"
  }
  ```
- **Response:**
  ```json
  {
    "id": "uuid",
    "final_text": "...",
    "sealed_at": "2024-03-06T11:20:00Z",
    "status": "sealed"
  }
  ```
- **Conditions:** Both users must approve first
- **Notes:** Creates session_attempt record

### Edit Declaration Draft
**PUT** `/api/declarations/:declarationId`
- **Headers:** Authorization
- **Body:**
  ```json
  {
    "draftText": "Updated draft text"
  }
  ```
- **Response:** Updated declaration

## Admin Endpoints

All admin endpoints require service role key or admin user role.

### List All Users
**GET** `/api/admin/users`
- **Headers:** Authorization (admin)
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "email": "user@example.com",
      "relationship_stage": "dating",
      "couple_id": "uuid-or-null",
      "created_at": "2024-03-06T09:00:00Z"
    }
  ]
  ```
- **Query Params:**
  - `limit` - Default 50
  - `offset` - For pagination
  - `stage` - Filter by stage (dating/engaged/married)

### List All Couples
**GET** `/api/admin/couples`
- **Headers:** Authorization (admin)
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "user1_email": "user1@example.com",
      "user2_email": "user2@example.com",
      "status": "active",
      "session_count": 5,
      "created_at": "2024-03-06T09:00:00Z"
    }
  ]
  ```

### List All Sessions
**GET** `/api/admin/sessions`
- **Headers:** Authorization (admin)
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "user_email": "user@example.com",
      "category_key": "faith",
      "status": "completed",
      "mode": "deep",
      "completed_at": "2024-03-06T11:00:00Z"
    }
  ]
  ```

### Get Analytics
**GET** `/api/admin/analytics`
- **Headers:** Authorization (admin)
- **Response:**
  ```json
  {
    "total_users": 42,
    "total_couples": 21,
    "total_sessions": 156,
    "total_declarations": 23,
    "completion_rate": 0.85,
    "popular_categories": [
      { "key": "faith", "count": 35 },
      { "key": "communication", "count": 32 }
    ],
    "users_by_stage": {
      "dating": 15,
      "engaged": 12,
      "married": 15
    }
  }
  ```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | User not authenticated |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `AI_ERROR` | 500 | AI generation failed |
| `SESSION_NOT_FOUND` | 404 | Session doesn't exist |
| `COUPLE_NOT_FOUND` | 404 | Couple doesn't exist |
| `DECLARATION_NOT_FOUND` | 404 | Declaration doesn't exist |
| `INVALID_COUPLING_CODE` | 400 | Code invalid or expired |

## Rate Limiting

- **API Routes:** 100 requests/minute per IP
- **Auth:** 5 magic links/hour per email
- **Declaration Generation:** 10 per couple per day

## Webhooks (Future)

Coming soon:
- `couple.created` - When couple links
- `session.completed` - When session finished
- `declaration.sealed` - When declaration sealed

## Usage Examples

### JavaScript/Fetch

```javascript
// Sign in
const response = await fetch('/api/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

// Create session
const sessionRes = await fetch('/api/sessions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    categoryKey: 'faith',
    mode: 'deep'
  })
});
const session = await sessionRes.json();

// Save response
await fetch('/api/responses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    sessionId: session.id,
    step: 'mystory',
    responses: { q1: 'My answer' }
  })
});
```

### Streaming Declaration

```javascript
const response = await fetch('/api/declarations/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    sessionId: sessionId,
    coupleId: coupleId
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data:')) {
      const data = JSON.parse(line.slice(5));
      if (data.type === 'text-delta') {
        console.log(data.content); // Stream the text
      }
    }
  }
}
```

## Best Practices

1. **Always include Authorization header** for authenticated endpoints
2. **Handle streaming responses** for declaration generation
3. **Implement retry logic** for network errors
4. **Cache user data** on client to reduce API calls
5. **Validate inputs** before sending to API
6. **Use SWR or React Query** for data fetching
7. **Handle errors gracefully** and show user messages

---

**Last updated:** March 2024
