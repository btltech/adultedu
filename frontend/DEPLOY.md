Short deployment steps for Cloudflare Pages (wrangler) and Railway CLI

Prerequisites
- Install `wrangler` (npm i -g wrangler) and authenticate with `wrangler login`.
- Install `railway` CLI and authenticate: `npm i -g @railway/cli` and `railway login`.

Deploy frontend (Pages + Functions proxy)

1. Build the frontend:

```bash
cd frontend
npm ci
npm run build
```

2. Publish to Pages using `wrangler` (replace project name):

```bash
# Example using your Pages project shown in the dashboard
WRANGLER_PROJECT=adultedu npx wrangler pages publish ./dist --project-name "$WRANGLER_PROJECT" --branch main
```

Notes:
- Ensure the Pages project has `Functions` enabled so `frontend/functions/api/v1/[[path]].js` will be used as a proxy.
- `frontend/functions/sitemap.xml.js` and `frontend/functions/robots.txt.js` are served by Pages Functions for SEO.
- The sitemap now emits `lastmod` values for static, track, topic, and lesson URLs when timestamps are available.
- For same-origin API calls use Option B in docs: set `API_ORIGIN` on Pages environment to your Railway backend host.

Deploy backend to Railway

1. From repo root or `backend` folder, run:

```bash
cd backend
npm ci
railway up
```

2. After Railway creates (or if already created) your host, set `API_ORIGIN` on Cloudflare Pages to the Railway host (no trailing slash).

Example values from your projects:

- Cloudflare Pages dashboard: https://dash.cloudflare.com/24b639e6bb10b1ed00866ff2b98c40da/pages/view/adultedu
- Railway project: https://railway.com/project/941852e9-90f1-46a4-a51d-d04cd6c75059?environmentId=ba6d1c40-19b3-4152-97fe-17bbc851e961

If your backend is the already-deployed host referenced in `frontend/.env`, set:

```
API_ORIGIN=https://backend-production-bec9d.up.railway.app
```

(Don't include a trailing `/`.)

Note: `API_ORIGIN` is already set in [frontend/wrangler.toml](frontend/wrangler.toml) to `https://backend-production-bec9d.up.railway.app`. You can override this value in the Pages dashboard under Environment Variables if needed.

Google Search Console

1. Open Google Search Console for your verified property: `https://adult-edu.org`.
2. Submit `https://adult-edu.org/sitemap.xml` in the Sitemaps section.
3. After deployment, use URL Inspection on `/`, a representative `/track/...` page, and a representative `/lesson/...` page.
4. If you change the canonical domain or API origin, recheck `robots.txt` and `sitemap.xml` immediately after deploy.
