# AGENT.md (Components)

This document defines the reusable UI components in `src/lib/components`.

## Purpose

Avoid duplicate UI implementation across routes. Reuse these components first before creating new route-local markup.

## Component Inventory

| Component | File | Use Case |
|---|---|---|
| `PageHeader` | `src/lib/components/PageHeader.svelte` | Standard page top block (eyebrow, title, description) |
| `PanelCard` | `src/lib/components/PanelCard.svelte` | Reusable dark card wrapper for panels, charts, and text blocks |
| `SectionTitle` | `src/lib/components/SectionTitle.svelte` | Simple section heading between grouped panels |
| `OpenWorldGlobe` | `src/lib/components/OpenWorldGlobe.svelte` | Cesium globe component with interactive news markers, AIS vessel overlays, and camera focus |
| `AreaWordCloud` | `src/lib/components/AreaWordCloud.svelte` | ECharts wordcloud renderer for selected area context |
| `ThemeTopicIcon` | `src/lib/components/ThemeTopicIcon.svelte` | Reusable topic icon renderer shared by feed cards and map legend |
| `ThemeMixPieChart` | `src/lib/components/ThemeMixPieChart.svelte` | Reusable Bloomberg-styled Apache ECharts pie chart for theme mix composition |
| `MarkerInfoHoverPanel` | `src/lib/components/MarkerInfoHoverPanel.svelte` | Hover-only marker info panel showing area name, theme-mix pie chart, and word cloud |
| `NewsFeedCard` | `src/lib/components/NewsFeedCard.svelte` | Clickable news card with source/title/link/summary/location/keyword/model metadata |
| `GlobeHoverPopup` | `src/lib/components/map/GlobeHoverPopup.svelte` | Globe hover popup container that hosts marker hover details |
| `GlobeErrorToast` | `src/lib/components/map/GlobeErrorToast.svelte` | Globe-local initialization error toast surface |

## Reuse Rules

1. If a page needs a header, use `PageHeader`.
2. If a page needs a boxed panel, use `PanelCard`.
3. If a page needs news-item cards, use `NewsFeedCard`.
4. Do not recreate these patterns in route files unless a clear exception is documented.

## Update Policy (Required)

Whenever any component in `src/lib/components` is added, removed, renamed, or behaviorally changed:

1. Update this `src/lib/components/AGENT.md` inventory table.
2. Update `src/routes/AGENT.md` usage notes if route integration changed.
3. Prefer refactoring routes to consume updated components rather than introducing duplicate route-local code.
