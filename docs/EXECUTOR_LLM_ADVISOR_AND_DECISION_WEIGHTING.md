# Executor LLM Advisor and Decision Weighting

This document explains how the Trade Advisor should participate in execution without replacing the rules engine.

It complements:

- [LLM Strategy Advisor](./LLM_STRATEGY_ADVISOR.md)
- [UI Copilot and Rules Builder](./UI_COPILOT_AND_RULES.md)

Those docs explain the advisor and UI copilot more generally. This document focuses on executor integration.

## Principle

The LLM is advisory.

The rules engine is primary.

The final decision should be a weighted, policy-aware outcome built from:

- deterministic rules
- technical indicators
- NN predictions
- Trade Advisor recommendations

The LLM should not bypass the policy boundary.

## Current Code Direction

The repo already models this direction in [`../src/com/little_trader/domain/strategy_executor.clj`](../src/com/little_trader/domain/strategy_executor.clj):

- multiple signal sources
- multiple aggregation methods
- configurable confidence thresholds
- weighted aggregation

Current default weighted mix in the executor is:

- `:clara-rules 0.4`
- `:neural-network 0.3`
- `:llm-agent 0.2`
- `:technical-indicators 0.1`

This is a good starting shape because it keeps the deterministic layer strongest by default.

## Two Distinct LLM Roles

### UI copilot

The UI copilot helps users:

- inspect
- explain
- review
- draft
- refine rules

It is suggestion-first and not part of the live decision path.

### Trade Advisor

The Trade Advisor participates in execution as a bounded signal source.

It helps with:

- conflict resolution
- risk refinement
- sizing suggestions
- context enrichment
- explaining why a lower-confidence rule signal might be held or reduced

## Decision Stack

The final decision packet should be built in this order:

1. validate strategy and risk guardrails
2. execute deterministic rules
3. compute technical and model-driven signals
4. consult the Trade Advisor if policy allows
5. aggregate contributions
6. apply confidence and safety thresholds
7. emit a decision packet

## Consultation Modes

The strategy format already models consultation modes such as:

- `:always`
- `:on-conflict`
- `:low-confidence`
- `:verification-only`
- `:never`

Recommended default:

- use `:on-conflict` or `:low-confidence` for serious execution
- reserve `:always` for research mode

## What the Advisor Can Change

The Trade Advisor should be allowed to influence:

- confidence adjustment
- position size recommendation
- stop-loss / take-profit proposal
- hold-versus-enter recommendation under ambiguity
- explanation and audit notes

The Trade Advisor should not be allowed to:

- bypass hard risk limits
- create an action outside the allowed action set
- override missing market price constraints
- force live execution if local data is stale

## Decision Packet

The executor should emit a structured decision packet such as:

```clojure
{:decision/id ...
 :strategy/id ...
 :mode :live
 :market-context/ref ...
 :rules {:decision :enter-long
         :confidence 0.82
         :source :clara-rules}
 :nn {:decision :enter-long
      :confidence 0.71
      :source :neural-network}
 :advisor {:decision :hold
           :confidence 0.64
           :position-size 0.08
           :source :llm-agent}
 :aggregation {:method :weighted
               :weights {:clara-rules 0.4
                         :neural-network 0.3
                         :llm-agent 0.2
                         :technical-indicators 0.1}}
 :final {:decision :enter-long
         :confidence 0.68
         :size 0.08}
 :lineage {...}}
```

This is the right level of structure for:

- audit
- explanation
- replay
- UI inspection

## UI Perspective

From the UI, the user should see:

- whether advisor participation is enabled
- consultation mode
- effective weights
- current confidence threshold
- whether the final action came from consensus, conflict resolution, or guardrail downgrade

The parameter box should expose:

- a toggle for advisor participation
- consultation mode
- aggregation method
- editable signal weights
- strictness/risk posture

The execution terminal should show:

- raw contributing signals
- normalized advisor output
- final weighted decision
- warnings when the advisor was ignored or downgraded

## Weighting Policy

The platform should support three common weighting presets:

### `Conservative`

- rules dominate
- advisor mostly explains or trims
- NN and technical signals support but do not drive

### `Balanced`

- rules still lead
- NN can materially move confidence
- advisor refines ambiguous cases

### `Research`

- advisor and model inputs carry more weight
- good for simulation and optimization
- not the default for live mode

## Fail-Closed Behavior

The advisor must fail closed.

If the advisor response is:

- malformed
- unsafe
- inconsistent
- missing required risk fields

the system should:

- downgrade to `:hold` or the configured fallback
- preserve the warning in the decision packet
- keep the rules output visible for inspection

## Audit and Lineage

Every advisor-assisted decision should capture:

- prompt policy version
- advisor config hash
- consultation mode
- contributing signals
- normalized advisor response
- final aggregated weights
- final action and reason

This is necessary for:

- replay
- regulatory review
- debugging
- model governance

## Recommended Direction

The right posture is:

- rules engine decides the safe action envelope
- models and advisor refine confidence and sizing inside that envelope
- live execution stays deterministic enough to audit
- simulation and research modes can relax weights for exploration
