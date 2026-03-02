# Raven Quant

Data engineering with an agentic workflow: a 4-agent handoff pipeline that ingests RSS news, extracts geo entities and city-to-city relationships, and writes to a mart layer for map visualization.

---

# News Cleaner (OpenAI Agent SDK)

This flow reads `warehouse.rss_items`, runs a 4-agent handoff pipeline, and writes geo-related records to `mart.fact__distilled_news` with city mappings.

## Pipeline

1. **`news_gatekeeper` agent**
   - Decides geo relevance from **title only**
   - If non-geo, exits with reason
   - If geo, hands off to country finder

2. **`country_finder` agent**
   - Extracts all involved countries from full article context
   - Normalizes aliases (`US` → `United States`)
   - Hands off to city finder

3. **`city_finder` agent**
   - Extracts explicit cities from full article context and country list
   - If country-only mention, uses capital city candidate
   - If geographic area mention (`coast of`, `gulf of`), picks nearest well-known city
   - If EU entity, includes `Brussels`, `Paris`, `Berlin`
   - Hands off to distiller

4. **`news_distiller` agent**
   - Writes a cleaned summary (≤ 40 words)
   - Extracts macro keyword theme (`upper`, `lower`)
   - Consolidates locations
   - Extracts city-to-city relationships
   - Relationship type is enum: `Assault`, `Cooperate`, `Independent`

5. **Rule-based enrichment in code**
   - City matching is DB-based against `mart.dim__city` (exact + fuzzy)
   - Country-to-capital behavior is prompt-driven in the city finder
   - EU-specific city expansion is prompt-driven in the city/distiller agents

Only geo-related rows are written to `mart.fact__distilled_news`.

## Agentic Workflow (Current)

```
rss_items
  → news_gatekeeper (perception: geo or non-geo)
  → country_finder (multi-country extraction)
  → city_finder (multi-city grounding + fallback rules)
  → news_distiller (summary + theme + city-to-city relationships)
  → DB enrichment/matching (dim__city exact/fuzzy)
  → fact__distilled_news + map__news_cities + map__news_relationship
```

This workflow is designed as an agentic handoff chain where each agent has a narrow role and passes structured context to the next step. The dedicated perception stage (`news_gatekeeper`) improves precision by filtering noisy non-geo items before extraction and distillation.

## Previous Workflow Attempts and Why They Failed

### v1 (single-city extraction)

- **Design:** Early version focused on extracting only one city per article.
- **Failure mode:** Did not model city-to-city relationships, so important cross-city dynamics were lost.
- **What changed:** City relationship extraction was added (and persisted in `mart.map__news_relationship`) so articles with multiple connected places can be represented correctly.

### v2 (no dedicated perception agent)

- **Design:** Attempted a similar multi-step extraction flow, but without a dedicated perception agent in front.
- **Failure mode:** Lower accuracy, because non-geo or weakly geo articles were not reliably filtered before downstream extraction.
- **What changed:** The `news_gatekeeper` perception step was introduced to make geo relevance gating explicit, which improved downstream country/city/relationship quality.

## Setup

1. Apply DDL from `flows/news_cleaner/table.sql`.
   - If you have the old schema from a previous version, migrate or recreate it before running this flow.
2. Configure Prefect SQL block:
   - `postgres-connector` must point to the target Postgres/Timescale DB.
3. Create a Prefect Secret block for the OpenAI API key (name `openai`):
   - `Secret.load("openai").get()` is used in the flow to set the key for the agents SDK.

## Run

Scheduled via `prefect.yaml` every minute (UTC).

Manual run:

```python
from flows.news_cleaner.job import news_cleaner_flow
news_cleaner_flow(batch_size=20, model="gpt-5-nano")
```

## Notes

- Idempotency is handled by `rss_item_id` unique upsert in `mart.fact__distilled_news`.
- News-city links are stored in `mart.map__news_cities`.
- Cross-city relations are stored in `mart.map__news_relationship`.
- Agent outputs are stored in `agent_trace` for audit/debug.
- A one-time historical backfill script is available at `scripts/backfill_news_distiller.py`.
