# Edemy — LMS

React (Vite) client + Express/MongoDB server, with Clerk for auth, Cloudinary for
thumbnails and Stripe for payments.

## Running locally

```bash
npm run install:all   # installs root, server and client dependencies
npm run dev           # starts the API on :5000 and the client on :5173
```

`npm run dev` runs both processes together. To run them separately use
`npm run server` and `npm run client`.

## Configuration

Copy the two templates and fill them in:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

`client/.env` must point `VITE_BACKEND_URL` at the API (`http://localhost:5000`).
If Vite picks a different port because 5173 is busy, nothing needs changing — the
Stripe return URL is derived from the browser's own origin.

## How this works without public webhooks

Two flows normally depend on webhooks, which cannot reach a machine on localhost.
Both have a local path so the site is fully usable during development:

- **User records.** Instead of relying only on the Clerk `user.created` webhook,
  the API upserts the MongoDB user from the Clerk session the first time a signed-in
  user hits a protected route (`server/utils/syncUser.js`).
- **Enrollment after payment.** Stripe Checkout redirects back to
  `/loading/my-enrollments?session_id=...`. The client posts that session id to
  `POST /api/user/verify-purchase`, which confirms the payment with Stripe and
  completes the enrollment. The webhook still works in production, and the shared
  `completePurchase` helper is idempotent so the two paths never double-enroll.

## Course thumbnails

`POST /api/educator/add-course` uploads the thumbnail to Cloudinary. If Cloudinary
is unconfigured or rejects the upload, the file stays in `server/uploads` and is
served by the API from `/uploads/<file>`, so adding a course still works locally.
The reason for the rejection is logged. That fallback is disabled on Vercel, whose
filesystem is read-only, so a failed upload surfaces as a real error there.

A Cloudinary `403 - Request forbidden due to missing permissions (actions=["create"])`
means the API key can read but not upload: check the key's access level under
**Settings -> API Keys**, and that the account's email is verified.

## Becoming an educator

Sign in, then click **Become Educator** in the navbar. That calls
`GET /api/educator/update-role`, which sets `publicMetadata.role = 'educator'` on the
Clerk user and unlocks `/educator`.

## API

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | – | Config and DB diagnostics |
| GET | `/api/course/all` | – | Published courses (no content/roster) |
| GET | `/api/course/:id` | – | One course; paid lecture URLs stripped |
| GET | `/api/user/data` | user | Mongo user record (created on demand) |
| GET | `/api/user/enrolled-courses` | user | Enrolled courses with lectures |
| POST | `/api/user/purchase` | user | Create a Stripe Checkout session |
| POST | `/api/user/verify-purchase` | user | Complete enrollment after checkout |
| POST | `/api/user/get-course-progress` | user | Completed lectures for a course |
| POST | `/api/user/update-course-progress` | user | Mark a lecture complete |
| POST | `/api/user/add-rating` | user | Rate an enrolled course |
| GET | `/api/educator/update-role` | user | Promote the caller to educator |
| POST | `/api/educator/add-course` | educator | Publish a course (multipart) |
| GET | `/api/educator/courses` | educator | The educator's own courses |
| GET | `/api/educator/dashboard` | educator | Earnings, course and enrollment totals |
| GET | `/api/educator/enrolled-students` | educator | Completed purchases |
| POST | `/clerk` | svix sig | Clerk user webhook |
| POST | `/stripe` | stripe sig | Stripe payment webhook |
