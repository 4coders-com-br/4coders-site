# TODO_LEARN.md

> Backlog and execution notes for the Learn layer, curriculum embedding, and future app integration.
> Last updated: 2026-04-05

## Legend
- [x] Done
- [~] In progress / partially defined
- [ ] Next / future

---

## 1. Done in the current PR

- [x] Introduced `/learn` as the cognitive layer of the repo
- [x] Added `learn/README.md`
- [x] Added `learn/embedded-manual.md`
- [x] Added `learn/course-curriculum.md`
- [x] Added `learn/repl-first.md`
- [x] Added `learn/little-trader-learning-path.md`
- [x] Added `learn/little-trader-expanded-curriculum.md`
- [x] Added `learn/curriculum-index.md`
- [x] Added lesson markdown files for:
  - `learn/01-clojure-and-repl-foundations.md`
  - `learn/02-finance-foundations.md`
  - `learn/03-trading-foundations.md`
  - `learn/04-options-and-derivatives.md`
  - `learn/05-crypto-and-multi-asset.md`
  - `learn/06-repl-mastery.md`
  - `learn/07-llm-and-ai-collaboration.md`
  - `learn/08-machine-learning.md`
  - `learn/09-neural-networks.md`
  - `learn/10-strategy-and-hedge-fund-thinking.md`
- [x] Added `learn/EMBEDDING_INDEX.md`
- [x] Added `docs/LEARN_TAB_PRODUCT_SPEC.md`
- [x] Added `docs/AI_MENTOR_LEARN_TAB_AND_MEL_WIZARDS.md`
- [x] Added `docs/LITTLE_FAMILY_PLATFORM_VISION_AND_LEARN_CROSS_CONCERNS.md`
- [x] Added future vision docs:
  - `docs/LITTLE_BUSINESS_PRODUCT_VISION.md`
  - `docs/LITTLE_STORE_PRODUCT_VISION.md`
  - `docs/LITTLE_SYS_PLATFORM_ARCHITECTURE.md`

---

## 2. Future content to add

### Core Learn Expansion
- [ ] Add onboarding / welcome lesson for complete beginners
- [ ] Add glossary of trading, finance, REPL, AI, and ML terms
- [ ] Add cross-links between lessons and product surfaces
- [ ] Add a "where to see this in the app" section to each lesson
- [ ] Add journaling prompts for each advanced lesson

### Little Trader Curriculum Expansion
- [ ] Add more Clojure fundamentals lessons
- [ ] Add more REPL debugging examples from the real app
- [ ] Add basic statistics / probability lessons for traders
- [ ] Add market structure and order-flow fundamentals
- [ ] Add options payoff scenario drills
- [ ] Add portfolio construction and hedging lessons
- [ ] Add backtesting discipline lessons
- [ ] Add failure-mode lessons for AI/LLM/ML misuse

### Mel / Teaching Expansion
- [ ] Add teacher-mode scripts per lesson
- [ ] Add wizard prompts for strategy definition
- [ ] Add troubleshooting lesson scripts
- [ ] Add companion / philosophical prompts for ambition and discipline
- [ ] Add UI-target references per lesson for highlighting

### Little Family Shared Learn Expansion
- [ ] Add shared curriculum for Little Business
- [ ] Add shared curriculum for Little Store
- [ ] Add shared curriculum for Little Sys
- [ ] Add family-wide system-thinking track
- [ ] Add family-wide rules/governance track

---

## 3. Embedding index instructions

The app should later treat `learn/EMBEDDING_INDEX.md` as the authoritative markdown registry seed.

### Current purpose
- stable human-readable content index
- easy reference for future Learn tab integration
- bridge between docs-first content and app-native lesson rendering

### Future embedding instructions
- [ ] Parse or mirror `learn/EMBEDDING_INDEX.md` into an app-readable registry
- [ ] Each entry should map to:
  - lesson id
  - title
  - markdown path
  - track
  - level
  - optional tags
- [ ] Use this index to generate sidebar navigation in the Learn tab
- [ ] Use this index to preload or lazy-load lesson markdown
- [ ] Use this index to attach snippet metadata and Mel teaching metadata later

### Suggested future registry shape
```edn
[{:id :learn/welcome
  :title "Welcome to Learn"
  :path "learn/README.md"
  :track :core
  :level :beginner}
 {:id :learn/repl-foundations
  :title "Clojure and REPL Foundations"
  :path "learn/01-clojure-and-repl-foundations.md"
  :track :programming
  :level :beginner}]
```

### Future runtime usage
- [ ] Learn sidebar navigation
- [ ] lesson page routing
- [ ] progress tracking
- [ ] snippet card registration
- [ ] contextual Mel prompts
- [ ] UI highlight target mapping

---

## 4. Next implementation steps

- [ ] Build Learn tab shell in app UI
- [ ] Build markdown lesson renderer
- [ ] Build lesson registry from embedding index
- [ ] Build interactive snippet cards
- [ ] Build Learn → REPL bridge
- [ ] Build Learn → Mel bridge
- [ ] Build Mel teacher mode
- [ ] Build highlight / point / flash overlay primitives
- [ ] Decide final Learn runtime integration pattern in current mixed frontend architecture

---

## 5. Guiding principle

> Learn content should remain markdown-first,
> but app-ready.
>
> The docs should be readable by humans now,
> and embeddable by the product later.

---

## 6. Testing & Quality

> Cross-reference: `docs/TESTING_STRATEGY.md` for the full test pyramid.

### Tests for Learn Infrastructure
- [x] Browser tests: Learn route renders, sidebar, nav, code blocks (`browser/learn_test.clj`)
- [ ] API tests: docs serving, REPL eval, chat endpoints (`server/learn_api_test.clj`)
- [ ] UI tests: Learn Studio tabs, lesson navigation, REPL integration
- [ ] Embedding index validation: all referenced `.md` files exist on disk
- [ ] Snippet execution: Learn → REPL bridge returns correct results

### Monitoring & Operations
- [ ] Learn API health check in `/health` composite
- [ ] REPL eval latency tracking in `/metrics`
- [ ] Chat endpoint error rate monitoring
- [ ] Reference: `docs/SRE_OPERATIONS.md` for operational runbooks

### Troubleshooting (cross-ref Mel Wizard 2)
- [ ] Stale lesson content: verify docs API serves latest file
- [ ] REPL eval failure: check `*eval-enabled*` flag + admin guard
- [ ] Chat not responding: check LLM connector + API key config
- [ ] Learn tab blank: check route registration in `client.cljs`
- [ ] Reference: Mel Troubleshooter mode in `docs/AI_MENTOR_LEARN_TAB_AND_MEL_WIZARDS.md`
