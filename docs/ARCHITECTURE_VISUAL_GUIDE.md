# Architecture Visual Guide

This guide explains Little Trader through visual slices rather than a single abstract diagram. The goal is to make the runtime, the learning surfaces, and the developer augmentation story easy to explain to a new contributor.

## Navigation

- [Developer Onboarding Playbook](./DEVELOPER_ONBOARDING_PLAYBOOK.md)
- [Embedded Course and Manual](./EMBEDDED_COURSE_AND_MANUAL.md)
- [Course Curriculum](./COURSE_CURRICULUM.md)
- [C4 Architecture](./C4_ARCHITECTURE.md)
- [News and Data Crawlers](./NEWS_AND_DATA_CRAWLERS.md)

## System Shape

Little Trader has three coordinated loops:

- The trading loop: data in, signals out, execution and reporting
- The learning loop: embedded course, REPL, and copilot
- The delivery loop: local parity, CI, and Cloud Run deployment

```mermaid
flowchart LR
    Market["Market Sources"] --> Feeds["Feeds + Normalization"]
    Feeds --> Data["Datomic + Projection Cache"]
    Data --> UI["Dashboard + Strategy UI"]
    UI --> Actions["Signals, Rules, Trades"]
    Actions --> Market

    Learner["Learner / Developer"] --> Course["Embedded Course"]
    Learner --> Repl["First-Class REPL"]
    Learner --> Copilot["LLM Copilot"]
    Course --> Repl
    Repl --> Copilot
    Copilot --> UI

    Dev["Local Dev"] --> CI["CI / Smoke / Tests"]
    Dev --> Cloud["Cloud Run"]
    CI --> Cloud
```

## Runtime Layers

### 1. Presentation

- Trading dashboard
- Strategy editor
- Discrete rules page
- Learn studio
- Chat and REPL helpers

### 2. Application

- Pathom resolvers
- Auth and session handling
- Rule evaluation
- LLM advisor flows

### 3. Data

- Datomic as the source of truth
- Pulsar as the stream and projection layer
- Exchange snapshots and crawler normalization

### 4. Augmentation

- MCP dual REPL access
- In-app copilot prompts
- Embedded course content
- CI smoke and parity checks

## Feature Map

```mermaid
mindmap
  root((Little Trader))
    Trading
      Dashboard
      Trades
      Strategies
      Exchange Integrations
    Learning
      Embedded Course
      Manual
      REPL
      Copilot
    Operations
      CI/CD
      Cloud Run
      Local Parity
      Smoke Tests
    Intelligence
      LLM Advisor
      News Curation
      Data Crawlers
      Rules Engine
```

## Copilot Loop

```mermaid
sequenceDiagram
    participant User as User
    participant UI as UI Copilot
    participant API as App API
    participant LLM as LLM Provider
    participant REPL as Clojure REPL

    User->>UI: Ask for explanation or patch plan
    UI->>API: Send prompt + history + guardrails
    API->>LLM: Request structured response
    LLM-->>API: Suggestion / analysis
    API-->>UI: Return answer with safety context
    User->>REPL: Inspect or validate a claim
    REPL-->>User: Runtime values and concrete behavior
```

## Deployment Parity

```mermaid
flowchart TB
    Local["Local Dev"] --> Smoke["Smoke Tests"]
    Local --> REPL["nREPL + Browser REPL"]
    Local --> Docker["Docker Compose"]
    Docker --> Parity["Parity With Cloud"]
    Smoke --> CI["CI Pipeline"]
    CI --> CloudRun["Cloud Run Deployment"]
    CloudRun --> Runtime["Staging or Production Runtime"]
```

## How To Read The Architecture

- If you want to understand user-facing behavior, start with the dashboard and copilot loop.
- If you want to understand data correctness, start with the feeds and Datomic layer.
- If you want to understand how to change the system safely, start with the REPL, smoke tests, and deployment parity.

## Operational Guardrails

- Conceptual diagrams do not imply production wiring unless the code path exists.
- If a feature is described here but not in code, mark it as planned or optional.
- Prefer one diagram per concern instead of one large diagram with everything in it.
- Keep the local and cloud paths as similar as possible before adding new runtime behavior.

