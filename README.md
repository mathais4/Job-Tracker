# Job Application Tracker

Full-stack app for tracking job applications.

**Stack:** React (Vite) · Node/Express · PostgreSQL (plain SQL via `pg`) · JWT auth (bcrypt) · Zod validation · Vitest + Supertest

**Features:** register/login, create/edit/delete applications (company, role, status, interview date, notes), search + status filter + pagination, dashboard (counts by status, upcoming interviews, recent activity), validation, centralised error handling, integration tests.

## Run it locally

You need **Node 18+** and **PostgreSQL** (installed locally, or use the Docker file below).

### 1. Database

Option A: Docker
```bash
docker compose up -d
```
Option B: local Postgres
```bash
createdb job_tracker
```
Then set `DATABASE_URL` in the next step to match your setup (e.g. `postgres://localhost:5432/job_tracker`).

### 2. API (terminal 1)
```bash
cd server
npm install
cp .env.example .env        # edit DATABASE_URL / JWT_SECRET if needed
npm run migrate             # creates the tables
npm run dev                 # http://localhost:4000
```
Check: open http://localhost:4000/api/health and look for `{"status":"ok"}`.

### 3. Frontend (terminal 2)
```bash
cd client
npm install
npm run dev                 # http://localhost:5173
```
Open http://localhost:5173, sign up, and add an application. Vite proxies `/api` to the server, so no CORS setup is needed in dev.

### 4. Tests
Tests wipe tables, so they use a **separate** database (the test setup refuses to run against a database without "test" in its name).
```bash
createdb job_tracker_test    # Docker users: docker compose exec db createdb -U postgres job_tracker_test
cd server
cp .env.test.example .env.test
npm test
```

## API

All routes except register/login/health need `Authorization: Bearer <token>`.

| Method | Route | Notes |
|---|---|---|
| POST | `/api/auth/register` | `{email, password(min 8)}` → 201 `{token, user}` |
| POST | `/api/auth/login` | → 200 `{token, user}` |
| GET | `/api/auth/me` | current user |
| GET | `/api/applications` | query: `q`, `status`, `sort`, `order`, `page`, `limit` |
| POST | `/api/applications` | `{company, role, status?, interview_date?, notes?}` → 201 |
| GET/PATCH/DELETE | `/api/applications/:id` | 404 if it isn't yours |
| GET | `/api/dashboard` | totals, counts by status, upcoming interviews, recent |

Errors: `400` validation (`{error, details:[{field,message}]}`), `401` auth, `404`, `409` duplicate email, `500`.

## Design notes (good interview talking points)

- Every applications query filters by `user_id`, so users can never read or modify each other's data (covered by a test).
- Queries are parameterised; the only interpolated values (sort column/direction, limit/offset) come from validated Zod enums/numbers.
- Login returns the same error for unknown email and wrong password.
- `app.js` is separate from `index.js` so tests can use Supertest without opening a port.
- `bcryptjs` (pure JS) is used instead of `bcrypt` to avoid native build problems.

## Deploy

**Render (easiest, uses `render.yaml`):**
1. Push this repo to GitHub.
2. Render dashboard → New → Blueprint → select the repo. It creates the Postgres DB, the API and the static frontend.
3. After the first deploy, set `CLIENT_ORIGIN` on the API to your frontend URL, and `VITE_API_URL` on the frontend to your API URL. Redeploy both.

The API build step runs `npm run migrate`, so tables are created automatically.
