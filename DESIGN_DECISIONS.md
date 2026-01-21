# DESIGN_DECISIONS.md

This document explains the major architectural and algorithmic decisions taken while building the Mutual Fund Analytics backend. The system is designed to ingest large-scale NAV time-series data under strict API quotas, compute rolling analytics, and serve low-latency read APIs.

---

## 1. Rate Limiting Strategy

### What is implemented

The system uses a **Redis-backed distributed sliding-window counter** rate limiter with three independent limits:

- Per-second limit
- Per-minute limit
- Per-hour limit

Each request consumes tokens from all three buckets. If any bucket is exhausted, the request waits until the earliest bucket resets.

Implementation characteristics:

- Uses Redis as the shared state store.
- Counters are keyed by `(prefix, window, timestamp_bucket)`.
- Atomic `INCR` + `EXPIRE` is used to avoid race conditions.
- The limiter computes the exact sleep time until the earliest window resets.
- The limiter **delays** instead of rejecting in production mode.

### Proof of correctness

For any time window:

- Each request increments exactly one bucket for that window.
- If the counter exceeds the configured limit, the limiter computes the remaining time until the bucket resets.
- Because Redis operations are atomic, concurrent callers cannot exceed the configured limit.
- Because all instances share Redis, the limit is globally enforced across processes and restarts.

### How three limits coordinate

For each acquire:

1. Check second, minute, and hour buckets.
2. If all are under limit → proceed.
3. If any is over limit → compute the maximum required sleep across violated windows.
4. Sleep until the earliest reset, then retry.

This guarantees:

- No single window can be exceeded.
- The strictest window always dominates.

### Algorithm type

- This is effectively a **fixed-window sliding counter** hybrid.
- Not token bucket.
- Chosen because:
  - Simple to reason about
  - Exact quota enforcement
  - Deterministic behavior under concurrency
  - Easy to persist across restarts

---

## 2. Backfill Orchestration Under Quota Constraints

### What is implemented

- Funds are processed sequentially.
- Each fund is synced date-by-date.
- Every external API call passes through the rate limiter.
- State is persisted in the database (`last_synced_at` concept).

### Why sequential

- The rate limiter is the true throughput bottleneck.
- Parallelism would only increase contention, not throughput.
- Sequential execution simplifies:
  - Crash recovery
  - Resume logic
  - Debugging and determinism

### How throughput is maximized

- The limiter always runs at the maximum allowed speed.
- When blocked, it sleeps only for the minimum required time.
- There is no artificial throttling besides the real API quotas.

### Crash safety

- Each successful insert commits to DB.
- On restart, sync resumes from the last available date.
- Duplicate inserts are prevented by unique constraints.

---

## 3. Storage Schema for Time-Series NAV Data

### What is implemented

PostgreSQL is used with the following tables:

- `funds` — metadata
- `nav_history(fund_code, date, nav)` — append-only time series
- `fund_latest_nav` — denormalized latest snapshot
- `fund_analytics` — precomputed analytics per (fund, window)

### Why SQL and not a time-series DB

- Data size is moderate (few million rows max).
- Strong relational joins needed for APIs.
- Simple operational footprint.
- PostgreSQL handles:
  - Range scans
  - Indexing on `(fund_code, date)`
  - Aggregations
  - Constraints

### Optimization choices

- `(fund_code, date)` indexed
- Latest NAV denormalized to avoid MAX(date) queries
- Analytics stored in a single row per fund+window

---

## 4. Pre-computation vs On-demand

### What is implemented

- All rolling analytics are **precomputed offline**.
- APIs only read precomputed rows.

### Why not compute on-demand

- Rolling window computations are O(N) per request.
- Would not meet <200ms latency.
- Would duplicate work across users.

### Trade-off

- More storage
- More batch compute
- Much faster reads
- Predictable performance

---

## 5. Handling Schemes with Insufficient History

### What is implemented

- If a fund does not have enough data points to compute:
  - Rolling returns
  - CAGR distribution
- The computation for that window is skipped.
- No row is written to `fund_analytics`.

APIs then return:

```json
{ "status": "NOT_COMPUTED" }
```

## Why this is correct

- Any value computed would be statistically meaningless.
- Makes data quality explicit.
- Avoids fake precision.

---

## 6. Caching Strategy

### What is implemented

- Currently: **No Redis response caching**.
- Performance relies on:
  - Precomputed tables
  - Indexed queries
  - Denormalized latest NAV table

### How `<200ms` is achieved

- No heavy computation in the request path.
- All queries are:
  - Indexed
  - Bounded
  - Simple joins

### What could be cached later

- Rankings per `(category, window, sort)`
- Fund list responses
- TTL could be **1–6 hours**

---

## 7. Failure Handling

### What is implemented

**External API calls:**
- Retried via natural loop iteration
- Rate limiter enforces backoff implicitly

**Database:**
- Inserts are idempotent
- Unique constraints prevent duplication

**Analytics:**
- Invalid or infinite values are explicitly filtered
- Entire window computation is skipped if any aggregate is invalid

### Circuit breaking

- Not implemented.
- Could be added by:
  - Tracking consecutive failures
  - Pausing sync for a fund temporarily