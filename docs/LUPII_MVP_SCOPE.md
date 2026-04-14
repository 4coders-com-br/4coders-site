# Lupii MVP Scope

## Included (P0)

- Fulcro RAD UI + Pathom EQL backend
- Datomic persistence
- Deribit integration (configurable per environment)
- Pulsar raw tick + projection pipeline
- Authenticated app with role-aware access
- CI checks: tests + API smoke (`/health`, auth, `/api/eql`, UI root)

## Deferred (Post-MVP)

- Production-grade crawler/news ingestion
- Multi-exchange orchestration beyond Deribit
- Legacy namespace consolidation and archival

## Notes

- `DERIBIT_ENABLED` should be explicit per environment in deployment workflow.
- `/api/repl/eval` is non-production only and admin-gated.
