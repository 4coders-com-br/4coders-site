# CLAUDE.md - AI-Assisted Development Guide

**Collaborative Development with Claude AI and Claude Code**


### MUST HAVES ###

- Only read and execute code via clojure-mcp tools
- Any server side must use clj repl to read its own code, navigate using sub-agents to ns pathways, run queries on dbs via the clients not directly
- Any browser interaction must be via cljs repl (tool: clojurescript_eval)
- Use  Claude in Chrome only to screenshot and rare execption not in reach from the cljs repl
- If feature is not accessible via dispatching re-frame events, reading re-frame subscription add an ;; WARNING TODO PENDING REPL REACH comment
- Execute bash commands via clojure-mcp repl sys java
- Every implemented change must add memory if suitable, docs to inform and code and data to ensure and keep consistent and safe from regressions
- Inform when tools outside repl reach are necessary
- Planning and research mode are allowed to go to internet fecth websites, git data, documentaion etc, but must be verbose on the sources used



> **Cloud Staging**: For MCP-enabled cloud development with live REPL access, see [CLOUD_MCP_STAGING.md](./CLOUD_MCP_STAGING.md)

## Table of Contents
1. [Philosophy](#philosophy)
2. [Claude Code Workflow](#claude-code-workflow)
3. [Prompting Strategy](#prompting-strategy)
4. [AI Vibe Coding](#ai-vibe-coding)
5. [Best Practices](#best-practices)
6. [Integration Patterns](#integration-patterns)
7. [Advanced Techniques](#advanced-techniques)
8. [Cloud MCP Integration](#cloud-mcp-integration)

---

## Philosophy

### AI-Augmented Development

This project embraces **human-AI collaboration** as the primary development mode:

- **Claude as Co-Pilot**: AI handles analysis, boilerplate, testing
- **Human as Architect**: You design systems and make strategic decisions
- **Iterative Refinement**: AI produces, human reviews and guides
- **Context Preservation**: Maintain rich context across sessions
- **Prompt as Code**: Well-written prompts are treated like specifications

### Key Principles

1. **Context is King**: Rich context → better AI responses
2. **Clarity First**: Clear prompts beat vague requests
3. **Verification Always**: AI output needs human review
4. **Iterative Polish**: First pass rarely perfect; refine together
5. **Document Intent**: Why matters more than what

---

## Claude Code Workflow

### Phase 1: Session Start

When starting Claude Code:

```markdown
## Session Initialization

I'm working on the Renko Trading System in Clojure/Fulcro/Datomic.

**Project Overview:**
- Full-stack trading system with Renko chart patterns
- Execution modes: backtest, paper trading, production
- Tech stack: Clojure, Fulcro, Datomic, Kafka, Kubernetes

**Current Sprint:**
- Building domain logic for signal detection
- Running comprehensive backtests
- Improving test coverage

**Today's Goal:**
- Implement multi-brick signal detection with edge cases
- Write property-based tests
- Achieve 100% code coverage on signals module

**Context:**
- Relevant files: FEATURES.md, ARCHITECTURE.md
- Recent commits: Renko brick generation complete
- Current tests: 85% coverage in domain module
```

### Phase 2: Exploration

Use Claude Code to explore and understand:

```clojure
# Understanding the Current Renko Implementation

Let me explore the renko module to understand:
1. How brick generation works
2. What edge cases exist
3. How signals are detected
4. Where improvements can be made

# Then:
- Show me the test coverage gaps
- Suggest optimizations
- Identify code duplication
- Find potential bugs
```

### Phase 3: Implementation

Claude Code implements with your guidance:

```
Claude: "I'm going to implement multi-brick signal detection.
Here's my plan:
1. Pattern matching on last 3+ bricks
2. Handle both long and short trends
3. Optional DEMA confirmation
4. Comprehensive tests"

You: "Good, but also consider:
- What if less than 3 bricks exist?
- How does this interact with active trades?
- Should signals be queued or immediate?"

Claude: *Refines implementation based on feedback*
```

### Phase 4: Review & Refinement

You review, Claude improves:

```
You: "The signal detection looks good, but:
- Add more comments explaining the pattern logic
- Handle the edge case where brick list is empty
- Add property-based tests for stability"

Claude: *Makes improvements*
```

### Phase 5: Commit

Automated documentation and commit:

```
Claude: "Ready to commit. Here's the summary:
- Implement multi-brick signal detection
- Handle edge cases (empty, insufficient bricks)
- Add 15 new tests (100% coverage)
- Property-based tests for pattern stability"

You: "Looks good, commit it!"
```

---

## Prompting Strategy

### 1. Context-Rich Prompts

**Bad Prompt**:
```
"Fix the renko code"
```

**Good Prompt**:
```
"In the renko.clj module, the brick generation algorithm needs optimization.

Current approach:
- Iterates through price diffs calculating gap count
- Generates bricks one at a time in a loop
- Problem: Slow with 10k+ bars (5+ seconds)

Requirements:
- Should process 10k bars in <1 second
- Must maintain exact same brick sequence
- No change to brick type classification

Context:
- Used in both backtest (batch) and paper trading (real-time)
- Backtest dataset: 2 years of 1h BTC/USD
- Paper trading: process ~1-2 bars/second

What vectorization or optimization techniques would help?"
```

### 2. Task-Based Prompts

```markdown
## Task: Implement Trading Signal Detection

### Objective
Implement a signal detection system that:
- Analyzes brick patterns
- Detects one-brick, double-brick, multi-brick signals
- Supports DEMA confirmation filters
- Returns signals with confidence levels

### Requirements
- Must be purely functional (no side effects)
- Should achieve 100% test coverage
- Handle edge cases (insufficient bricks, nil values)
- Property-based tests for pattern invariants

### Context
- Pattern window: last 3 bricks
- Directions: +1 (up) or -1 (down)
- One-brick: direction reversal ([-1, +1] or [+1, -1])
- Double-brick: trend continuation then reversal ([+1, +1, -1])
- Multi-brick: 3+ same direction ([+1, +1, +1])

### Deliverables
1. `signals.clj` - Core implementation
2. `signals_test.clj` - Test suite (100% coverage)
3. Documentation with examples

### Acceptance Criteria
- [ ] All 3 signal types detected correctly
- [ ] DEMA filter works as optional feature
- [ ] Edge cases handled properly
- [ ] Tests pass 100+ iterations for property tests
- [ ] Execution time <1ms per signal check
```

### 3. Exploratory Prompts

```markdown
## Exploration: What's the Optimal Brick Size for BTC/USD?

I need to understand how brick size affects trading performance.

### Questions to Answer
1. What brick sizes perform best historically?
2. How do different sizes affect:
   - Signal frequency
   - Win rate
   - Average trade duration
   - Drawdown profiles
3. Is there a correlation with volatility?

### Data Available
- 2 years of BTC/USD 1h candles
- Trade history with metrics
- Market volatility data

### Approach
1. Analyze historical performance across brick sizes [50, 100, 200, 500]
2. Correlate with market volatility
3. Identify patterns and recommendations
4. Suggest optimal ranges for different market conditions

Let's start by querying the backtest results...
```

### 4. Debugging Prompts

```markdown
## Bug Investigation: Signal Detection Issue

### Symptom
- One-brick signals sometimes fire twice in a row
- Expected: Single signal per pattern
- Actual: Two signals on same pattern

### Context
```clojure
;; Simplified code
(defn detect-signal [brick-list]
  (let [directions (map :direction (take-last 2 brick-list))]
    (when (= directions [1 -1])
      {:action "one_brick_start_long"})))

;; Call sequence:
;; Brick 1 (up), Brick 2 (down) → Signal 1 ✓
;; Brick 3 (up)... → Signal 2 ✗ (should not fire again)
```

### Questions
1. Is state being maintained correctly?
2. Are we comparing against previous signals?
3. Is the brick pattern changing as expected?

Debug step by step with test cases...
```

---

## AI Vibe Coding

### What is "Vibe Coding"?

**Vibe coding** is developing in harmony with AI, where:
- AI understands your intent from context
- You guide with natural language ("make it faster", "handle this edge case")
- The code evolves through conversation
- Quality improves through iterative refinement

### Vibe Coding in Practice

#### Example 1: Exploratory Development

```
You: "I want to add DEMA confirmation to signals. How should it work?"

Claude: "DEMA (Double Exponential Moving Average) is sensitive to price changes.
For signal confirmation:
1. Calculate DEMA on brick closes
2. For LONG signals: require current price > DEMA
3. For SHORT signals: require current price < DEMA

This filters out false signals in choppy markets."

You: "That makes sense. Let me see it in code."

Claude: *Shows implementation*

You: "Good. Now make it configurable - DEMA should be optional."

Claude: *Refactors with toggle flag*

You: "Perfect. Add tests and let's commit."

Claude: *Adds tests, creates commit*
```

#### Example 2: Optimizing Performance

```
You: "This backtest is slow - takes 30 seconds for 1000 trades. Let's speed it up."

Claude: "I'll profile it first to find bottlenecks."

*Runs profiler, identifies brick generation as hot spot*

Claude: "Brick generation is 70% of runtime. Suggestions:
1. Vectorize gap calculations
2. Use transducers for pipeline
3. Memoize brick type classification
4. Lazy sequence instead of eagerness"

You: "Start with vectorization. Add benchmarks."

Claude: *Implements vectorized version, adds benchmarks*

Result: 5 seconds (6x faster)

You: "Excellent! Let's commit and document the optimization."
```

#### Example 3: Debugging in Vibe Mode

```
You: "These tests are flaky - sometimes pass, sometimes fail."

Claude: "Let me run them multiple times... I see it now.
The issue is random ordering affecting state.
Let's trace through with specific seed."

*Uses deterministic test data*

Claude: "Found it! The issue is here in the trade closure logic."

You: "Right, and also check concurrent access patterns."

Claude: *Adds locks, tests again*

You: "Clean. Any other race conditions lurking?"

Claude: "Let me check the async code..." *Finds 2 more*

You: "Fix those and we're good."

Claude: *Fixes and commits*
```

### Vibe Coding Principles

1. **Think in Layers**: Business logic → implementation → testing
2. **Name Clearly**: Good names reduce need for explanation
3. **Comments Explain Why**: Not what - code shows what
4. **Test-First Mindset**: Tests guide implementation
5. **Refactor Boldly**: AI makes refactoring safe
6. **Document Decisions**: Record why you chose this approach

---

## Best Practices

### 1. Maintain Rich Context

```markdown
## Session Context Document

### What I'm Building
[Clear description of current feature/task]

### Technical Stack & Constraints
[Relevant tech decisions and limits]

### Recent Progress
[What's been done, what's next]

### Open Questions
[Things we're still figuring out]

### Decisions Made
[Important choices and rationale]

### Testing Strategy
[How we validate changes]
```

Keep this updated and share with Claude at session start.

### 2. Write Tests First (Even with AI)

```clojure
;; Good: Test defines expected behavior
(deftest detect-double-brick-long
  (let [bricks [{:direction 1} {:direction 1} {:direction -1}]
        signal (signals/detect-double-brick bricks)]
    (is (= "double_brick_start_long" (:action signal)))
    (is (= :long (:side signal)))))

;; Then Claude implements to pass the test
```

### 3. Use Descriptive Variable Names

```clojure
;; Less clear
(let [x (calc-pnl p1 p2 a s)
      y (/ x (* a pr))]
  ...)

;; More clear (AI understands intent)
(let [pnl-dollars (calculate-profit entry-price exit-price amount side)
      pnl-percent (/ pnl-dollars (* amount entry-price))]
  ...)
```

### 4. Separate Pure and Impure Code

```clojure
;; Pure: AI can test thoroughly
(defn calculate-signal [brick-list config]
  (detect-pattern brick-list config))

;; Impure: AI handles carefully
(defn execute-signal [signal state broker db]
  (transact-to-db db (update-state state signal))
  (submit-order-to-broker broker signal))
```

### 5. Document Integration Points

```clojure
;; Mark external dependencies clearly
(def ^:external-api bitfinex-client (create-client))

;; Mark side effects
(defn ^:side-effect log-trade [trade]
  (timbre/info "Trade" trade))

;; This helps Claude reason about what can be tested
```

---

## Integration Patterns

### Pattern 1: Test-Driven Vibe Coding

```
1. You write failing test
2. Claude implements to pass
3. You add edge case tests
4. Claude refactors for clarity
5. Repeat until comprehensive
```

### Pattern 2: Exploration → Implementation

```
1. Claude explores existing code
2. You ask "what if?" questions
3. Claude analyzes impact
4. You decide on approach
5. Claude implements changes
6. You review and refine
```

### Pattern 3: Pair Programming

```
You: "I think there's a bug in risk calculation"

Claude: "Let me trace through with test data..."

*Finds the issue*

Claude: "Here's the problem: [explanation]"

You: "Fix it and add regression test"

Claude: *Fixes and adds test*

You: "Perfect, commit it"
```

### Pattern 4: Code Review

```
Claude: "Here's my implementation of parameter optimization"

You: Review the code...
- Good points: [list]
- Issues: [list]
- Suggestions: [list]

Claude: "Making revisions based on feedback"

*Implements improvements*

You: "Approved! Commit."
```

---

## Advanced Techniques

### 1. Prompt Chaining

```markdown
# Step 1: Understand
"Explain the current brick generation algorithm"

Claude: [Explanation]

# Step 2: Identify Issues
"What are the performance bottlenecks?"

Claude: [Analysis]

# Step 3: Design Solution
"How would you optimize this?"

Claude: [Design]

# Step 4: Implement
"Implement that optimization"

Claude: [Code]

# Step 5: Validate
"Prove it's correct with benchmarks"

Claude: [Benchmarks]
```

### 2. Context Windows

Use long context to:
- Share entire modules
- Discuss architecture decisions
- Review design patterns
- Maintain continuity across sessions

```markdown
## Context Window: Full Signal Detection System

Here's the complete current implementation:

### Current Code (signals.clj)
[Full file contents]

### Tests (signals_test.clj)
[Full test file]

### Architecture Decision
[Why signals work this way]

### Known Issues
[What we're working on]

Given this context, how can we improve...?
```

### 3. Iterative Refinement

```
1. Claude produces "good" solution
2. You suggest 2-3 improvements
3. Claude refines based on feedback
4. You review refined version
5. Repeat until "excellent"

Result: Production-grade code through iteration
```

### 4. Cross-Module Consistency

```
You: "Make sure signals use same patterns as risk management"

Claude:
1. Analyzes both modules
2. Identifies inconsistencies
3. Proposes unified approach
4. Implements changes
5. Runs tests across modules

Result: Consistent architecture
```

---

## Workflow Examples

### Example 1: Feature Implementation

```markdown
## Implement: Trailing Stop Enhancement

### Context
Current trailing stop works but:
- Only one profit range supported
- Can't adjust ranges dynamically
- No visualization of trail levels

### Goal
Multi-level trailing stops:
1. At 1% profit → 0.5% trail
2. At 2% profit → 1.0% trail
3. At 3% profit → 1.5% trail
Dynamically configurable from UI

### Steps
1. Claude: Show current implementation
2. You: Define new data structure
3. Claude: Implement multi-level logic
4. You: Add tests for edge cases
5. Claude: Optimize and document
6. You: Review and commit
```

### Example 2: Performance Investigation

```markdown
## Investigation: Why Backtests Are Slow

### Symptoms
- 1000 trades takes 30 seconds
- Backtest mode should be faster
- Production mode is acceptable

### Available Tools
- Profiler showing hot spots
- Benchmark utilities
- Historical performance baseline

### Investigation Process
1. Profile current run
2. Identify top 3 bottlenecks
3. Design optimizations for each
4. Implement with minimal changes
5. Benchmark improvements
6. Document findings
```

### Example 3: Bug Investigation

```markdown
## Debug: Signals Fire on Incomplete Bricks

### Symptoms
- Signals sometimes fire prematurely
- Pattern detection seems off
- Only happens in live data

### Hypothesis
Live data has partial/incomplete bars
Our algorithm assumes complete OHLCV

### Investigation
1. Add logging to see exact bricks being analyzed
2. Compare backtest vs. live brick sequences
3. Test with incomplete data
4. Fix edge case handling

### Fix Approach
- Only generate signals from "final" bars
- Mark bars as partial/final
- Tests with both states
```

---

## Common Vibe Coding Patterns

### Pattern: "Make it X"

```
You: "Make signal detection faster"
Claude: [Optimizes]

You: "Make the code clearer"
Claude: [Refactors]

You: "Make tests more comprehensive"
Claude: [Adds edge cases]

You: "Make it production-ready"
Claude: [Hardens, adds monitoring]
```

### Pattern: "What if..."

```
You: "What if brick size was negative?"
Claude: [Analyzes and handles]

You: "What if we have 100k trades?"
Claude: [Tests scalability]

You: "What if Kafka is unavailable?"
Claude: [Adds fallback]
```

### Pattern: "Compare and Contrast"

```
You: "Compare renko vs moving average signals"
Claude: [Detailed analysis]

You: "Contrast backtest with paper trading"
Claude: [Differences and implications]

You: "Show the similarities and differences between these approaches"
Claude: [Comprehensive comparison]
```

---

## Tools & Setup for Vibe Coding

### VS Code + Claude Code Setup

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "clje.cljfmt-static",
  "files.autoSave": "afterDelay",
  "[clojure]": {
    "editor.defaultFormatter": "clje.cljfmt-static",
    "editor.formatOnSave": true
  },
  "extensions": [
    "Anthropic.claude-code",
    "clje.clover",
    "betterthantomorrow.calva"
  ]
}
```

### Development Loop

```bash
# Terminal 1: REPL for interactive development
lein repl

# Terminal 2: Tests running on file change
lein test-refresh

# Terminal 3: Build monitoring
lein cljsbuild auto dev

# Terminal 4: Application server
lein run

# Then Claude Code does its thing...
```

### Commit Convention for AI Collaboration

```
# Format: [AI_ASSISTED] Type: Brief description

[AI_ASSISTED] feat: Implement multi-brick signal detection
[AI_ASSISTED] test: Add property-based tests for renko generation
[AI_ASSISTED] refactor: Optimize brick generation performance
[AI_ASSISTED] docs: Document signal detection algorithm

# These commits show:
- AI was used in the development process
- Changes are reviewed and approved by human
- Clear traceability of AI contributions
```

---

## Vibe Coding Checklist

Before starting a session:

- [ ] Context document updated
- [ ] Recent commits reviewed
- [ ] Test suite passing
- [ ] No uncommitted changes
- [ ] Clear goal for session
- [ ] Relevant docs at hand
- [ ] Enough context for Claude

After completing a feature:

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Comments explain intent
- [ ] Edge cases handled
- [ ] Committed with good message
- [ ] Tests are comprehensive
- [ ] Performance acceptable

---

## Summary

**Vibe coding with Claude means:**
- ✅ Natural language guides implementation
- ✅ AI handles analysis and boilerplate
- ✅ Human steers architecture
- ✅ Iterative refinement improves quality
- ✅ Tests ensure correctness
- ✅ Code remains maintainable
- ✅ Development is faster AND more thorough

The key: **Treat prompts like specs, treat code like conversations.**

---

## Cloud MCP Integration

### Overview

The project supports **cloud staging development** where Claude Code or Claude Desktop connects directly to a running nREPL in Kubernetes, enabling:

- Real-time code evaluation in cloud environment
- Access to actual Datomic database and Kafka streams
- Hot reload without container rebuilds
- AI-assisted development against production-like infrastructure

### Quick Setup

**Claude Desktop** (full MCP features):
```bash
# 1. Add clojure-mcp to ~/.clojure/deps.edn
# 2. Configure Claude Desktop with cloud connection
# 3. See CLOUD_MCP_STAGING.md for details
```

**Claude Code CLI** (hook-based):
```bash
# 1. Install clojure-mcp-light
bbin install https://github.com/bhauman/clojure-mcp-light.git --tag v0.2.0

# 2. Configure hooks in ~/.claude/settings.json
# 3. Connect to staging
kubectl -n staging port-forward svc/nrepl 7888:7888 &

# 4. Start Claude Code
claude
```

### Cloud Vibe Coding Session

```
Developer: "Let me test the signal detection in staging"

Claude Code:
1. Connect to staging nREPL (via port-forward)
2. Evaluate code against real data
3. Analyze actual trading patterns
4. Suggest improvements based on real behavior
5. Hot-reload changes without restart

Developer: "Optimize based on the real data patterns"

Claude Code:
1. Profile against actual staging load
2. Identify bottlenecks with real workload
3. Implement optimizations
4. Validate against staging metrics
```

### Benefits

| Local Development | Cloud Staging MCP |
|------------------|-------------------|
| Mock data | Real Datomic data |
| Simulated Kafka | Real event streams |
| Local REPL | Cloud nREPL |
| Isolated testing | Integration testing |
| Fast iteration | Production validation |

### Documentation

For complete setup and architecture details:
- **[CLOUD_MCP_STAGING.md](./CLOUD_MCP_STAGING.md)** - Full architecture guide
- **[MCP_DEVELOPMENT.md](./MCP_DEVELOPMENT.md)** - MCP patterns and tools
- **[DEVOPS.md](./DEVOPS.md)** - Infrastructure details
