# Pulsar-Only Price Layer

This project now supports a Pulsar-first price storage pattern:

- Datomic remains for user/auth/strategy metadata.
- Raw exchange prices are treated as an append-only stream in Pulsar.
- Lower timeframe OHLC projections are derived from raw ticks and published back to Pulsar.
- A small in-memory cache is kept for fast UI reads.

## Why this shape

- Durable enough: Pulsar log is the replay source for price history.
- Cheap enough: one raw topic + compact projected topics per timeframe.
- Fast enough for visualization: service keeps hot bars in memory and resolvers read from cache first.
- OSS-only: no managed/proprietary requirement.

## Topics

- Input (raw ticks): `persistent://public/default/prices.raw.ticks`
- Output (projected bars):
  - `persistent://public/default/prices.projection.1s`
  - `persistent://public/default/prices.projection.5s`
  - `persistent://public/default/prices.projection.15s`
  - `persistent://public/default/prices.projection.1m`
  - `persistent://public/default/prices.projection.5m`

Message key is symbol (e.g., `BTCUSDT`) so key-shared consumers can scale while preserving per-symbol ordering.

## Runtime behavior

1. Consume raw tick JSON from `PULSAR_TICKS_TOPIC`.
2. Normalize tick fields (`symbol`, `price`, `timestamp`, `volume`).
3. Update open bars for each configured timeframe.
4. On bucket rollover, publish the closed bar to the matching projection topic.
5. Keep a bounded in-memory bar cache (`PULSAR_MAX_BARS_PER_KEY`) for API reads.

## API resolver behavior

`bars-for-symbol` now:

1. Reads projected bars from cache (default timeframe `:1m`) when available.
2. Falls back to Datomic bars when Pulsar cache is unavailable/empty.

This keeps backward compatibility while enabling a Pulsar-first rollout.

## Known trade-offs

- Out-of-order late ticks are currently dropped for closed buckets (counted in stats).
- Backtests still using Datomic queries are unchanged; replay-driven backtest from Pulsar can be added incrementally.
- In-memory cache is hot data only; restart rebuilds by consuming stream again.
