# TicketBox API Contract

**Owner:** Ram (Backend)  
**Consumer:** Sahil (React admin SPA)  
**Base URL (local):** `http://localhost:4000`  
**Frozen:** Day 2 — do not change endpoints or response shapes without telling Sahil first.

All money values are integers in **paise** (₹100 = `10000`). No floats.

---

## Auth

### `POST /auth/login`

Request:
```json
{ "email": "admin@ticketbox.local", "password": "Admin@12345" }
```

Response `200`:
```json
{
  "token": "<jwt>",
  "user": { "id": 1, "email": "admin@ticketbox.local", "role": "admin" }
}
```

Errors: `401` invalid credentials · `400` validation failed

---

### `GET /auth/me`

Header: `Authorization: Bearer <token>`

Response `200`:
```json
{ "id": 1, "email": "admin@ticketbox.local", "role": "admin" }
```

Errors: `401` missing/invalid token

---

## Events (public)

### `GET /events`

Query: `page` (default `1`), `limit` (default `20`, max `100`)

Returns **published** events only (`deleted_at IS NULL`).

Response `200`:
```json
{
  "data": [
    {
      "id": 1,
      "slug": "intro-to-nodejs",
      "title": "Intro to Node.js Workshop",
      "description": "...",
      "banner_key": null,
      "price_paise": 49900,
      "total_seats": 40,
      "seats_sold": 0,
      "seats_left": 40,
      "starts_at": "2026-08-17T00:00:00.000Z",
      "status": "published",
      "created_at": "...",
      "updated_at": "...",
      "deleted_at": null
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 2, "total_pages": 1 }
}
```

---

### `GET /events/:slug`

One published event + `seats_left`.

Errors: `404` not found / not published

---

## Events (admin)

All admin routes require:
```
Authorization: Bearer <token>
```
Role must be `admin`. Missing token → `401`. Wrong role → `403`.

### `GET /admin/events`

Query: `page`, `limit`  
Returns draft + published (not soft-deleted).

---

### `POST /admin/events`

Request:
```json
{
  "slug": "aws-deploy-lab",
  "title": "AWS Deploy Lab",
  "description": "EC2, nginx, PM2",
  "banner_key": null,
  "price_paise": 99900,
  "total_seats": 25,
  "starts_at": "2026-09-01T10:00:00.000Z",
  "status": "draft"
}
```

- `slug`: lowercase kebab-case, unique  
- `price_paise`: integer ≥ 0  
- `total_seats`: integer ≥ 1  
- `status`: `draft` | `published` (default `draft`)

Response `201`: created event object (includes `seats_left`)

Errors: `400` validation · `409` slug exists

---

### `PATCH /admin/events/:id`

Partial update. At least one of: `slug`, `title`, `description`, `banner_key`, `price_paise`, `total_seats`, `starts_at`.

Cannot set `total_seats` below `seats_sold`.

---

### `PATCH /admin/events/:id/publish`

Sets `status = published`.

---

### `PATCH /admin/events/:id/unpublish`

Sets `status = draft`.

---

## Health

### `GET /health`

```json
{ "status": "ok", "db": "ok", "uptime": 12.34 }
```

---

## Error shape (all routes)

```json
{ "error": "message", "details": ["optional joi messages"] }
```

---

## Not in Day 2 (coming later)

| Endpoint | Day |
|---|---|
| `POST /checkout` | 4 |
| `POST /payment/verify` | 4 |
| `POST /webhooks/razorpay` | 5 |
| `GET /bookings/:ticket_code` | 4–5 |
| `GET /admin/bookings` | 4–5 |
| `GET /admin/dashboard` | 5 |
| `GET /admin/webhooks` | 5 |
| `GET /admin/upload-url` | 5 |

---

*Shared with Sahil on Day 2. Freeze until both agree to change.*
