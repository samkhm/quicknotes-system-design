# QuickNotes REST API Design

## Overview

This document describes the proposed production QuickNotes API, not the JSONPlaceholder practice service used by the browser client. The API uses JSON over HTTPS, versioned under `/api/v1`, and requires authentication for user-owned notes. IDs are opaque identifiers. All timestamps are UTC ISO 8601 strings.

## Endpoint catalogue

| Method | Path | Description | Success status |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Create a user account | `201 Created` |
| POST | `/api/v1/auth/login` | Authenticate and issue access/refresh tokens | `200 OK` |
| GET | `/api/v1/notes` | List the authenticated user's notes; supports `page`, `limit`, `q`, and `tag` | `200 OK` |
| POST | `/api/v1/notes` | Create a note owned by the authenticated user | `201 Created` |
| GET | `/api/v1/notes/{noteId}` | Retrieve one owned note | `200 OK` |
| PATCH | `/api/v1/notes/{noteId}` | Update selected note fields | `200 OK` |
| DELETE | `/api/v1/notes/{noteId}` | Delete a note | `204 No Content` |
| GET | `/api/v1/tags` | List the user's tags | `200 OK` |
| PUT | `/api/v1/notes/{noteId}/tags/{tagId}` | Attach a tag to a note (idempotent) | `204 No Content` |
| DELETE | `/api/v1/notes/{noteId}/tags/{tagId}` | Detach a tag from a note | `204 No Content` |

## Create note

Request:

```http
POST /api/v1/notes
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "title": "Plan study session",
  "body": "Review REST APIs and SQL joins.",
  "tagIds": ["tag_01"]
}
```

Response (`201 Created`):

```json
{
  "data": {
    "id": "note_01J9KQ",
    "title": "Plan study session",
    "body": "Review REST APIs and SQL joins.",
    "tags": [{"id": "tag_01", "name": "study"}],
    "createdAt": "2026-10-18T18:30:00Z",
    "updatedAt": "2026-10-18T18:30:00Z"
  }
}
```

The server derives the owner from the authenticated identity; clients cannot set `userId` to create notes for another user. `title` is required, trimmed, and limited to 100 characters. `body` is optional and has a documented service limit.

## List notes

Request:

```http
GET /api/v1/notes?page=1&limit=20&q=study
Authorization: Bearer <access-token>
```

Response (`200 OK`):

```json
{
  "data": [
    {
      "id": "note_01J9KQ",
      "title": "Plan study session",
      "body": "Review REST APIs and SQL joins.",
      "tags": [{"id": "tag_01", "name": "study"}],
      "createdAt": "2026-10-18T18:30:00Z",
      "updatedAt": "2026-10-18T18:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

Pagination limits response size and avoids unbounded scans. The API should enforce a maximum `limit` (for example, 100) and return a stable ordering such as `updated_at DESC, id DESC`.

## Error status codes

| Status | Meaning | Typical cause |
|---|---|---|
| `400 Bad Request` | Invalid request | Malformed JSON or invalid query parameters |
| `401 Unauthorized` | Authentication required or invalid | Missing, expired, or invalid token |
| `403 Forbidden` | Authenticated but not allowed | Attempt to use a restricted operation |
| `404 Not Found` | Resource does not exist or is not visible to this user | Unknown note ID |
| `409 Conflict` | Request conflicts with current state | Duplicate unique tag name |
| `422 Unprocessable Content` | Field validation failed | Missing title or title over 100 characters |
| `429 Too Many Requests` | Rate limit exceeded | Too many requests in a time window |
| `500 Internal Server Error` | Unexpected server failure | Unhandled internal error |

Example error body:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": [
      {"field": "title", "message": "Title is required and must be at most 100 characters."}
    ],
    "requestId": "req_01J9KR"
  }
}
```

Error responses must not expose stack traces, SQL details, secrets, or internal infrastructure. `requestId` allows operators to correlate client reports with server logs.

## Conventions and security

- Use HTTPS everywhere and JSON request/response bodies.
- Authenticate with short-lived access tokens; rotate and revoke refresh tokens securely.
- Authorize every note and tag operation against the authenticated user's ownership.
- Validate input on the server even when the browser validates it.
- Use parameterized SQL queries and rate limits; log security-relevant events without logging credentials or note bodies unnecessarily.
- Use `201` with a resource representation for creation and `204` for successful deletion with no response body.
