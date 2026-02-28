# AGENT.md

This file defines how coding agents should operate in this repository.

## Mission

Build and maintain a SvelteKit-based map + settings console that visualizes geo-tagged news from Postgres and keeps backend integrations secure.

## Current Project State

- App root is this repository root (no nested `web/` project).
- Frontend and backend run in one SvelteKit app.
- High-level product plan is documented in `README.md`.

## Tech Stack

- SvelteKit + TypeScript
- Vite
- Node runtime for server routes
- Drizzle ORM + Postgres (`pg`)

## Directory Expectations

- `src/routes` for pages and API routes (`+page.svelte`, `+server.ts`)
- `src/lib` for shared UI, stores, and utility code
- `static` for static assets

Route- and component-level conventions are also documented in:

- `src/routes/AGENT.md`
- `src/lib/components/AGENT.md`

## Required Sidebar Information Architecture

Primary navigation must contain exactly two top-level tabs:

1. `Map`
2. `Settings`

## Security Rules

- Secrets only via environment variables.
- Never hardcode credentials in client-side code.
- Keep database credentials in env vars (`NEWS_DB_HOST`, `NEWS_DB_PORT`, `NEWS_DB_USER`, `NEWS_DB_PASSWORD`, `NEWS_DB_NAME`, optional `NEWS_DB_SSL`).
- Sanitize error messages returned to UI.

## Coding Conventions

- TypeScript strictness preferred; avoid `any` unless justified.
- Keep components focused and small.
- Add comments only when behavior is non-obvious.
- Prefer pure utility functions for metric calculations.
- Keep panel purpose aligned with one structural question.

## Development Commands

- `npm run dev` - local development
- `npm run check` - type + Svelte checks
- `npm run build` - production build

## News + Map Rules

- `/api/news` must read from `mart.fact__news` and join `mart.dim__city` by `city_id`.
- `/api/news` must stay read-only and return paged results capped at 50 rows per page.
- Polling defaults to 1 minute; UI must provide 5-minute and 10-minute auto-poll options.
- Map page must render city coordinates from `dim__city.latitude`/`dim__city.longitude`.
- News cards on `/map` should surface source/title/link/summary/time/location/theme/action fields.

## Done Criteria for Changes

- `npm run check` passes
- New route or feature has minimal error handling
- No credential leakage to client bundle
- README stays aligned with implementation status
