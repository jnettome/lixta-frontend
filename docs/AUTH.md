# Authentication and API (tarefas-backend)

The lixta2 app talks to the Rails API configured by **`VITE_APP_API_URL`** (defaults to `http://localhost:3000` if unset).

## Headers

- **`Accept`**: `application/json`
- **`Content-Type`**: `application/json` on requests with a body
- **`Authorization`**: `Bearer <jwt>` on routes that require a logged-in user (after OTP login)

## Sign in / “register”

There is **no separate register endpoint**. New and existing users both use email + one-time code (OTP).

### `POST /login`

**Body:** `{ "email": string, "otp": string }`

1. **Request code (first step):** send the same `email` with **`otp` empty** (`""`). For an existing user the server typically responds with **400** and an empty JSON body; the client treats that as “check your inbox” (OTP was sent or scheduled).
2. **Complete sign-in:** send **`email`** and the **`otp`** from the email. On success the server responds **201** with JSON shaped like:

```json
{
  "user": {
    "id": 1,
    "email": "you@example.com",
    "name": null,
    "avatar_url": null,
    "cellphone": null,
    "created_at": "...",
    "updated_at": "..."
  },
  "token": "<jwt>"
}
```

- **403** usually means wrong OTP / user not allowed to complete login.

For a **brand-new** email, the backend may create the user, send OTP, and still return **400** until a valid OTP is submitted (same two-step flow).

## Session

lixta2 stores **`{ token, user }`** in `localStorage` and sends the token as **`Authorization: Bearer ...`** on API calls.

### `POST /logout`

**Body:** `{}` (empty JSON object is fine).

Requires **`Authorization`**. Invalidates the JWT on the server (`expire_jwt_at`). The client clears local storage after calling this (even if the request fails).

## Current user / profile

### `GET /me`

Returns the current user as a **flat** JSON object (same fields as in `user` from login, e.g. `id`, `email`, `name`, `avatar_url`, …). Requires **`Authorization`**.

### `PUT /me`

**Body:** `{ "user": { "name", "email", "cellphone", "avatar_url", "username", ... } }` — only send fields you want to change. Requires **`Authorization`**.

### `POST /avatar_presign`

**Body:** `{ "file_name": string }`

**Response:** `{ "url": "<presigned PUT>", "public_url": "<public URL after upload>" }`

Upload the file with **`PUT url`** and the appropriate **`Content-Type`**, then **`PUT /me`** with `{ "user": { "avatar_url": "<public_url>" } }`.

## Workspaces (authenticated)

### `GET /workspaces`

Requires **`Authorization`**. Returns a **JSON array** of workspaces (`id`, `name`, `slug`, `description`, nested `boards`, …).

### `POST /workspaces`

**Body:** `{ "workspace": { "name": string } }`

Requires **`Authorization`**. Creates a workspace for the current user. **201** response uses the same shape as **`GET /workspaces/:id`** (show), including `slug` for deep links elsewhere.
