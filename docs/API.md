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

## Booking + Payment (Day 4)

### `POST /checkout`

Creates booking (`status=created`), reserves seats with `SELECT … FOR UPDATE`, creates Razorpay order.

Request:
```json
{
  "event_id": 1,
  "customer_name": "Ada Lovelace",
  "email": "ada@example.com",
  "phone": "9999999999",
  "qty": 1
}
```

Response `201`:
```json
{
  "order_id": "order_xxx",
  "booking_id": 12,
  "key_id": "rzp_test_xxx",
  "amount_paise": 49900,
  "currency": "INR"
}
```

Errors: `400` sold out / validation · `404` event · `503` Razorpay keys missing

---

### `POST /payment/verify`

Browser callback HMAC verify. **Optimistic UI only** — Day 5 webhook is source of truth.

Request:
```json
{
  "order_id": "order_xxx",
  "payment_id": "pay_xxx",
  "signature": "<hmac>"
}
```

Response `200`:
```json
{ "ticket_code": "TB-A1B2C3D4", "booking_id": 12 }
```

---

### `GET /bookings/:ticket_code`

Public confirmation lookup. Returns booking + event fields.

---

### `GET /admin/bookings`

Auth required. Query: `page`, `limit`, `status`, `q` (search name/email/ticket_code).

---

## Webhooks + Admin (Day 5)

### `POST /webhooks/razorpay`

Razorpay → our API. **Raw body** (`express.raw`) mounted **before** `express.json()`.

- Header `X-Razorpay-Signature` verified with `RAZORPAY_WEBHOOK_SECRET`
- Header `X-Razorpay-Event-Id` used for idempotency (`webhook_events.gateway_event_id` UNIQUE)
- On `payment.captured`: set booking `paid`, issue `ticket_code` if missing  
  (seats already reserved at `/checkout` — not incremented again)
- Duplicate events → still `200` (stop Razorpay retries)

---

### `GET /admin/dashboard`

Auth required.

```json
{
  "total_revenue_paise": 49900,
  "tickets_sold": 1,
  "failed_payments": 0,
  "event_count": 3,
  "paid_bookings": 1
}
```

---

### `GET /admin/webhooks`

Auth required. Paginated webhook log (`page`, `limit`).

---

### `GET /admin/upload-url?filename=banner.jpg`

Auth required. Returns S3 presigned PUT URL (scoped to `banners/*`).

```json
{
  "upload_url": "https://...",
  "key": "banners/....jpg",
  "public_url": "https://.../banners/....jpg",
  "expires_in": 300,
  "content_type": "image/jpeg"
}
```

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

*Day 5 complete for Week 1 API surface. Week 2 = EC2 / nginx / domain / SSL.*
