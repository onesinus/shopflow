# ShopFlow — API Reference

Base URL: `http://localhost:4000/api/v1` (dev). All routes below are relative to
this base unless prefixed with `/api/v1` explicitly.

## Conventions

### Success envelope

```json
{
  "data": { },
  "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5, "hasNextPage": true, "hasPrevPage": false }
}
```

Non-paginated responses include `data` only. `meta` is present on list endpoints.

### Error envelope

```json
{
  "error": { "message": "Your cart is empty" },
  "requestId": "abc123"
}
```

`message` is always user-friendly. For 5xx errors a `debug` field with the
underlying message is included when `NODE_ENV !== 'production'`.

### Auth

Protected routes require:

```
Authorization: Bearer <accessToken>
```

Roles: `admin`, `staff`, `customer`. Route markers below:

- 🔓 public
- 👤 any authenticated user
- 🛡️ staff or admin
- ⚑ admin only

---

## Health

| Method | Path     | Access | Description                     |
| ------ | -------- | ------ | ------------------------------- |
| GET    | /health  | 🔓     | Liveness check `{ status, uptime }` |

---

## Auth

| Method | Path                     | Access | Description                          |
| ------ | ------------------------ | ------ | ------------------------------------ |
| POST   | /auth/register           | 🔓     | Create a customer account            |
| POST   | /auth/login              | 🔓     | Exchange credentials for tokens      |
| POST   | /auth/refresh            | 🔓     | Refresh an expired access token      |
| POST   | /auth/logout             | 👤     | Discard a refresh token (client-side)|
| GET    | /auth/verify/:token      | 🔓     | Verify an email with the emailed token |
| POST   | /auth/resend-verification| 🔓     | Resend the verification email (rate limited) |
| POST   | /auth/forgot-password    | 🔓     | Send a reset token by email          |
| POST   | /auth/reset-password     | 🔓     | Set a new password using a token     |

### POST /auth/register

```json
{ "email": "a@example.com", "firstName": "Ada", "lastName": "Lovelace", "password": "Password123!" }
```

Returns the created user without `passwordHash`.

### POST /auth/login

```json
{ "email": "customer@shopflow.test", "password": "Password123!" }
```

Returns `{ accessToken, refreshToken, user }`. Unknown emails and wrong
passwords both return `401` with the same message. `user.emailVerified` reflects
whether the account's email has been verified.

### GET /auth/verify/:token

Marks the account's email as verified using the token emailed at registration.
Returns `400` for an invalid, expired or already-used token.

### POST /auth/resend-verification

```json
{ "email": "user@example.com" }
```

Sends a fresh verification email. Rate limited to 5 per hour per address.

---

## Users

| Method | Path                          | Access | Description                 |
| ------ | ----------------------------- | ------ | --------------------------- |
| GET    | /users/me                     | 👤     | Current user + profile      |
| PATCH  | /users/me                     | 👤     | Update profile fields       |
| GET    | /users/me/orders              | 👤     | Current user's orders       |
| GET    | /users/me/addresses           | 👤     | Current user's addresses    |
| POST   | /users/me/addresses           | 👤     | Add an address              |
| DELETE | /users/me/addresses/:id       | 👤     | Remove an address           |
| GET    | /users                        | ⚑      | List all users              |
| GET    | /users/:userId                | ⚑      | User detail                 |
| PATCH  | /users/:userId/role           | ⚑      | Change a user's role        |

---

## Catalog

| Method | Path                          | Access | Description                       |
| ------ | ----------------------------- | ------ | --------------------------------- |
| GET    | /products                     | 🔓     | List/search/filter products       |
| GET    | /products/slug/:slug          | 🔓     | Product detail by slug            |
| GET    | /products/:id                 | 🔓     | Product detail by id              |
| GET    | /products/:id/reviews         | 🔓     | Reviews for a product             |
| GET    | /categories                   | 🔓     | Active categories                 |
| GET    | /categories/:slug/products    | 🔓     | Products in a category            |

### GET /products

Query params:

| Param      | Meaning                                        |
| ---------- | ---------------------------------------------- |
| `q`        | Free-text search on product name (case-insensitive) |
| `category` | Category id filter                             |
| `brand`    | Brand filter                                   |
| `min_price`| Minimum price in cents                         |
| `max_price`| Maximum price in cents                         |
| `page`     | 1-based page number (default 1)                |
| `limit`    | Page size (default 10, max 100)                |

Response items include `category` and `inventory` associations.

