# Mutual Fund Analytics Backend

Backend system that ingests mutual fund NAV time-series data from external APIs, stores it in a relational database, precomputes analytics (rolling returns, drawdowns, CAGR), and serves fast (<200ms) APIs for listing, analytics, and rankings with Redis-based rate limiting and resumable idempotent backfill pipelines.

## Project Structure

```
src/
  application/
    analytics/              # Pure math/stat helpers (median, percentile, etc)
    ports/                  # Repository abstractions
    usecases/              # Business workflows
  infra/
    db/
      autoSeed/            # Database seeding with 10 Mutual Funds
        index.ts
        seed.ts
      migrations/          # Drizzle migrations
      index.ts
      pg.ts                # Postgres client
      schema.ts            # Drizzle schema
    ratelimit/
      redisRateLimit.lua   # Redis Lua script
      RedisRateLimiter.ts  # Rate limiter implementation
    redis/
      index.ts             # Redis client
    repositories/          # DB implementations
      DrizzleAnalyticsRepository.ts
      DrizzleFundRepository.ts
      DrizzleNavRepository.ts
      DrizzleLatestNavRepository.ts
      DrizzleSyncStateRepository.ts
  interfaces/http/
    MfApiHttpClient.ts     # HTTP adapter for external API
    routes.ts              # Express routes
  shared/
    logger.ts              # Logging utility
    types.ts               # Shared types
    analytics.ts           # Type definitions
    config.ts              # Configuration
    server.ts              # Server setup
  tests/                   # Test suite
  Dockerfile               # Docker build
  drizzle.config.ts        # Drizzle configuration
  package-lock.json
  package.json
  tsconfig.json
```

## Responsibilities

**application/** — Pure business logic orchestrating workflows: sync all funds, compute analytics, backfill pipelines. No HTTP or DB details.

**domain/services/** — Core domain logic like analytics calculations.

**infra/** — Infrastructure: Postgres via Drizzle, Redis, external API clients, rate limiter, repository implementations.

**interfaces/http/** — Delivery layer: Express routes, request/response mapping, no business logic.

**ports/** — Repository abstractions between business logic and storage.

**shared/** — Utilities, types, configuration, and logging.

## How It Works

1. `/sync/trigger` triggers the ingestion pipeline
2. Rate limiter enforces per-second, per-minute, per-hour quotas
3. NAV data stored in database via `NavRepository`
4. Latest NAV snapshot stored via `LatestNavRepository`
5. Analytics computed and stored via `AnalyticsRepository`
6. APIs read from precomputed tables for fast responses

## Running with Docker

### Setup

```bash
cp .env.example .env
```

### Start Stack

```bash
docker compose build
docker compose up
```

API available at `http://localhost:3000`

### Initialize Database

```bash
docker compose exec backend sh
npm run db:generate
npm run db:migrate
```

### Run Backfill/Sync

```bash
curl -X POST http://localhost:3000/sync/trigger
curl http://localhost:3000/sync/status
```

### Testing & Cleanup

```bash
npm test
docker compose down -v
```

## Main APIs

- `GET /funds`
- `GET /funds/:code`
- `GET /funds/:code/analytics?window=3Y`
- `GET /funds/rank?category=...&window=3Y&sort_by=median_return`
- `POST /sync/trigger`
- `GET /sync/status`

## Design Benefits

Clear separation: business logic, infrastructure, HTTP layer. Precomputed analytics enable predictable fast queries. Idempotent and resumable pipelines. Global Redis-based rate limiting. Independent testability per layer.