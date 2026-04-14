# Renko Trading System - Architecture (Clojure/Fulcro/RAD/Datomic)

**Implementation-Specific Design for Clojure Ecosystem**

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [Architecture Overview](#architecture-overview)
3. [Module Structure](#module-structure)
4. [Data Modeling with Datomic](#data-modeling-with-datomic)
5. [Frontend Architecture with Fulcro](#frontend-architecture-with-fulcro)
6. [Backend Services](#backend-services)
7. [Data Flows](#data-flows)
8. [Concurrency Model](#concurrency-model)
9. [Deployment Architecture](#deployment-architecture)
10. [Features & Development Lifecycle](#features--development-lifecycle)
11. [Prompt Engineering for AI Collaboration](#prompt-engineering-for-ai-collaboration)
12. [AI Vibe Coding Integration](#ai-vibe-coding-integration)

---

## Technology Stack

### Core Frameworks
- **Clojure**: Main language (JVM-based, immutable-first)
- **Fulcro**: Full-stack web framework (ClojureScript frontend + server)
- **Fulcro RAD**: Rapid Application Development (data-driven)
- **Datomic**: Immutable database with time-travel queries
- **Pathom**: Graph query engine (normalizes data automatically)

### Supporting Libraries
- **core.async**: Channel-based concurrency
- **spec**: Data validation and specs
- **clj-kafka**: Kafka producer/consumer
- **mount**: Component lifecycle management
- **juxt/crux**: Optional alternative temporal database
- **meander**: Pattern matching for signal detection
- **incanter** / **oz**: Charting and visualization

### Infrastructure
- **Docker/Docker Compose**: Containerization
- **Kubernetes**: Orchestration (optional)
- **GitHub Actions**: CI/CD
- **PostgreSQL**: Optional persistence layer
- **Redis**: Caching and state synchronization
- **Kafka**: Event streaming

---

## Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────────────────────┐
│          Frontend Layer (Fulcro/SPA)                │
│  - Interactive Dashboard                            │
│  - Live Charts                                       │
│  - Trade Monitoring                                 │
│  - Backtest Results                                 │
└────────────────┬──────────────────────────────────┘
                 │ (EQL queries/mutations)
                 │
┌────────────────▼──────────────────────────────────┐
│      API Gateway / Server (Fulcro Servers)         │
│  - EQL parser                                       │
│  - Resolver functions                              │
│  - Authentication/Authorization                    │
└────────────────┬──────────────────────────────────┘
                 │
    ┌────────────┼────────────┬─────────────┐
    │            │            │             │
┌───▼──┐  ┌──────▼──┐  ┌──────▼───┐  ┌─────▼────┐
│      │  │         │  │          │  │          │
│Domain│  │Strategy │  │Execution │  │Risk      │
│Logic │  │Engine   │  │Service   │  │Manager   │
│      │  │         │  │          │  │          │
└──┬───┘  └────┬────┘  └─────┬────┘  └────┬─────┘
   │           │             │            │
   └───────────┼─────────────┼────────────┘
               │
      ┌────────▼──────────┐
      │  Event Streaming  │  (Kafka)
      │  (Signals, Trades)│
      └────────┬──────────┘
               │
      ┌────────▼──────────────┐
      │ Datomic/Database      │
      │ - Immutable History   │
      │ - Time-Travel Queries │
      │ - Event Sourcing      │
      └───────────────────────┘
```

### Core Design Patterns

#### 1. Event Sourcing
- All state changes are immutable events
- Events stored in Datomic (append-only)
- Current state derived from events

**Event Types**:
```clojure
{:event/type :brick-generated
 :brick/id uuid
 :brick/mts timestamp
 :brick/close price
 :brick/direction direction}

{:event/type :signal-detected
 :signal/id uuid
 :signal/action "one_brick_start_long"
 :signal/price price}

{:event/type :trade-opened
 :trade/id uuid
 :trade/entry-price price
 :trade/side :long}

{:event/type :trade-closed
 :trade/id uuid
 :trade/exit-price price
 :trade/pnl pnl}
```

#### 2. CQRS (Command Query Responsibility Segregation)
- **Commands**: Actions that change state (open trade, close trade)
- **Queries**: Read operations (get trade history, signal stats)
- Separate read models from write models

#### 3. State Machine for Trade Lifecycle
```
no_position ──[entry_signal]──> long_position ──[exit_signal]──> no_position
                                      │                              ▲
                                      └──[trailing_activated]────┐   │
                                                                  │   │
                          ┌──────────────────────────────────────┘   │
                          │                                           │
                    trailing_stop ──[take_profit_signal]────────────┘
```

---

## Module Structure

### Project Layout
```
renko-trader/
├── src/
│   ├── com/little_trader/
│   │   ├── server/
│   │   │   ├── core.clj              # Server entry point, mount setup
│   │   │   ├── resolvers.clj         # EQL resolvers for Datomic queries
│   │   │   ├── mutations.clj         # EQL mutations (state changes)
│   │   │   ├── middleware.clj        # Auth, logging, error handling
│   │   │   └── config.clj            # Environment configuration
│   │   │
│   │   ├── domain/
│   │   │   ├── broker.clj            # Broker abstraction
│   │   │   ├── renko.clj             # Renko brick generation
│   │   │   ├── signals.clj           # Signal detection logic
│   │   │   ├── trade.clj             # Trade lifecycle
│   │   │   └── risk.clj              # Risk management rules
│   │   │
│   │   ├── strategy/
│   │   │   ├── executor.clj          # Main strategy loop
│   │   │   ├── state.clj             # Strategy state management
│   │   │   ├── modes.clj             # Backtest, paper, production
│   │   │   └── validator.clj         # Config validation
│   │   │
│   │   ├── data/
│   │   │   ├── db.clj                # Datomic schema & connection
│   │   │   ├── queries.clj           # Datomic queries
│   │   │   ├── transact.clj          # Database transactions
│   │   │   ├── schema.clj            # Schema definitions
│   │   │   └── migration.clj         # Schema migrations
│   │   │
│   │   ├── streams/
│   │   │   ├── kafka.clj             # Kafka producer/consumer
│   │   │   ├── ohlcv_feed.clj        # OHLCV data subscription
│   │   │   ├── events.clj            # Event processing
│   │   │   └── backtest.clj          # Backtest data loading
│   │   │
│   │   ├── ui/
│   │   │   ├── dashboard.cljs        # Main dashboard component
│   │   │   ├── charts.cljs           # Charting components
│   │   │   ├── trades.cljs           # Trade list/details
│   │   │   ├── signals.cljs          # Signal history
│   │   │   ├── backtest.cljs         # Backtest UI
│   │   │   ├── report.cljs           # Performance reports
│   │   │   └── common.cljs           # Shared components
│   │   │
│   │   ├── util/
│   │   │   ├── time.clj              # Time/date utilities
│   │   │   ├── math.clj              # Financial calculations
│   │   │   ├── logger.clj            # Structured logging
│   │   │   └── spec.clj              # Common specs
│   │   │
│   │   └── main.clj                  # Application entry point
│   │
│   └── resources/
│       ├── config.edn                # Default configuration
│       └── logback.xml               # Logging configuration
│
├── test/
│   └── com/little_trader/
│       ├── domain_test.clj           # Domain logic tests
│       ├── renko_test.clj            # Renko generation tests
│       ├── signals_test.clj          # Signal detection tests
│       ├── trade_test.clj            # Trade lifecycle tests
│       ├── strategy_test.clj         # Integration tests
│       └── ui_test.cljs              # Frontend tests
│
├── resources/public/
│   ├── index.html                   # SPA root
│   ├── style.css                    # Global styles
│   └── js/
│       └── app.js                   # Compiled ClojureScript
│
├── docker-compose.yml               # Local development
├── Dockerfile                       # Container image
├── project.clj                      # Leiningen config
├── deps.edn                         # Clojure CLI deps
├── .github/
│   └── workflows/
│       ├── test.yml                 # Test pipeline
│       ├── deploy.yml               # Deploy pipeline
│       └── backtest.yml             # Backtest job
└── k8s/
    ├── deployment.yaml              # K8s deployment
    ├── service.yaml                 # K8s service
    ├── configmap.yaml               # K8s config
    └── pvc.yaml                     # Persistent volumes
```

### Key Modules Explained

#### `domain/` - Pure Business Logic
**No side effects, fully testable**
- Renko brick generation algorithm
- Signal detection patterns
- Trade state transitions
- Risk calculations
- Language: Pure Clojure (no I/O)

#### `strategy/` - Orchestration
**Coordinates domain logic with I/O**
- Main execution loop (backtest, paper, production)
- Strategy state management
- Broker interaction
- Event emission

#### `data/` - Persistence Layer
**Datomic database abstraction**
- Schema definition (immutable, time-aware)
- Queries (EQL, Datomic Query)
- Transactions (append-only events)
- Migrations

#### `streams/` - Event Processing
**Kafka integration**
- OHLCV feed consumption
- Event publishing
- Backtest data streaming
- Lag recovery

#### `ui/` - Fulcro Components
**ClojureScript frontend**
- Fulcro RAD components (data-driven)
- Real-time updates via WebSocket
- Charts and visualizations
- Forms and user interactions

#### `server/` - API Gateway
**Fulcro server and request handling**
- EQL parsing and resolution
- Mutations (state changes)
- Authentication/Authorization
- Middleware

---

## Data Modeling with Datomic

### Schema Design

```clojure
[
  ;; OHLCV Bars
  {:db/ident :bar/id
   :db/valueType :db.type/uuid
   :db/cardinality :db.cardinality/one
   :db/unique :db.unique/identity}

  {:db/ident :bar/mts
   :db/valueType :db.type/long
   :db/cardinality :db.cardinality/one}

  {:db/ident :bar/symbol
   :db/valueType :db.type/string
   :db/cardinality :db.cardinality/one}

  {:db/ident :bar/ohlcv
   :db/valueType :db.type/tuple
   :db/tupleType :db.type/double
   :db/cardinality :db.cardinality/one}  ;; [open high low close]

  {:db/ident :bar/volume
   :db/valueType :db.type/double
   :db/cardinality :db.cardinality/one}

  {:db/ident :bar/bar-type
   :db/valueType :db.type/keyword
   :db/cardinality :db.cardinality/one}  ;; :ohlcv, :renko, :tv

  ;; Renko Bricks
  {:db/ident :brick/id
   :db/valueType :db.type/uuid
   :db/cardinality :db.cardinality/one
   :db/unique :db.unique/identity}

  {:db/ident :brick/bar
   :db/valueType :db.type/ref
   :db/cardinality :db.cardinality/one}  ;; References bar/id

  {:db/ident :brick/mts
   :db/valueType :db.type/long
   :db/cardinality :db.cardinality/one}

  {:db/ident :brick/ohlc
   :db/valueType :db.type/tuple
   :db/tupleType :db.type/double
   :db/cardinality :db.cardinality/one}  ;; [open high low close]

  {:db/ident :brick/direction
   :db/valueType :db.type/long
   :db/cardinality :db.cardinality/one}  ;; +1 or -1

  {:db/ident :brick/size
   :db/valueType :db.type/double
   :db/cardinality :db.cardinality/one}

  {:db/ident :brick/type
   :db/valueType :db.type/string
   :db/cardinality :db.cardinality/one}

  ;; Signals
  {:db/ident :signal/id
   :db/valueType :db.type/uuid
   :db/cardinality :db.cardinality/one
   :db/unique :db.unique/identity}

  {:db/ident :signal/brick
   :db/valueType :db.type/ref
   :db/cardinality :db.cardinality/one}

  {:db/ident :signal/type
   :db/valueType :db.type/keyword
   :db/cardinality :db.cardinality/one}  ;; :renko, :risk, :crossing

  {:db/ident :signal/action
   :db/valueType :db.type/string
   :db/cardinality :db.cardinality/one}

  {:db/ident :signal/side
   :db/valueType :db.type/keyword
   :db/cardinality :db.cardinality/one}  ;; :long, :short

  {:db/ident :signal/confirmed
   :db/valueType :db.type/boolean
   :db/cardinality :db.cardinality/one}

  ;; Trades
  {:db/ident :trade/id
   :db/valueType :db.type/uuid
   :db/cardinality :db.cardinality/one
   :db/unique :db.unique/identity}

  {:db/ident :trade/symbol
   :db/valueType :db.type/string
   :db/cardinality :db.cardinality/one}

  {:db/ident :trade/entry-signal
   :db/valueType :db.type/ref
   :db/cardinality :db.cardinality/one}

  {:db/ident :trade/entry-price
   :db/valueType :db.type/double
   :db/cardinality :db.cardinality/one}

  {:db/ident :trade/entry-amount
   :db/valueType :db.type/double
   :db/cardinality :db.cardinality/one}

  {:db/ident :trade/entry-timestamp
   :db/valueType :db.type/long
   :db/cardinality :db.cardinality/one}

  {:db/ident :trade/side
   :db/valueType :db.type/keyword
   :db/cardinality :db.cardinality/one}  ;; :long, :short

  {:db/ident :trade/exit-signal
   :db/valueType :db.type/ref
   :db/cardinality :db.cardinality/one}

  {:db/ident :trade/exit-price
   :db/valueType :db.type/double
   :db/cardinality :db.cardinality/one}

  {:db/ident :trade/exit-timestamp
   :db/valueType :db.type/long
   :db/cardinality :db.cardinality/one}

  {:db/ident :trade/status
   :db/valueType :db.type/keyword
   :db/cardinality :db.cardinality/one}  ;; :open, :closed, :halted

  {:db/ident :trade/pnl
   :db/valueType :db.type/double
   :db/cardinality :db.cardinality/one}

  {:db/ident :trade/pnl-percent
   :db/valueType :db.type/double
   :db/cardinality :db.cardinality/one}

  ;; Execution Runs
  {:db/ident :execution/id
   :db/valueType :db.type/uuid
   :db/cardinality :db.cardinality/one
   :db/unique :db.unique/identity}

  {:db/ident :execution/symbol
   :db/valueType :db.type/string
   :db/cardinality :db.cardinality/one}

  {:db/ident :execution/mode
   :db/valueType :db.type/keyword
   :db/cardinality :db.cardinality/one}  ;; :backtest, :paper, :production

  {:db/ident :execution/config
   :db/valueType :db.type/string
   :db/cardinality :db.cardinality/one}  ;; EDN-encoded config

  {:db/ident :execution/start-time
   :db/valueType :db.type/long
   :db/cardinality :db.cardinality/one}

  {:db/ident :execution/end-time
   :db/valueType :db.type/long
   :db/cardinality :db.cardinality/one}

  {:db/ident :execution/status
   :db/valueType :db.type/keyword
   :db/cardinality :db.cardinality/one}  ;; :running, :completed, :failed

  {:db/ident :execution/trades
   :db/valueType :db.type/ref
   :db/cardinality :db.cardinality/many}  ;; Multiple trades

  {:db/ident :execution/metrics
   :db/valueType :db.type/string
   :db/cardinality :db.cardinality/one}  ;; JSON-encoded metrics
]
```

### Query Patterns

#### Recent Bricks
```clojure
(d/q '[:find (pull ?brick [*])
       :where
       [?bar :bar/symbol ?sym]
       [?bar :bar/mts ?mts]
       [?brick :brick/bar ?bar]
       [?brick :brick/mts ?mts2]
       [(>= ?mts2 (- ?mts 86400000))]  ;; Last 24h
       ]
     db "BTC/USD")
```

#### Open Trades
```clojure
(d/q '[:find (pull ?trade [*])
       :where
       [?trade :trade/status :open]
       [?trade :trade/symbol ?sym]]
     db "BTC/USD")
```

#### Trade Performance
```clojure
(d/q '[:find ?side (count ?trade) (sum ?pnl)
       :where
       [?trade :trade/side ?side]
       [?trade :trade/pnl ?pnl]
       [?trade :trade/status :closed]]
     db)
```

### Time-Travel Queries (Datomic Superpowers)

```clojure
;; State at specific point in time
(d/as-of db (java.util.Date. 1234567890000))

;; All versions of a trade
(d/history db)

;; When trade status changed
(d/q '[:find ?e ?v ?t ?op
       :where
       [?e :trade/status ?v ?t ?op]
       [?e :trade/id ?id]]
     (d/history db))
```

---

## Frontend Architecture with Fulcro

### Fulcro Component Structure

```clojure
;; Fulcro RAD: Data-driven components with automatic UI generation
(defsc TradeListItem [this {trade-id :trade/id
                           entry-price :trade/entry-price
                           exit-price :trade/exit-price
                           pnl :trade/pnl
                           status :trade/status}]
  {:query [:trade/id :trade/entry-price :trade/exit-price :trade/pnl :trade/status]
   :ident :trade/id}
  (dom/div :.trade-item
    (dom/span (str "Entry: $" entry-price))
    (dom/span (str "Exit: $" exit-price))
    (dom/span (str "P&L: $" pnl))
    (dom/span (str "Status: " status))))

(defsc TradeList [this {trades :trades/all}]
  {:query [{:trades/all (comp/get-query TradeListItem)}]}
  (dom/div :.trade-list
    (map (fn [trade] (ui-trade-list-item trade)) trades)))

(defsc Dashboard [this props]
  {:route-segment ["dashboard"]
   :will-enter (fn [route-params] ...)}
  (dom/div :.dashboard
    (ui-trade-list)))
```

### Real-Time Updates with Fulcro Streaming

```clojure
;; Server pushes updates via WebSocket
(defn stream-trade-update! [env]
  (let [channel (::ws-channel env)]
    (>! channel {:op :trade-opened
                 :trade trade-data})))

;; Client subscriptions
(comp/use-effect!
  (fn []
    (prc/start-stream! this :trades/updates
      {:on-data (fn [data] (comp/update! this assoc :updates data))}))
  [])
```

### Charts with Oz/Plotly

```clojure
(defsc PriceChart [this {bricks :chart/bricks signals :chart/signals}]
  {:query [:chart/bricks :chart/signals]}
  (oz/view
    {:data {:values bricks}
     :mark "line"
     :encoding {:x {:field "mts" :type "temporal"}
                :y {:field "close" :type "quantitative"}}}))

(defsc SignalOverlay [this {signals :chart/signals}]
  {:query [:chart/signals]}
  (oz/view
    {:data {:values signals}
     :mark "point"
     :encoding {:x {:field "mts" :type "temporal"}
                :y {:field "price" :type "quantitative"}
                :color {:field "action" :type "nominal"}}}))
```

---

## Backend Services

### 1. Renko Generation Service
```clojure
(ns com.little-trader.domain.renko
  (:require [clojure.spec.alpha :as s]))

(s/def ::brick (s/keys :req [:brick/mts :brick/close :brick/direction]))

(defn generate-bricks
  "Transform OHLCV to Renko bricks"
  [last-brick ohlcv brick-size]
  ;; Implementation
  )

(defn classify-brick-type
  "Determine brick type based on pattern"
  [new-brick last-brick gap-count]
  ;; Implementation
  )
```

### 2. Signal Detection Service
```clojure
(ns com.little-trader.domain.signals)

(defn detect-renko-signals
  "Check brick patterns for trading signals"
  [brick-list state config]
  ;; Analyze last 3 bricks
  ;; Check for 1-brick, 2-brick, multi-brick patterns
  ;; Optional DEMA confirmation
  )

(defn detect-risk-signals
  "Check stop loss and trailing profit"
  [active-trade current-price config]
  ;; Implementation
  )
```

### 3. Trade Execution Service
```clojure
(ns com.little-trader.strategy.executor)

(defn execute-trade
  "Process signal and execute trade"
  [signal state broker config db]
  ;; Validate signal
  ;; Start/close/trail trade based on action
  ;; Transact to Datomic
  ;; Emit event to Kafka
  )

(defn backtest-mode-execution
  "Simulated execution for backtest"
  [signal state config db]
  ;; Simulate with slippage and fees
  )

(defn production-mode-execution
  "Real trading via broker API"
  [signal state broker config db]
  ;; Submit order to broker
  ;; Track execution
  )
```

### 4. Strategy Loop
```clojure
(ns com.little-trader.strategy.executor)

(defn strategy-loop
  "Main event processing loop"
  [config]
  (let [consumer (kafka/create-consumer ...)
        db (d/get-connection ...)
        broker (broker/create-broker config)]
    (loop [state initial-state]
      (let [ohlcv (kafka/poll consumer)
            bricks (renko/generate-bricks ...)
            signal (signals/detect-signal bricks state config)
            new-state (if signal
                        (execute-trade signal state broker config db)
                        state)]
        (recur new-state)))))
```

---

## Data Flows

### 1. Backtest Flow
```
CSV/File Data
    ↓
Kafka Topic (simulated)
    ↓
OHLCV Bar ──→ Renko Generation
    ↓
Brick Set ──→ Signal Detection
    ↓
Signal ──→ Trade Execution (simulated)
    ↓
Trade Event ──→ Datomic Transaction
    ↓
Metrics Calculation ──→ Report Generation
    ↓
Dashboard / Chart Visualization
```

### 2. Paper Trading Flow
```
Live Kafka Feed
    ↓
OHLCV Bar ──→ Renko Generation
    ↓
Brick Set ──→ Signal Detection
    ↓
Signal ──→ Trade Execution (simulated)
    ↓
Trade Event ──→ Datomic Transaction
    ↓
WebSocket Push ──→ Frontend Update
    ↓
Real-time Dashboard
```

### 3. Production Flow
```
Live Kafka Feed
    ↓
OHLCV Bar ──→ Renko Generation
    ↓
Brick Set ──→ Signal Detection
    ↓
Signal ──→ Risk Checks
    ↓
Valid Signal ──→ Broker Order Submission
    ↓
Order Confirmation ──→ Position Tracking
    ↓
Trade Event ──→ Datomic Transaction
    ↓
Alert System (Slack/Email)
    ↓
Monitoring Dashboard
```

---

## Concurrency Model

### Core.async for Event Processing
```clojure
(ns com.little-trader.streams.events
  (:require [clojure.core.async :as async]))

;; Channels for different event types
(def brick-channel (async/chan 100))
(def signal-channel (async/chan 100))
(def trade-channel (async/chan 100))

;; Kafka consumer loop (runs in thread pool)
(defn start-kafka-consumer! [config]
  (async/go-loop []
    (let [ohlcv (kafka/poll-blocking)]
      (>! brick-channel ohlcv)
      (recur))))

;; Brick generation pipeline
(defn start-brick-processor! [config]
  (async/go-loop []
    (let [ohlcv (<! brick-channel)
          bricks (renko/generate-bricks ...)]
      (doseq [brick bricks]
        (>! signal-channel brick))
      (recur))))

;; Signal detection pipeline
(defn start-signal-detector! [state config]
  (async/go-loop [state state]
    (let [brick (<! signal-channel)
          signal (signals/detect-signal brick state config)]
      (when signal
        (>! trade-channel signal))
      (recur state))))

;; Trade execution pipeline
(defn start-trade-executor! [broker config db]
  (async/go-loop []
    (let [signal (<! trade-channel)
          trade (execute-trade signal broker config db)]
      (when trade
        (>! (datomic-transact-channel db) trade))
      (recur))))
```

### Thread Pool Strategy
- **Kafka Consumer**: Fixed thread pool (1 thread per partition)
- **Brick Generation**: Bounded thread pool (CPU cores)
- **Signal Detection**: Bounded thread pool (CPU cores)
- **Trade Execution**: Small thread pool (2-4 threads)
- **Database**: Datomic handles its own connection pool

---

## Deployment Architecture

### Local Development (Docker Compose)
```yaml
version: '3.8'
services:
  datomic:
    image: datomic:latest
    ports:
      - "4334:4334"
    volumes:
      - datomic_data:/data

  kafka:
    image: confluentinc/cp-kafka:latest
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181

  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    ports:
      - "2181:2181"

  renko-trader:
    build: .
    ports:
      - "3000:3000"  # Frontend
      - "8080:8080"  # API
    depends_on:
      - datomic
      - kafka
    environment:
      DATOMIC_URI: datomic:mem://trading
      KAFKA_BROKERS: kafka:9092
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: renko-trader
spec:
  replicas: 2
  selector:
    matchLabels:
      app: renko-trader
  template:
    metadata:
      labels:
        app: renko-trader
    spec:
      containers:
      - name: renko-trader
        image: renko-trader:latest
        ports:
        - containerPort: 3000
        - containerPort: 8080
        env:
        - name: DATOMIC_URI
          valueFrom:
            configMapKeyRef:
              name: renko-config
              key: datomic_uri
        - name: KAFKA_BROKERS
          valueFrom:
            configMapKeyRef:
              name: renko-config
              key: kafka_brokers
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
```

---

## Features & Development Lifecycle

### Feature Architecture

Each feature follows a layered implementation pattern:

```
┌─────────────────────────────┐
│  Feature Requirements       │  (FEATURES.md)
│  - Use cases                │
│  - Data models              │
│  - Integration points       │
└────────────┬────────────────┘
             │
┌────────────▼────────────────┐
│  Domain Logic               │  (src/domain/)
│  - Pure functions           │
│  - No side effects          │
│  - 100% testable            │
└────────────┬────────────────┘
             │
┌────────────▼────────────────┐
│  Strategy/Orchestration     │  (src/strategy/)
│  - Coordinates logic        │
│  - Handles I/O              │
│  - Manages state            │
└────────────┬────────────────┘
             │
┌────────────▼────────────────┐
│  Data Access Layer          │  (src/data/)
│  - Datomic transactions     │
│  - Query functions          │
│  - Schema management        │
└────────────┬────────────────┘
             │
┌────────────▼────────────────┐
│  Frontend                   │  (src/ui/)
│  - Fulcro components        │
│  - Real-time updates        │
│  - User interaction         │
└─────────────────────────────┘
```

### Development Lifecycle

Each feature moves through these phases:

#### Phase 1: Specification (1-2 days)
- Write detailed requirements in FEATURES.md
- Define data structures
- List acceptance criteria
- Identify edge cases

#### Phase 2: Test-Driven Development (2-3 days)
- Write failing tests first
- Implement domain logic to pass tests
- Add property-based tests for invariants
- Achieve 100% coverage on domain logic

#### Phase 3: Integration (1-2 days)
- Implement strategy/orchestration layer
- Connect to data persistence
- Add integration tests
- Verify end-to-end workflows

#### Phase 4: UI & Visualization (2-3 days)
- Build Fulcro components
- Add real-time updates via WebSocket
- Create charts and visualizations
- Test interaction patterns

#### Phase 5: Documentation & Refinement (1 day)
- Update code comments
- Document edge cases
- Add architecture diagrams
- Prepare for code review

#### Phase 6: Production Hardening (1 day)
- Add error handling
- Implement monitoring
- Performance testing
- Security review

### Example: Renko Brick Generation Feature

**Phase 1: Specification**
```markdown
## Renko Brick Generation

### Requirements
- Transform OHLCV candles to Renko bricks
- Generate multiple bricks if price gap > brick_size
- Classify brick types (forward_single, backward_double, etc.)

### Data Model
- Input: OHLCV bar
- Output: Array of bricks with direction, type, timestamps

### Edge Cases
- First brick (alignment)
- No movement (zero gap)
- Large price movements (multiple bricks)
- Reversal patterns (2x brick size requirement)
```

**Phase 2: Tests**
```clojure
(deftest first-brick-alignment ...)
(deftest single-brick-forward ...)
(deftest multiple-bricks-forward ...)
(deftest reversal-brick-backward ...)
(deftest no-brick-insufficient-gap ...)
(deftest property-brick-consistency ...)
```

**Phase 3: Implementation**
```clojure
(defn get-new-bricks-from-ohlcv [ohlcv bars brick-size] ...)
(defn renko-rule-ohlcv [last-brick new-ohlcv brick-size] ...)
```

**Phase 4: Signal Detection UI**
```clojure
(defsc BrickVisualization [this {:keys [bricks signals]}] ...)
```

**Phase 5: Documentation**
- Code comments explaining algorithm
- ASCII diagrams of patterns
- README section

**Phase 6: Monitoring**
- Brick generation metrics
- Performance benchmarks
- Error rates

---

## Prompt Engineering for AI Collaboration

### Effective Prompt Structure

When working with Claude Code, structure prompts in layers:

#### Layer 1: Context
```markdown
## Project: Renko Trading System

**Current Status:**
- Implemented: Renko brick generation, signal detection
- In Progress: Risk management optimization
- Next: Backtesting and performance

**Relevant Files:**
- src/domain/risk.clj (current implementation)
- test/domain/risk_test.clj (existing tests)
```

#### Layer 2: Problem Definition
```markdown
## Problem: P&L Calculation is Slow

**Observed Issue:**
- Backtesting 1000 trades takes 30 seconds
- Profiler shows calculate-pnl-percent as hot spot
- Need <10 second performance

**Current Algorithm:**
[Show code]

**Requirements:**
- Maintain precision to 4 decimals
- Must handle long and short positions
- No external dependencies
```

#### Layer 3: Solution Approach
```markdown
## Proposed Solution

### Analysis
- Math library overhead too high
- Can use native calculations

### Approach
1. Vectorize calculations
2. Use inline math ops
3. Cache commonly used values
4. Add benchmarks

### Constraints
- No breaking API changes
- Tests must pass
- Results must match exactly
```

#### Layer 4: Acceptance Criteria
```markdown
## Definition of Done

- [ ] Performance: <10 seconds for 1000 trades
- [ ] Accuracy: Results identical to original
- [ ] Tests: All passing, new benchmarks added
- [ ] Code: Clear, documented, reviewed
- [ ] Git: Clean commit with explanation
```

### Prompt Engineering Techniques

#### 1. Few-Shot Examples
```markdown
## Pattern: How Signals Work

### Example 1: One-Brick Signal
Input: [+1, -1] (direction sequence)
Output: LONG signal
Reason: Down then up suggests reversal

### Example 2: Double-Brick Signal
Input: [+1, +1, -1]
Output: LONG signal
Reason: Two ups then down = reversal pattern

### Now Apply to:
Input: [-1, -1, +1]
Expected Output: ?
```

#### 2. Chain-of-Thought Prompting
```markdown
## Task: Optimize Brick Generation

Let's think through this step by step:

1. What's the current bottleneck?
2. Why is it slow?
3. What optimization would help?
4. What are the trade-offs?
5. How do we validate correctness?

Walk through each step...
```

#### 3. Role-Based Prompting
```markdown
## You are: Performance Engineer

Given:
- Current implementation (show code)
- Performance target: <1ms per signal
- Current time: 5ms per signal

As a performance expert, suggest:
- Root causes of slowness
- Optimization techniques
- Trade-off analysis
- Implementation approach
```

### Context Preservation Patterns

#### Pattern 1: Reusable Context Document
```markdown
# DEVELOPMENT_CONTEXT.md

## Architecture Overview
[Brief system overview]

## Key Modules
- domain/: Pure logic
- strategy/: Orchestration
- ui/: Frontend

## Recent Changes
[What's been done]

## Current Challenges
[What we're solving]

## Design Decisions
[Why we chose certain approaches]
```

#### Pattern 2: Feature Branch Context
```markdown
# Feature: Multi-Brick Signals

## Objective
Implement 3+ brick pattern detection

## Related Code
- signals.clj: Detection logic
- signals_test.clj: Tests
- renko.clj: Brick patterns

## Done So Far
- One-brick signals working
- Double-brick signals working

## In Progress
- Multi-brick implementation

## Blocked By
- Need edge case clarification
```

### Anti-Patterns to Avoid

**Don't**: Vague requirements
```
"Fix the signals code"
```

**Do**: Specific, detailed requirements
```
"The multi-brick signal detection should:
1. Detect 3+ consecutive bricks in same direction
2. Handle both long [+1, +1, +1] and short [-1, -1, -1]
3. Return signal with specific action name
4. Pass 100 property-based tests"
```

**Don't**: Assume context
```
"Make it better"
```

**Do**: Provide full context
```
"Current implementation has issue X.
Context: [explain]
Solution: [approach]
Constraints: [limitations]
Test with: [test cases]"
```

---

## AI Vibe Coding Integration

### Vibe Coding in This Architecture

The architecture enables "vibe coding" patterns:

#### Pattern 1: Exploratory Development
```
Developer: "What would happen if we increased brick size to 500?"

Claude (via MCP):
1. Analyzes impact on signal frequency
2. Queries historical backtest results
3. Suggests configuration changes
4. Runs micro-benchmarks

Result: Data-driven exploration
```

#### Pattern 2: Iterative Refinement
```
Developer: "Signal detection is working, but let's make it faster"

Claude:
1. Profiles current implementation
2. Identifies bottlenecks
3. Suggests optimizations
4. Implements changes
5. Benchmarks improvements
6. Iterates until satisfactory

Result: Production-grade performance
```

#### Pattern 3: Test-Driven Vibe
```
Developer: "Write tests for edge cases in P&L calculation"

Claude:
1. Analyzes current tests
2. Identifies coverage gaps
3. Writes failing tests for edge cases
4. Implements fixes
5. Adds property-based tests
6. Validates with 1000+ iterations

Result: Bulletproof domain logic
```

### AI Integration Points in Architecture

#### 1. Code Generation Assistance
```clojure
;; Claude helps write boilerplate
(defn data-mapping-function [data]
  ;; Claude suggests implementation based on schema
  (let [{:keys [entry-price exit-price side]} data]
    {:pnl (calculate-pnl entry-price exit-price side)
     :pnl-percent (* (pnl entry-price exit-price side))}))
```

#### 2. Algorithm Design
```clojure
;; Claude helps design efficient algorithms
(defn optimize-brick-generation [ohlcv-stream]
  ;; Claude suggests vectorization or better data structures
  (transform ohlcv-stream
    (comp
      (map validate-ohlcv)
      (map generate-bricks)
      (map detect-signals))))
```

#### 3. Testing Strategy
```clojure
;; Claude helps comprehensive test coverage
(deftest ^:property renko-invariants
  ;; Claude generates property tests automatically
  (prop/for-all [price-sequence (gen/list (gen/int))]
    ;; Invariants: idempotency, determinism, etc.
    ))
```

#### 4. Documentation Generation
```clojure
;; Claude generates documentation from code
(defn ^:doc-generate calculate-pnl
  "Calculate profit/loss between entry and exit
   Handles both long and short positions
   Returns percent and absolute values"
  [entry-price exit-price amount side]
  ;; Implementation...
  )
```

### MCP Resources for Vibe Coding

The MCP server exposes resources that Claude uses:

#### Resource 1: Codebase Context
```
codebase://root
├── modules/structure
├── dependencies
└── recent-changes
```

Claude queries this to understand current state.

#### Resource 2: Trading Data
```
trading://data/current
├── market state
├── recent trades
├── performance metrics
└── signal frequency
```

Claude uses this for context-aware suggestions.

#### Resource 3: Schema & API
```
schema://api
├── entities
├── relationships
└── available-queries
```

Claude understands data relationships.

### Development Workflow with AI

```
┌─────────────────────────────────────────┐
│  Developer writes task description      │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│  Claude Code (with MCP access):         │
│  1. Read codebase context               │
│  2. Query current performance metrics   │
│  3. Understand requirements             │
│  4. Analyze existing tests              │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│  Claude suggests approach                │
│  - Design pattern                        │
│  - Testing strategy                      │
│  - Integration points                    │
└────────────┬────────────────────────────┘
             │
     ┌───────▼────────┐
     │ Developer      │
     │ approves/      │
     │ refines        │
     └────────┬───────┘
              │
┌────────────▼────────────────────────────┐
│  Claude implements:                      │
│  - Domain logic (pure functions)         │
│  - Tests (TDD style)                     │
│  - Integration code                      │
│  - Documentation                         │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│  Developer reviews:                      │
│  - Code quality                          │
│  - Design patterns                       │
│  - Test coverage                         │
│  - Documentation                         │
└────────────┬────────────────────────────┘
             │
     ┌───────▼────────┐
     │ Approved?      │
     │ - Yes → Merge  │
     │ - No → Revise  │
     └────────────────┘
```

### Best Practices for AI Integration

1. **Clear Specifications**: Write requirements like code specs
2. **Examples**: Show what good looks like
3. **Constraints**: List limits and requirements
4. **Validation**: Define how to test correctness
5. **Iteration**: Refine through feedback
6. **Documentation**: Explain intent, not just what
7. **Trust But Verify**: AI assists, humans decide

### Examples of Vibe Coding Sessions

#### Session 1: Performance Optimization
```
Developer: "These backtests are slow. Let's improve."

Claude: "I'll profile and find bottlenecks"
→ Identifies brick generation as 70% of time

Developer: "Vectorize it"

Claude: "I'll refactor to use transducers"
→ Implements vectorized version
→ Adds benchmarks
→ Validates correctness

Result: 6x performance improvement
```

#### Session 2: Feature Development
```
Developer: "Add support for multi-timeframe analysis"

Claude: "Let me understand the current architecture"
→ Reads codebase context
→ Suggests integration approach
→ Shows data flow diagram

Developer: "That looks good. Let's implement it."

Claude: "Here's the plan:
1. Define multi-timeframe data structure
2. Implement aggregation logic
3. Extend signal detection
4. Add UI components
5. Write comprehensive tests"
→ Implements all components
→ Achieves 100% test coverage

Result: New feature, fully tested, documented
```

#### Session 3: Bug Investigation
```
Developer: "These tests fail randomly. Memory issue?"

Claude: "Let me investigate"
→ Runs tests multiple times
→ Analyzes failure patterns
→ Profiles memory usage

Developer: "Found something?"

Claude: "Yes - race condition in state updates
The issue is here [shows code]
Fix: Add locking or use atomic updates"
→ Implements fix
→ Adds synchronization tests

Result: Stable, production-ready code
```

---

## EPIC-OPTIONS: Feature Extension Example

### How New Features Extend the Architecture

The **EPIC-OPTIONS** feature demonstrates how the Clojure/Fulcro RAD/Datomic stack enables efficient feature additions. See [EPIC_OPTIONS.md](./EPIC_OPTIONS.md) for complete documentation.

### Extension Pattern

```
┌─────────────────────────────────────────────────────────────────────┐
│  FEATURE EXTENSION PATTERN                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. SCHEMA EXTENSION (schema.clj)                                   │
│     - Add new entity definitions                                    │
│     - Extend existing full-schema                                   │
│     - Auto-generates queries via RAD                                │
│                                                                     │
│  2. RAD ATTRIBUTES (model/option.cljc)                              │
│     - Define entity attributes with defattr                         │
│     - Auto-generates resolvers, mutations, UI                       │
│     - Type-safe with enumerated values                              │
│                                                                     │
│  3. DOMAIN LOGIC (domain/options.clj)                               │
│     - Pure functions only                                           │
│     - Easily testable                                               │
│     - No database or I/O dependencies                               │
│                                                                     │
│  4. CONNECTOR (connectors/metatrader.clj)                           │
│     - Integration with external systems                             │
│     - Implements ITradingConnector protocol                         │
│     - Isolated from domain logic                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Files Created for EPIC-OPTIONS

| File | Purpose | LOC |
|------|---------|-----|
| `data/schema.clj` | Extended with options schema | +400 |
| `model/option.cljc` | RAD attributes for options | ~250 |
| `domain/options.clj` | Greeks, P&L calculations | ~300 |
| `domain/options_signals.clj` | Renko-based signals | ~250 |
| `connectors/metatrader.clj` | MT5 integration | ~350 |

**Total: ~1550 lines** for a complete options trading feature with:
- Options contracts (calls/puts)
- The Greeks (Delta, Gamma, Theta, Vega, Rho)
- MQL5-aligned data model
- Renko-based options strategy
- MetaTrader 5 integration

### Why This Stack is Efficient

| Aspect | Traditional Stack | Clojure/RAD |
|--------|------------------|-------------|
| API Layer | Manual controller + service | Auto-generated resolvers |
| Data Queries | Repository pattern | Datalog queries |
| UI Forms | Manual components | RAD auto-generation |
| Schema Changes | SQL migrations | Append-only schema |
| Testing | Mocks required | Pure functions |

### MQL5 Taxonomy Integration

The schema follows [MetaTrader 5 naming conventions](https://www.mql5.com/en/docs):

```clojure
;; Positions (MQL5: POSITION_*)
{:position/ticket      ;; POSITION_TICKET
 :position/volume      ;; POSITION_VOLUME
 :position/price-open  ;; POSITION_PRICE_OPEN
 :position/profit}     ;; POSITION_PROFIT

;; Orders (MQL5: ORDER_*)
{:order/ticket         ;; ORDER_TICKET
 :order/type           ;; ORDER_TYPE
 :order/volume-initial ;; ORDER_VOLUME_INITIAL
 :order/sl :order/tp}  ;; ORDER_SL, ORDER_TP

;; Options
{:option/strike        ;; SYMBOL_OPTION_STRIKE
 :option/type          ;; SYMBOL_OPTION_RIGHT (:call/:put)
 :option/expiration}   ;; SYMBOL_EXPIRATION_TIME
```

---

## Summary

This Clojure architecture provides:
- ✅ Immutable event sourcing with Datomic
- ✅ Data-driven frontend with Fulcro RAD
- ✅ Composable domain logic modules
- ✅ Concurrent event processing with core.async
- ✅ Time-travel debugging capabilities
- ✅ Production-ready deployment options
- ✅ Fully testable pure functions
- ✅ GraphQL-like queries with EQL
- ✅ 6-phase feature development lifecycle
- ✅ Structured prompt engineering for AI collaboration
- ✅ MCP integration for Claude Code assistance
- ✅ "Vibe coding" patterns with AI pair programming
- ✅ Clear separation of concerns (domain, strategy, data, UI)
- ✅ Comprehensive testing strategy (unit, integration, E2E, property-based)
- ✅ **EPIC-OPTIONS**: Options trading with MQL5/MetaTrader integration
- ✅ **Extension Pattern**: Efficient feature addition workflow
