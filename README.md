# Raven Quant News Map

This repository is a SvelteKit app focused on one workflow:

- pull news from Postgres (`mart.fact__news`),
- join city coordinates from `mart.dim__city`,
- render cards and location markers on the map,
- auto-poll on a selectable cadence (1, 5, or 10 minutes),
- query through Drizzle ORM (read-only app behavior).

## Routes

- `/` -> redirects to `/map`
- `/map` -> world map + live news feed
- `/settings` -> configuration reference for news pipeline
- `/api/news` -> server route that reads from Postgres

## Environment Variables

Set these in your environment (or local env file):

- `NEWS_DB_HOST` (required)
- `NEWS_DB_PORT` (default `5432`)
- `NEWS_DB_USER` (required)
- `NEWS_DB_PASSWORD` (required)
- `NEWS_DB_NAME` (required)
- `NEWS_DB_SSL` (`true` or `false`, default `false`)

## Development

- `npm run dev`
- `npm run check`
- `npm run build`

## Notes

- gRPC and Influx integrations were removed from this codebase.
- Dashboard routes and dashboard API endpoints were removed.
- `/api/news` returns paged rows (50 per page max) and map markers are capped to those 50 rows.
