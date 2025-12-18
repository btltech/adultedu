# Deploying to Cloudflare

This guide covers deploying AdultEdu using Cloudflare Pages for the frontend and Cloudflare Workers (or just a VPS for the backend if Workers are not compatible with Express/Prisma easily) + D1.

> **Note**: This project uses Express and Prisma. While Prisma supports Cloudflare Workers, Express is standard Node.js. For Cloudflare, we recommend adaptors or switching to a VPS for the backend. The instructions below assume a standard **VPS** for Backend and **Pages** for Frontend, as this is the most stable path for this stack.

## Frontend (Cloudflare Pages)

1.  **Build**: Run `npm run build` in `frontend/`.
2.  **Deploy**:
    -   Link your GitHub repository to Cloudflare Pages.
    -   Set **Build Command** to `npm run build`.
    -   Set **Build Output Directory** to `dist`.
    -   Add Environment Variable `VITE_API_URL` pointing to your backend URL (e.g. `https://api.yourdomain.com/api`).

## Backend (VPS / Render / Railway)

Since the backend is a Node.js Express app with PostgreSQL:

1.  **Database**:
    -   Provision a PostgreSQL database (e.g. Supabase, Neon, or on the VPS).
    -   Update `DATABASE_URL` in `.env`.

2.  **Server**:
    -   Clone repo to VPS.
    -   `npm install`
    -   `npm run db:migrate`
    -   `npm start`
    -   Use Nginx/Caddy to proxy requests to port 3001.

## Alternative: Cloudflare Workers (Advanced)

To run this backend on Workers, you need:
1.  Migrate `express` to `hono` or use an adapter.
2.  Use Prisma's Data Proxy or D1 adapter.
*(This path requires significant code changes and is not covered here yet)*
