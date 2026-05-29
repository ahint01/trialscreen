# Trialscreen

Monorepo for screening patients against clinical trial eligibility. A React frontend talks to a NestJS API over tRPC; uploaded trial documents are processed asynchronously via AWS SQS and Gemini.

## Structure

| Path | Role |
|------|------|
| `apps/trialscreen-frontend` | React + Vite UI |
| `apps/trialscreen-backend` | NestJS API, Knex/Postgres, tRPC, SQS consumer |
| `packages/shared` | Shared tRPC `AppRouter` types for the frontend |

## Prerequisites

- Node.js 20+
- PostgreSQL
- AWS SQS queue (for document ingestion / eligibility jobs)
- Gemini API key (used by the SQS consumer)

## Setup

```bash
cp .env.example .env
# fill in database, AWS, and Gemini values

npm install
npm run db:migrate
```

## Development

Run the API and UI in separate terminals:

```bash
npm run dev:backend   # http://localhost:3000  (/trpc)
npm run dev:frontend  # http://localhost:5173  (proxies /trpc to the API)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:backend` | Nest watch mode |
| `npm run dev:frontend` | Vite dev server |
| `npm run build` | Build backend and frontend |
| `npm run db:migrate` | Apply Knex migrations |
| `npm run test` | Backend Jest tests |

## Notes

- JWT signing uses a dev secret in `apps/trialscreen-backend/src/auth/constants.ts`; replace with an env-driven secret before production.
- Place `.env` at the repo root (Knex loads it from there).
