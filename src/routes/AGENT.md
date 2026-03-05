# AGENT.md (Routes)

This document explains route responsibilities and which reusable components must be used.

## Route Map

| Route | File | Responsibility |
|---|---|---|
| `/` | `src/routes/+page.server.ts` | Redirect to `/map/global` |
| `/map` | `src/routes/map/+page.server.ts` | Redirect to `/map/global` |
| `/map/global` | `src/routes/map/global/+page.svelte` | Global context map view |
| `/map/korea_estate` | `src/routes/map/korea_estate/+page.svelte` | South Korea real estate map view (WIP) |
| `/map/tokyo_estate` | `src/routes/map/tokyo_estate/+page.svelte` | Tokyo real estate map view (WIP) |
| `/map/+page.svelte` | `src/routes/map/+page.svelte` | Shared map page component consumed by map subroutes |
| `/settings` | `src/routes/settings/+page.svelte` | News pipeline configuration reference |
| `/api/news` | `src/routes/api/news/+server.ts` | REST-polled paged news feed endpoint (50/page) reading `mart.fact__news` joined to `mart.dim__city` via Drizzle ORM |
| `/api/ais/live` | `src/routes/api/ais/live/+server.ts` | Server-sent event stream that proxies AIS websocket vessel updates for map overlays |

## Map Route Responsive Rule

- For `/map` only, when viewport width is `<= 860px`, the left app navigation sidebar is replaced by a floating circular menu button that opens a compact navigation drawer.
- This mobile/tablet sidebar behavior is route-scoped to `/map` and must not apply to non-map routes.

## Menu State Shapes

- `Full`
  - Shape: expanded left sidebar panel with logo, top-level tab labels, and map child links all visible.
  - Context: desktop/tablet layouts when the sidebar is not collapsed.

- `Collapsed`
  - Shape: slim icon-only left rail; text labels and child links are hidden.
  - Context: desktop/tablet layouts when the collapse toggle is active.

- `Mobile-Minimized`
  - Shape: no persistent sidebar; only a floating circular menu trigger, which opens a compact drawer.
  - Context: `/map` route only, `<= 860px` viewport width.

## Required Component Usage

Route files should prefer these shared components from `src/lib/components`:

- `PageHeader` for page heading blocks
- `PanelCard` for panel/card wrappers
- `SectionTitle` for section headings
- `NewsFeedCard` for feed cards in map/news contexts
- `OpenWorldGlobe` for globe rendering
- `AreaWordCloud` for selected-area term cloud
- `ThemeTopicIcon` for shared topic icon rendering in legend/feed cards
- `MarkerInfoHoverPanel` for reusable hover-based area detail blocks
- `ThemeMixPieChart` for reusable theme-mix pie visualization

## Route Coding Rule

Do not duplicate card/header/chart scaffolding directly in route files if a shared component exists. Extend the component API first, then reuse it.

## Map Route Refactor Boundary

- `src/routes/map/+page.svelte` should remain an orchestration layer (state wiring, events, derived composition).
- Relationship-overlay construction belongs in `src/lib/domain/relationshipOverlayBuilder.ts`.
- Feed label/summary formatting belongs in `src/lib/domain/mapFeedFormatters.ts`.

## Update Policy (Required)

Whenever route structure or component usage changes:

1. Update this file to reflect current route ownership and shared component usage.
2. Update `src/lib/components/AGENT.md` if component inventory changed.
3. Keep both AGENT files synchronized so future work reuses components instead of generating unnecessary code.
