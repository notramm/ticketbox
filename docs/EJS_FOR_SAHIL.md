# EJS template structure — for Sahil (CSS)

Ram owns the data wiring. Sahil owns `public/css/main.css`.

## Pages

| URL | Template | Data |
|---|---|---|
| `/` | `home.ejs` | `events[]` published only |
| `/events/:slug` | `event.ejs` | `event` + helpers |
| `/bookings/lookup` | `booking-lookup.ejs` | stub until Day 4–5 |

## Layout

- `layout.ejs` — HTML shell
- `partials/header.ejs`, `partials/footer.ejs`

## CSS class contract (stable)

- Layout: `.site-header`, `.site-logo`, `.site-nav`, `.site-main`, `.site-footer`
- Home: `.home`, `.event-list`, `.event-card`, `.event-card__title`, `.event-card__price`, `.event-card__seats`
- Detail: `.event-detail`, `.event-detail__title`, `.event-detail__facts`, `.booking-form`
- Forms: `.field`, `.field__label`, `.field__input`, `.btn`, `.btn--primary`

Helpers available in every template: `formatPrice(paise)`, `formatDate(date)`, `seatsLeft(event)`.

Banners: set `S3_PUBLIC_BASE_URL` in `.env` when S3 is ready. Image only renders if both base URL and `banner_key` exist.
