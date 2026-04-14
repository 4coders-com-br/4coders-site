# Embedded Course and User Manual

This document is the practical entry point for Little Trader. It combines the embedded learning experience, the operational manual, and the guardrails for using the LLM copilot, REPL, rules engine, and market tooling.

## Navigation

- [Course Curriculum](/Users/victorinacio/4coders/little-trader/docs/COURSE_CURRICULUM.md)
- [Architecture Visual Guide](/Users/victorinacio/4coders/little-trader/docs/ARCHITECTURE_VISUAL_GUIDE.md)
- [C4 Architecture](/Users/victorinacio/4coders/little-trader/docs/C4_ARCHITECTURE.md)
- [News and Data Crawlers](/Users/victorinacio/4coders/little-trader/docs/NEWS_AND_DATA_CRAWLERS.md)
- [Developer Ergonomics](/Users/victorinacio/4coders/little-trader/docs/DEVELOPER_ERGONOMICS.md)

## What Lives In The App

Little Trader is not just a dashboard. It is a learning system with four operational surfaces:

- Trading and strategy management
- In-app REPL for live inspection and fast iteration
- LLM copilot for explanations, planning, and review
- Embedded course content for onboarding and systems education

## First Time Flow

1. Open the app and sign in.
2. Start with `Dashboard` to inspect account, trades, and market data.
3. Open `Learn` for the embedded course and `REPL` for direct inspection.
4. Use `AI Assistant` for explanation, patch planning, or review.
5. Move into `Strategy Editor` or `Strategy Discrete` once you understand the data flow.

## Role Model

- `Learner`: reads course content, inspects state, asks questions.
- `User`: manages accounts and trades.
- `Designer`: edits strategies, runs scenario analysis, inspects systems.
- `Admin`: can access REPL evaluation in controlled environments.

## REPL Guardrails

- Use the REPL to inspect state first.
- Treat evaluation as a privileged action.
- Non-production REPL evaluation is disabled unless explicitly enabled.
- Admin role is required for `/api/repl/eval`.
- Prefer small forms and verify output before chaining more evaluation.

## Copilot Guardrails

- The copilot suggests, it does not silently execute.
- Any action-oriented answer should separate proposal, risk, and verification.
- If a request touches strategy logic, ask for or include tests.
- If a request changes exchange behavior, include rollback and environment notes.

## Embedded Course Map

The built-in learning experience is organized around:

- Clojure and ClojureScript basics
- Fulcro RAD concepts
- Trading system architecture
- Neural-network-assisted trading
- LLM strategy advisor patterns
- REPL-first development
- Cloud and local parity
- Developer augmentation with MCP

## Common Tasks

### Inspect runtime state

Use the REPL with read-only snippets first:

- app state
- bars and bricks count
- current trade or open position
- current config

### Build a strategy rule

Use the discrete strategy page to:

- define the rule intent
- specify guardrails and thresholds
- test a scenario
- review the LLM advisory notes

### Ask the copilot for help

Use the copilot for:

- architecture summaries
- code explanations
- migration plans
- bug-hunting checklists
- test plan generation

## Manual Notes

### What the dashboard is for

The dashboard is the live operational layer. It is the place to inspect the current market snapshot, strategy outputs, and exchange status.

### What the learn studio is for

The learn studio is the teaching layer. It is where you explain the system to a new developer, a student, or your future self.

### What the REPL is for

The REPL is the fastest path to understanding the running system. Use it to inspect values, validate assumptions, and test code before changing the product.

### What the copilot is for

The copilot helps with structured thinking. It should be used for plans, reviews, prompts, and operational reasoning, not as a substitute for tests.

## Example Workflows

### New developer onboarding

1. Read this manual.
2. Read the architecture guide.
3. Open the embedded course.
4. Inspect the REPL snippets.
5. Review the strategy editor and discrete rules page.

### Strategy tuning session

1. Inspect market state and open positions.
2. Read the current rule thresholds.
3. Ask the copilot for a review of the current rules.
4. Edit one rule at a time.
5. Validate with the REPL or scenario tooling.

### Debugging a live issue

1. Check health and runtime status.
2. Inspect app state and exchange status.
3. Reproduce the issue in the REPL if possible.
4. Verify the data path from source to UI.
5. Confirm the change with a smoke test.

## Operational Rules

- Do not confuse learning examples with production execution.
- Do not assume a source feed is available unless the UI or config says so.
- Prefer deterministic examples in the course content.
- Call out when something is conceptual rather than wired end-to-end.

## Short Glossary

- `EQL`: query language used by Fulcro and Pathom.
- `MCP`: protocol that lets the assistant interact with tools and REPLs.
- `REPL`: interactive evaluation loop for Clojure.
- `RAD`: Rapid Application Development with attribute-driven forms and reports.
- `Pulsar`: raw tick and projection layer for price streams.
- `Copilot`: suggestion-only LLM workflow in the UI.

