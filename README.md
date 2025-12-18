# AdultEdu

A comprehensive UK-oriented adult learning platform supporting workplace skills, adult basics, GCSE & A-Level preparation, higher education readiness, and tech pathways.

## Features

- **Essential Digital Skills (EDS)** - Aligned to UK EDS framework areas
- **GCSE Maths Prep** - Core topics with timed practice and mock exams
- **Python Foundations** - Beginner-to-intermediate programming path
- **UK Qualification Levels** - All content mapped to Entry Level 1 through Level 8
- **Diagnostic Assessments** - Personalized level recommendations
- **Progress Tracking** - Topic and outcome-level mastery tracking

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **ORM**: Prisma

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all project dependencies
npm run install:all
```

### 2. Set Up Environment

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend (optional, uses defaults)
cp frontend/.env.example frontend/.env
```

### 3. Set Up Database

```bash
# Ensure PostgreSQL is running (e.g. via Docker)
# docker compose up -d db

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

This starts:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + backend concurrently |
| `npm run dev:frontend` | Start frontend only |
| `npm run dev:backend` | Start backend only |
| `npm run build` | Build frontend for production |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:studio` | Open Prisma Studio (DB browser) |
| `cd backend && npm run db:import:sqlite-devdb` | Import legacy `backend/prisma/dev.db` into Postgres (requires `SQLITE_DATABASE_URL=file:./dev.db`) |
| `cd backend && npm run questions:audit` | Audit question consistency |
| `cd backend && npm run questions:fix -- --apply --align-levels` | Fix answers/options and align question levels to topic levels |

## Project Structure

```
adultedu/
├── frontend/           # React + Vite application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── lib/        # Utilities and helpers
│   │   └── index.css   # Global styles
│   └── ...
├── backend/            # Express API server
│   ├── src/
│   │   ├── routes/     # API route handlers
│   │   ├── middleware/ # Express middleware
│   │   └── config/     # Configuration
│   └── prisma/         # Database schema and migrations
└── ...
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Tracks
```
GET /api/tracks          # List all tracks
GET /api/tracks/:slug    # Get track details
```

### Frameworks
```
GET /api/frameworks      # List UK qualification frameworks
```

### UK Levels
```
GET /api/uk-levels       # List UK qualification levels
```

## Deployment

This project supports multiple deployment strategies:

### Option A: Railway (API + Postgres) + Cloudflare Pages (Web)
See `docs/deploy-railway-cloudflare-pages.md`

### Option B: VPS/Docker
See `docs/deploy-docker.md`

## Compliance Notice

> AdultEdu is an independent learning platform and is not affiliated with awarding bodies or exam boards. Content is aligned to UK frameworks and supports learners preparing for exams.

## License

Private - All rights reserved
