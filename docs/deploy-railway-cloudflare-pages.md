# Deploying to Railway (API) + Cloudflare Pages (Web)

This guide deploys:
- **Backend API** (Express + Prisma) on **Railway** with **PostgreSQL**
- **Frontend** (React + Vite) on **Cloudflare Pages**

## 0) Important: cookies/CSRF in production

This app uses **cookie sessions** + a **CSRF token cookie** (`XSRF-TOKEN`) that the frontend reads and sends back in the `X-CSRF-Token` header.

That means you must deploy in one of these two ways:

### Option A (recommended): Custom domain, same root domain
Example:
- Frontend: `https://app.example.com`
- Backend: `https://api.example.com`

Set `COOKIE_DOMAIN=.example.com` on the backend so the `XSRF-TOKEN` cookie is readable by the frontend subdomain.

### Option B: Proxy `/api/v1/*` through Cloudflare Pages Functions
If you plan to use the default `*.pages.dev` + `*.railway.app` domains, use a Pages Function proxy so the browser calls the API on the **same origin** as the frontend.

If you *don’t* use Option A or B, login and any POST/PUT/DELETE requests will fail due to cookie/CSRF constraints.

## 1) Backend on Railway

### Create services
1. Create a **Railway project**
2. Add **PostgreSQL** (Railway plugin)
3. Add a **Node service** from your GitHub repo
   - Set **Root Directory** to `backend`

### Environment variables (Railway)
Set these on the Railway backend service:
- `NODE_ENV=production`
- `DATABASE_URL=...` (Railway provides this when you add Postgres)
- `SESSION_SECRET=...` (generate a long random string)
- `FRONTEND_URL=...` (your Cloudflare Pages URL or custom domain)
- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE=lax`
- Option A only: `COOKIE_DOMAIN=.example.com`

### Build / start commands
Use one of these approaches:

- **Simple (recommended)**:
  - Start command: `npx prisma migrate deploy && npm start`
  - Then run seed once from Railway shell: `npx prisma db seed`

- **Alternative**:
  - Start command: `npm start`
  - Run migrations manually from Railway shell on each deploy: `npx prisma migrate deploy`

## 2) Frontend on Cloudflare Pages

### Pages project settings
In Cloudflare Pages:
- **Framework preset**: Vite
- **Root directory**: `frontend`
- **Build command**: `npm ci && npm run build`
- **Build output directory**: `dist`

### Frontend environment variables (Cloudflare Pages)

If using **Option A (custom domain)**:
- `VITE_API_URL=https://api.example.com/api/v1`

If using **Option B (Pages proxy)**:
- You can leave `VITE_API_URL` empty (frontend defaults to `/api/v1`)

## 3) Option B: Pages Functions proxy (no custom domain)

Create a proxy function so requests to your Pages site at `/api/v1/*` forward to Railway.

1. Add a Pages environment variable:
   - `API_ORIGIN=https://<your-railway-backend-host>` (no trailing slash)
2. Use the included function file:
   - `frontend/functions/api/v1/[[path]].js`

## 4) Quick production smoke test
After deploy:
- Open the Pages site
- Sign up / log in
- Start a practice session and submit an answer (confirms cookies + CSRF + scoring)

## 5) Optional: add Entry Level (E1/E2) workplace content
If you want workplace learners to start at E1/E2:
- Create E1/E2 topics: `node backend/scripts/seed-entry-level-workplace-topics.js --apply`
- Generate questions (run from your machine with `DATABASE_URL` pointing at Railway Postgres, and `LLM_API_URL` pointing at LM Studio):
  - `node backend/scripts/top-up-workplace-questions.js --target=50 --mode=diverse --apply`
