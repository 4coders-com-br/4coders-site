# Exchanges And Feeds

This guide defines the intended responsibilities for the exchange and feed layer in `little-trader`.

## Scope

- `Deribit` is the primary crypto-derivatives integration for public market data, options, and testnet/prod trading workflows.
- `MetaTrader 5` is the external bridge for FX/CFD workflows and broker-specific execution.
- `Pulsar` is the feed backbone for raw ticks and derived bars.
- `News` and crawler inputs should be treated as advisory context, not trading truth.

## Deribit

Deribit is the preferred first-class exchange for this repo because it already aligns with the strategy and options code paths.

### What It Should Do

- Public market data: instruments, ticker, order book, historical bars, mark price, volatility, funding data.
- Private trading operations: account summary, positions, order placement, cancellation, and close actions.
- Options workflows: chain inspection, implied vol, and data feeding for convex or options strategies.

### Guardrails

- Default to testnet in local and staging environments.
- Require explicit credentials for private endpoints.
- Reject empty currency, instrument, depth, or timestamp inputs early.
- Fail closed on malformed private-key material and return structured errors instead of raw exceptions.
- Use normalized error payloads so the UI can render actionable messages.

### Recommended Config

- `DERIBIT_ENABLED=true|false`
- `DERIBIT_TESTNET=true|false`
- `DERIBIT_CLIENT_ID`
- `DERIBIT_PRIVATE_KEY`

## MetaTrader 5

MT5 should be treated as a bridge-backed execution channel, not a native in-process dependency.

### What It Should Do

- Connect to the Python bridge and validate bridge health.
- Fetch symbol metadata, bars, ticks, positions, and account snapshots.
- Place, modify, and close orders with explicit validation.

### Guardrails

- Require a valid bridge URL before attempting connection.
- Reject missing init credentials up front.
- Validate tickets and volumes before sending order mutations.
- Default unknown timeframes to the configured fallback rather than inventing bridge-specific behavior.
- Keep secrets and broker credentials outside the Clojure process whenever possible.

### Recommended Config

- `*mt5-base-url*` for the connector instance.
- Bridge-side broker credentials and terminal path handled by the Python service.

## Feeds

The intended feed flow is:

1. Exchange data enters through a connector.
2. Raw ticks are published to Pulsar.
3. Projection services derive timeframe bars.
4. The UI reads projected bars first, then falls back to persisted bars.

### Guardrails

- Keep the raw tick topic append-only.
- Prefer derived projections over ad-hoc UI calculations.
- Treat news/crawler inputs as context for LLMs and human review, not as trade execution triggers.

## Error Model

The connector layer should expose structured failures with:

- `:success false`
- `:error` as a short human-readable summary
- `:error-code` or `:status` when available
- `:details` for machine-readable context

That gives the UI and orchestration layers enough information to retry, display, or suppress failures consistently.

## Operational Notes

- Staging should default to Deribit testnet and non-production bridge endpoints.
- Production should require explicit opt-in for any private trading path.
- Use smoke tests for health, auth, and EQL before trusting a deployment.
