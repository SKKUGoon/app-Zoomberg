# AGENT.md (Routes)

This document explains route responsibilities and which reusable components must be used.

## Route Map

| Route | File | Responsibility |
|---|---|---|
| `/` | `src/routes/+page.server.ts` | Redirect to map |
| `/map` | `src/routes/map/+page.svelte` | Cesium globe + postgres-backed live news feed with selectable polling cadence |
| `/settings` | `src/routes/settings/+page.svelte` | News pipeline configuration reference |
| `/api/news` | `src/routes/api/news/+server.ts` | REST-polled paged news feed endpoint (50/page) reading `mart.fact__news` joined to `mart.dim__city` via Drizzle ORM |
| `/api/ais/live` | `src/routes/api/ais/live/+server.ts` | Server-sent event stream that proxies AIS websocket vessel updates for map overlays |

## Required Component Usage

Route files should prefer these shared components from `src/lib/components`:

- `PageHeader` for page heading blocks
- `PanelCard` for panel/card wrappers
- `SectionTitle` for section headings
- `NewsFeedCard` for feed cards in map/news contexts
- `OpenWorldGlobe` for globe rendering
- `AreaWordCloud` for selected-area term cloud

## Route Coding Rule

Do not duplicate card/header/chart scaffolding directly in route files if a shared component exists. Extend the component API first, then reuse it.

## Update Policy (Required)

Whenever route structure or component usage changes:

1. Update this file to reflect current route ownership and shared component usage.
2. Update `src/lib/components/AGENT.md` if component inventory changed.
3. Keep both AGENT files synchronized so future work reuses components instead of generating unnecessary code.