---

## Product management (staff)

| Method | Path                    | Access | Description              |
| ------ | ----------------------- | ------ | ------------------------ |
| POST   | /products               | 🛡️     | Create a product + inventory row |
| PATCH  | /products/:id           | 🛡️     | Update product fields    |
| DELETE | /products/:id           | 🛡️     | Delete a product         |
| POST   | /products/:id/variants  | 🛡️     | Add a variant + inventory|

---

## Reviews

| Method | Path                | Access | Description            |
| ------ | ------------------- | ------ | ---------------------- |
| POST   | /products/:id/reviews | 👤    | Leave a review (1-5)   |

---

## Cart (authenticated)

| Method | Path                   | Description                        |
| ------ | ---------------------- | ---------------------------------- |
| GET    | /cart                  | Current cart with totals           |
| POST   | /cart/items            | Add a line item                    |
| PATCH  | /cart/items/:itemId    | Update quantity                    |
| DELETE | /cart/items/:itemId    | Remove a line item                 |

Cart responses include `subtotalCents`, `shippingCents`, `taxCents`,
`discountCents`, `totalCents` and `itemCount` alongside `items`.

---

## Wishlist (authenticated)

| Method | Path               | Description             |
| ------ | ------------------ | ----------------------- |
| GET    | /wishlist          | List saved items        |
| POST   | /wishlist/:productId | Save a product         |
| DELETE | /wishlist/:productId | Remove a saved product |

---

## Orders (authenticated)

| Method | Path                 | Description                      |
| ------ | -------------------- | -------------------------------- |
| POST   | /orders              | Checkout (place an order)        |
| GET    | /orders              | Current user's orders            |
| GET    | /orders/:orderId     | Order detail                     |
| POST   | /orders/:orderId/cancel | Cancel a pending/paid order   |

Checkout requires a **verified email** — unverified accounts receive `403`.

### POST /orders

```json
{
  "addressId": 1,
  "couponCode": "SAVE10",
  "paymentMethod": "card"
}
```

Returns the created order with `items`, `payment`, `address` and `coupon`.

---

## Coupons

| Method | Path             | Access | Description                 |
| ------ | ---------------- | ------ | --------------------------- |
| POST   | /coupons/validate| 👤     | Validate a code + subtotal  |

```json
{ "code": "SAVE10", "subtotalCents": 5000 }
```

---

## Payments

| Method | Path                 | Access | Description                 |
| ------ | -------------------- | ------ | --------------------------- |
| POST   | /payments/:orderId/charge | 👤 | (Re)charge an order (simulated) |

---

## Notifications (authenticated)

| Method | Path                  | Description                  |
| ------ | --------------------- | ---------------------------- |
| GET    | /notifications        | List notifications           |
| GET    | /notifications/unread-count | Count of unread          |
| POST   | /notifications/read-all | Mark all as read            |
| POST   | /notifications/:id/read | Mark one as read            |

---

## Admin

| Method | Path                           | Access | Description                        |
| ------ | ------------------------------ | ------ | ---------------------------------- |
| GET    | /admin/dashboard/stats         | ⚑      | Revenue/order/customer aggregates  |
| GET    | /admin/reports/sales           | ⚑      | Sales report (totals by day)       |
| GET    | /admin/reports/sales/export    | ⚑      | CSV export (**501 — not implemented**) |
| GET    | /admin/users                   | ⚑      | List all users                     |
| PATCH  | /admin/users/:userId/role      | ⚑      | Change role                        |
| GET    | /admin/orders                  | 🛡️     | List all orders                    |
| PATCH  | /admin/orders/:orderId/status  | 🛡️     | Update order status                |
| GET    | /admin/products/low-stock      | 🛡️     | Products at/below low-stock threshold |
| POST   | /admin/coupons                 | ⚑      | Create a coupon                    |

### Order status values

`pending`, `paid`, `shipped`, `delivered`, `cancelled`, `refunded`.

---

## Demo accounts

| Email                 | Password       | Role     |
| --------------------- | -------------- | -------- |
| admin@shopflow.test   | Password123!   | admin    |
| staff@shopflow.test   | Password123!   | staff    |
| customer@shopflow.test| Password123!   | customer |
| sam@example.com       | Password123!   | customer |
| tara@example.com      | Password123!   | customer |
| leo@example.com       | Password123!   | customer |
| maria@example.com     | Password123!   | customer |
| dormant@example.com   | Password123!   | customer (disabled) |
