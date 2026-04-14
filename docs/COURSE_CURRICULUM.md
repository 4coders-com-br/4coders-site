# Clojure Full-Stack Development Course
## "From Zero to Production: Building Real Trading Systems"

**Course Platform:** YouTube (Free) + Paid Workshops
**Duration:** 2 Years (52 weeks free + 4 quarterly workshops)
**Project:** Little Trader - Renko Trading System
**Prerequisites:** Basic programming knowledge, willingness to learn

---

## Course Philosophy

This course uses the **"Learn by Building"** approach where every concept is demonstrated through real, production-ready code from the Little Trader project. Students don't learn abstract concepts—they build a complete trading system.

## Navigation

- [Embedded Course and Manual](/Users/victorinacio/4coders/little-trader/docs/EMBEDDED_COURSE_AND_MANUAL.md)
- [Architecture Visual Guide](/Users/victorinacio/4coders/little-trader/docs/ARCHITECTURE_VISUAL_GUIDE.md)
- [C4 Architecture](/Users/victorinacio/4coders/little-trader/docs/C4_ARCHITECTURE.md)
- [News and Data Crawlers](/Users/victorinacio/4coders/little-trader/docs/NEWS_AND_DATA_CRAWLERS.md)
- [Developer Ergonomics](/Users/victorinacio/4coders/little-trader/docs/DEVELOPER_ERGONOMICS.md)

## Embedded Track Map

The in-app course is organized into five practical tracks:

- Trading and market mechanics
- REPL-first development and debugging
- LLM copilot and strategy advisor usage
- Architecture and system design
- Developer ergonomics, MCP, and cloud parity

### Learning Outcomes

By the end of Year 1, students will:
- Master Clojure and ClojureScript fundamentals
- Build full-stack web applications with Fulcro
- Understand financial trading systems
- Deploy applications to production

By the end of Year 2, students will:
- Architect distributed systems
- Implement machine learning pipelines
- Master DevOps and Kubernetes
- Build production-grade trading strategies

## Teaching Guardrails

- Teach behavior from the codebase, not generic theory.
- Use the REPL and the copilot as separate tools with different trust levels.
- Distinguish suggestion-only workflows from executable actions.
- Point out when a feature is conceptual, staged, or production-ready.
- Always connect diagrams back to actual code paths and docs.

---

# YEAR 1: FREE YOUTUBE SERIES
## "Clojure Full-Stack Mastery"

---

## Module 1: Foundations of Clojure (Weeks 1-8)

### Week 1: Introduction to Clojure and Functional Programming
**Video Title:** "Why Clojure? Building a Trading System from Scratch"

**Topics:**
- What is Clojure and why it matters for financial systems
- The JVM advantage: performance, libraries, ecosystem
- Functional programming paradigm overview
- REPL-driven development introduction
- Setting up the development environment

**Little Trader Examples:**
- Overview of the trading system architecture
- First look at `main.clj` and system startup
- Why immutability matters for trading data

**Practical Exercise:**
- Install Clojure CLI tools
- Start a REPL and evaluate expressions
- Clone little-trader and explore structure

**Resources:**
- clojure.org/guides/getting_started
- Reference: `/home/user/little-trader/src/com/little_trader/main.clj`

---

### Week 2: Data Structures - The Heart of Clojure
**Video Title:** "Clojure Data Structures: Lists, Vectors, Maps, and Sets"

**Topics:**
- Immutable data structures
- Lists: `'(1 2 3)` - sequential access
- Vectors: `[1 2 3]` - indexed access
- Maps: `{:key "value"}` - associative data
- Sets: `#{1 2 3}` - unique collections
- Nested data structures
- Structural sharing (how immutability is efficient)

**Little Trader Examples:**
```clojure
;; Bar data as a map (from bar.cljc)
{:bar/open 42000.0
 :bar/high 42500.0
 :bar/low 41800.0
 :bar/close 42300.0
 :bar/volume 150.5
 :bar/mts 1699920000000}

;; Collection of bricks (vector of maps)
[{:brick/direction 1 :brick/open 42000 :brick/close 42100}
 {:brick/direction 1 :brick/open 42100 :brick/close 42200}
 {:brick/direction -1 :brick/open 42200 :brick/close 42100}]
```

**Practical Exercise:**
- Create OHLCV bar representations
- Build a collection of price data
- Navigate nested trading data

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/model/bar.cljc`
- `/home/user/little-trader/src/com/little_trader/model/brick.cljc`

---

### Week 3: Functions - First-Class Citizens
**Video Title:** "Functions in Clojure: defn, fn, and Higher-Order Functions"

**Topics:**
- Defining functions with `defn`
- Anonymous functions with `fn` and `#()`
- Multiple arities
- Variadic functions
- Destructuring in parameters
- Docstrings and metadata

**Little Trader Examples:**
```clojure
;; From renko.clj - calculating true range
(defn true-range
  "Calculate the true range for a bar given the previous close.
   True Range = max(high - low, |high - prev-close|, |low - prev-close|)"
  [bar prev-close]
  (let [{:bar/keys [high low]} bar]
    (if prev-close
      (max (- high low)
           (Math/abs (- high prev-close))
           (Math/abs (- low prev-close)))
      (- high low))))
```

**Practical Exercise:**
- Write P&L calculation functions
- Implement percentage change calculator
- Create bar validation functions

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/domain/renko.clj:15-25`

---

### Week 4: Working with Sequences
**Video Title:** "Sequence Operations: map, filter, reduce, and Beyond"

**Topics:**
- The sequence abstraction
- `map` - transforming collections
- `filter` - selecting elements
- `reduce` - aggregating values
- `take`, `drop`, `take-while`, `drop-while`
- Lazy sequences
- Sequence composition

**Little Trader Examples:**
```clojure
;; From renko.clj - extracting directions from bricks
(defn directions
  "Extract the directions from a sequence of bricks."
  [bricks]
  (map :brick/direction bricks))

;; Calculating ATR with reduce
(defn calculate-atr
  "Calculate Average True Range over a period."
  [bars period]
  (let [trs (map-indexed
             (fn [idx bar]
               (true-range bar (when (pos? idx)
                                (:bar/close (nth bars (dec idx))))))
             bars)]
    (/ (reduce + (take-last period trs)) period)))
```

**Practical Exercise:**
- Filter profitable trades from history
- Calculate moving averages with `reduce`
- Extract price patterns from bar sequences

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/domain/renko.clj:27-50`

---

### Week 5: Control Flow and Conditionals
**Video Title:** "Decision Making in Clojure: if, when, cond, and case"

**Topics:**
- `if` expressions (not statements!)
- `when` for side-effect-free conditionals
- `cond` for multiple conditions
- `case` for value matching
- `condp` for predicate-based matching
- Truthiness in Clojure (only `nil` and `false` are falsy)

**Little Trader Examples:**
```clojure
;; From signals.clj - detecting signal type
(defn detect-one-brick-signal
  "Detect a one-brick reversal signal from brick directions."
  [directions config]
  (when (get-in config [:signals :one-brick :enabled] true)
    (let [last-two (take-last 2 directions)]
      (cond
        (= last-two [-1 1])  {:action "one_brick_start_long" :side :long}
        (= last-two [1 -1])  {:action "one_brick_start_short" :side :short}
        :else nil))))

;; From trades.clj - determining trade side
(defn calculate-pnl
  "Calculate P&L based on trade side."
  [entry-price exit-price amount side fees]
  (let [gross-pnl (case side
                    :long (* amount (- exit-price entry-price))
                    :short (* amount (- entry-price exit-price)))]
    (- gross-pnl fees)))
```

**Practical Exercise:**
- Implement signal classification logic
- Write trade entry/exit decision functions
- Create risk level categorization

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/domain/signals.clj:45-70`
- `/home/user/little-trader/src/com/little_trader/domain/trades.clj:30-50`

---

### Week 6: Let Bindings and Local State
**Video Title:** "Local Bindings: let, letfn, and Destructuring Mastery"

**Topics:**
- `let` for local bindings
- Sequential binding evaluation
- Destructuring maps: `{:keys [a b]}`
- Destructuring vectors: `[a b & rest]`
- Nested destructuring
- `letfn` for local functions
- `if-let` and `when-let`

**Little Trader Examples:**
```clojure
;; From trades.clj - complex destructuring
(defn create-trade
  "Create a new trade from a signal."
  [signal current-price timestamp account-id strategy-id]
  (let [{:keys [action side]} signal
        {:keys [amount leverage]} (get-position-config strategy-id)]
    {:trade/id (random-uuid)
     :trade/status :pending
     :trade/side side
     :trade/entry-price current-price
     :trade/amount amount
     :trade/leverage leverage
     :trade/entry-timestamp timestamp
     :trade/account [:account/id account-id]
     :trade/strategy [:strategy/id strategy-id]}))

;; Nested destructuring in risk.clj
(defn check-trailing-stop
  [trade current-price]
  (let [{:trade/keys [side entry-price max-profit]
         {:keys [trailing-ranges]} :trade/strategy} trade
        active-range (find-active-trailing-range max-profit trailing-ranges)]
    ...))
```

**Practical Exercise:**
- Destructure trade and signal data
- Build complex data transformation pipelines
- Implement position sizing with local bindings

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/domain/trades.clj:60-90`

---

### Week 7: Namespaces and Project Organization
**Video Title:** "Organizing Clojure Projects: Namespaces and Dependencies"

**Topics:**
- `ns` declaration
- `:require` and `:import`
- Aliasing with `:as`
- Selective imports with `:refer`
- Project structure conventions
- deps.edn configuration
- Understanding classpaths

**Little Trader Examples:**
```clojure
;; From renko.clj - namespace declaration
(ns com.little-trader.domain.renko
  "Renko brick generation and analysis functions.
   Pure functions for creating Renko charts from OHLCV data."
  (:require
   [clojure.spec.alpha :as s]
   [com.little-trader.config :as config]))

;; From main.clj - complex requires
(ns com.little-trader.main
  (:require
   [mount.core :as mount]
   [com.little-trader.config :as config]
   [com.little-trader.data.db :as db]
   [com.little-trader.server.core :as server]
   [taoensso.timbre :as log])
  (:gen-class))
```

**Practical Exercise:**
- Organize a multi-namespace project
- Create domain, server, and UI namespaces
- Configure deps.edn with aliases

**Reference Files:**
- `/home/user/little-trader/deps.edn`
- `/home/user/little-trader/src/com/little_trader/main.clj:1-15`

---

### Week 8: Specs and Data Validation
**Video Title:** "clojure.spec: Data Validation and Generative Testing"

**Topics:**
- Defining specs with `s/def`
- Predicates as specs
- Composite specs: `s/and`, `s/or`, `s/keys`
- Collection specs: `s/coll-of`, `s/map-of`
- `s/valid?`, `s/explain`, `s/conform`
- Function specs with `s/fdef`
- Generative testing introduction

**Little Trader Examples:**
```clojure
;; From renko.clj - bar and brick specs
(s/def :bar/open number?)
(s/def :bar/high number?)
(s/def :bar/low number?)
(s/def :bar/close number?)
(s/def :bar/volume number?)
(s/def :bar/mts pos-int?)

(s/def ::bar
  (s/keys :req [:bar/open :bar/high :bar/low :bar/close :bar/volume :bar/mts]))

(s/def :brick/direction #{-1 1})
(s/def :brick/open number?)
(s/def :brick/close number?)
(s/def :brick/type #{:initial :forward :backward :single :double :multiple})

(s/def ::brick
  (s/keys :req [:brick/direction :brick/open :brick/close]
          :opt [:brick/type :brick/high :brick/low]))
```

**Practical Exercise:**
- Define specs for all trading entities
- Validate incoming API data
- Generate test data with spec generators

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/domain/renko.clj:5-35`

---

## Module 2: Intermediate Clojure (Weeks 9-16)

### Week 9: Recursion and Loop/Recur
**Video Title:** "Recursive Thinking: From Iteration to Recursion"

**Topics:**
- Recursive function design
- Base cases and recursive cases
- `recur` for tail-call optimization
- `loop/recur` for iterative processes
- Accumulators pattern
- Tree traversal with recursion

**Little Trader Examples:**
```clojure
;; From renko.clj - generating bricks recursively
(defn generate-all-bricks
  "Generate all Renko bricks from a sequence of bars."
  [bars brick-size]
  (loop [remaining-bars (rest bars)
         current-brick (first-brick (first bars) brick-size)
         all-bricks [current-brick]]
    (if (empty? remaining-bars)
      all-bricks
      (let [bar (first remaining-bars)
            new-bricks (get-new-bricks-from-ohlcv current-brick bar brick-size)]
        (recur (rest remaining-bars)
               (or (last new-bricks) current-brick)
               (into all-bricks new-bricks))))))
```

**Practical Exercise:**
- Implement brick generation with loop/recur
- Build a trade history aggregator
- Create recursive P&L calculator

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/domain/renko.clj:180-220`

---

### Week 10: Multimethods and Protocols
**Video Title:** "Polymorphism in Clojure: Multimethods and Protocols"

**Topics:**
- `defmulti` and `defmethod`
- Dispatch functions
- Default methods
- Hierarchies with `derive`
- `defprotocol` for interface definitions
- `extend-type` and `extend-protocol`
- Records with `defrecord`
- When to use multimethods vs protocols

**Little Trader Examples:**
```clojure
;; Signal type dispatch
(defmulti process-signal
  "Process a signal based on its type."
  :signal/type)

(defmethod process-signal :one-brick
  [signal state]
  (handle-reversal-signal signal state))

(defmethod process-signal :double-brick
  [signal state]
  (handle-continuation-signal signal state))

(defmethod process-signal :multi-brick
  [signal state]
  (handle-trend-signal signal state))

;; Protocol for different data sources
(defprotocol DataSource
  (fetch-bars [this symbol timeframe])
  (subscribe-bars [this symbol callback])
  (close-connection [this]))
```

**Practical Exercise:**
- Implement signal processing with multimethods
- Create data source protocol for different exchanges
- Build trade executor with protocol dispatch

---

### Week 11: Error Handling and Exceptions
**Video Title:** "Graceful Failures: Error Handling in Clojure"

**Topics:**
- `try`/`catch`/`finally`
- `throw` and `ex-info`
- Exception data with `ex-data`
- Error as data philosophy
- Either monad pattern (optional)
- Validation vs exceptions
- Logging errors with Timbre

**Little Trader Examples:**
```clojure
;; From server/routes.clj - API error handling
(defn handle-trade-request
  [request]
  (try
    (let [{:keys [side amount]} (:body request)
          _ (when-not (#{:long :short} side)
              (throw (ex-info "Invalid trade side"
                             {:type :validation-error
                              :field :side
                              :value side})))
          trade (create-trade side amount)]
      {:status 200 :body trade})
    (catch Exception e
      (log/error e "Trade request failed" (ex-data e))
      {:status 400
       :body {:error (ex-message e)
              :details (ex-data e)}})))

;; Validation approach (preferred)
(defn validate-trade-params
  [params]
  (cond
    (nil? (:side params))
    {:error "Missing trade side"}

    (not (pos? (:amount params)))
    {:error "Amount must be positive"}

    :else
    {:valid true :params params}))
```

**Practical Exercise:**
- Implement comprehensive API error handling
- Create validation layer for trading operations
- Build error recovery for WebSocket disconnections

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/server/routes.clj:50-100`

---

### Week 12: State Management with Atoms
**Video Title:** "Managing State: Atoms, Refs, and Agents"

**Topics:**
- Clojure's state model (identity vs value)
- `atom` for uncoordinated state
- `swap!` and `reset!`
- `add-watch` for state observation
- `ref` and STM (Software Transactional Memory)
- `agent` for asynchronous state
- Choosing the right reference type

**Little Trader Examples:**
```clojure
;; From ui/state.cljs - client-side state
(defonce app-state
  (atom {:bars []
         :bricks []
         :signals []
         :trades []
         :open-trade nil
         :connection-status :disconnected
         :mode :paper}))

;; State updates
(defn add-bar! [bar]
  (swap! app-state update :bars conj bar))

(defn set-open-trade! [trade]
  (swap! app-state assoc :open-trade trade))

;; Watch for changes
(add-watch app-state :logger
  (fn [key ref old-state new-state]
    (when (not= (:open-trade old-state) (:open-trade new-state))
      (log/info "Trade changed:" (:open-trade new-state)))))
```

**Practical Exercise:**
- Build a trading state manager
- Implement position tracking with atoms
- Create account balance updates with watches

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/ui/state.cljs`

---

### Week 13: Asynchronous Programming with core.async
**Video Title:** "Concurrent Clojure: Channels, Go Blocks, and Pipelines"

**Topics:**
- Channels: `chan`, `buffer`, `sliding-buffer`, `dropping-buffer`
- `>!`, `<!`, `>!!`, `<!!` operations
- `go` blocks for lightweight threads
- `thread` for blocking operations
- `alt!` and `alts!` for selection
- Pipelines: `pipeline`, `pipeline-async`
- Transducers with channels

**Little Trader Examples:**
```clojure
;; From server/ws.clj - WebSocket message handling
(require '[clojure.core.async :as async :refer [go go-loop chan <! >! put! close!]])

(defonce broadcast-chan (chan (async/sliding-buffer 100)))

(defn start-broadcaster!
  "Start the broadcast loop for WebSocket messages."
  []
  (go-loop []
    (when-let [msg (<! broadcast-chan)]
      (doseq [client @connected-clients]
        (send-message! client msg))
      (recur))))

(defn publish-bar!
  "Publish a new bar to all subscribers."
  [bar]
  (put! broadcast-chan {:type :bar :data bar}))

;; Pipeline for processing bars
(defn start-processing-pipeline!
  [input-chan output-chan]
  (async/pipeline
    4  ; parallelism
    output-chan
    (comp
      (map normalize-bar)
      (filter valid-bar?)
      (map enrich-bar))
    input-chan))
```

**Practical Exercise:**
- Build a real-time price feed with channels
- Implement signal detection pipeline
- Create trade execution queue

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/server/ws.clj`

---

### Week 14: Java Interop
**Video Title:** "Clojure Meets Java: Interoperability Deep Dive"

**Topics:**
- Calling Java methods: `.method`, `(. obj method)`
- Static methods and fields
- Creating Java objects with `new`
- Implementing interfaces with `reify`
- `proxy` for extending classes
- Type hints for performance
- Working with Java collections

**Little Trader Examples:**
```clojure
;; Date/time handling
(import '[java.time Instant ZonedDateTime ZoneId]
        '[java.time.format DateTimeFormatter])

(defn timestamp->datetime
  "Convert Unix timestamp to formatted datetime string."
  [timestamp]
  (-> (Instant/ofEpochMilli timestamp)
      (.atZone (ZoneId/of "UTC"))
      (.format (DateTimeFormatter/ofPattern "yyyy-MM-dd HH:mm:ss"))))

;; Math operations with type hints
(defn ^double calculate-volatility
  "Calculate price volatility with type hints for performance."
  [^doubles prices]
  (let [n (alength prices)
        mean (/ (areduce prices i sum 0.0 (+ sum (aget prices i))) n)
        variance (/ (areduce prices i sum 0.0
                      (+ sum (Math/pow (- (aget prices i) mean) 2)))
                   n)]
    (Math/sqrt variance)))
```

**Practical Exercise:**
- Implement date/time utilities for trading
- Create high-performance numeric calculations
- Interface with Java trading libraries

---

### Week 15: Transducers
**Video Title:** "Transducers: Composable Algorithmic Transformations"

**Topics:**
- What are transducers and why they matter
- Building transducers: `map`, `filter`, `take`, etc.
- Composing transducers with `comp`
- `transduce` and `into`
- `sequence` for lazy transduction
- Stateful transducers
- Performance benefits

**Little Trader Examples:**
```clojure
;; Transducer for processing market data
(def bar-processing-xf
  (comp
    (filter #(pos? (:bar/volume %)))           ; Remove zero-volume bars
    (map #(assoc % :bar/typical-price          ; Add typical price
            (/ (+ (:bar/high %) (:bar/low %) (:bar/close %)) 3)))
    (partition-all 14)                          ; Group for ATR calculation
    (map calculate-atr-for-window)))

;; Apply to different contexts
(transduce bar-processing-xf conj [] raw-bars)        ; Eager
(sequence bar-processing-xf raw-bars)                  ; Lazy
(into [] bar-processing-xf raw-bars)                   ; Into vector

;; With core.async channels
(async/pipeline 4 output-chan bar-processing-xf input-chan)
```

**Practical Exercise:**
- Build market data processing pipeline
- Implement efficient trade filtering
- Create reusable indicator calculations

---

### Week 16: Macros - Extending the Language
**Video Title:** "Clojure Macros: Code that Writes Code"

**Topics:**
- Macros vs functions (compile-time vs runtime)
- `defmacro` basics
- Quote and syntax-quote: `'` vs `` ` ``
- Unquote and unquote-splicing: `~` and `~@`
- Gensym for hygiene: `#`
- `macroexpand` for debugging
- Common macro patterns
- When NOT to use macros

**Little Trader Examples:**
```clojure
;; Timing macro for performance measurement
(defmacro with-timing
  "Execute body and log execution time."
  [label & body]
  `(let [start# (System/currentTimeMillis)
         result# (do ~@body)
         elapsed# (- (System/currentTimeMillis) start#)]
     (log/info ~label "took" elapsed# "ms")
     result#))

;; Usage
(with-timing "Brick generation"
  (generate-all-bricks bars 100))

;; Validation macro
(defmacro defvalidated
  "Define a function with automatic parameter validation."
  [name params spec & body]
  `(defn ~name ~params
     (when-not (s/valid? ~spec ~(first params))
       (throw (ex-info "Invalid parameters"
                      {:spec ~spec
                       :explanation (s/explain-str ~spec ~(first params))})))
     ~@body))
```

**Practical Exercise:**
- Create a trading DSL with macros
- Build configuration macros
- Implement logging/tracing macros

---

## Module 3: Web Development with Fulcro (Weeks 17-26)

### Week 17: Introduction to Fulcro
**Video Title:** "Fulcro Fundamentals: Full-Stack Clojure Web Apps"

**Topics:**
- What is Fulcro and why use it
- Client-server architecture overview
- Normalized client database
- Component model
- EQL (EDN Query Language) introduction
- Setting up a Fulcro project

**Little Trader Examples:**
- Overview of `/home/user/little-trader/src/com/little_trader/ui/client.cljs`
- Understanding the application structure

**Practical Exercise:**
- Set up a Fulcro development environment
- Create your first Fulcro component
- Understand the app database structure

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/ui/client.cljs`
- `/home/user/little-trader/shadow-cljs.edn`

---

### Week 18: Fulcro Components (defsc)
**Video Title:** "Building UI Components with defsc"

**Topics:**
- `defsc` macro deep dive
- Query, ident, and initial-state
- Props destructuring
- Component composition
- CSS integration
- React lifecycle hooks

**Little Trader Examples:**
```clojure
;; From ui/app.cljs - dashboard component
(defsc TradingDashboard [this {:keys [bars bricks signals open-trade]}]
  {:query [:bars :bricks :signals :open-trade]
   :ident (fn [] [:component/id :trading-dashboard])
   :initial-state {}}
  (div {:className "trading-dashboard"}
    (Header {:mode (:mode @app-state)
             :connection (:connection-status @app-state)})
    (Chart {:bars bars :bricks bricks})
    (TradePanel {:open-trade open-trade})
    (SignalList {:signals signals})))
```

**Practical Exercise:**
- Build account summary component
- Create trade history table
- Implement signal notification list

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/ui/app.cljs`

---

### Week 19: Fulcro RAD - Rapid Application Development
**Video Title:** "Fulcro RAD: Auto-Generated CRUD Forms and Reports"

**Topics:**
- RAD philosophy and architecture
- Attribute definitions
- Automatic form generation
- Report components
- RAD controls and rendering
- Customizing RAD components

**Little Trader Examples:**
```clojure
;; From model/trade.cljc - RAD attribute definitions
(defattr id :trade/id :uuid
  {ao/identity? true
   ao/schema :production})

(defattr status :trade/status :keyword
  {ao/identities #{:trade/id}
   ao/enumerated-values #{:pending :open :closed :halted}
   ao/schema :production})

(defattr side :trade/side :keyword
  {ao/identities #{:trade/id}
   ao/enumerated-values #{:long :short}
   ao/schema :production})

(defattr entry-price :trade/entry-price :double
  {ao/identities #{:trade/id}
   ao/schema :production})
```

**Practical Exercise:**
- Define attributes for Account entity
- Generate CRUD forms for strategies
- Build a trade report with filtering

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/model/trade.cljc`
- `/home/user/little-trader/src/com/little_trader/model/account.cljc`

---

### Week 20: Pathom and Resolvers
**Video Title:** "Pathom 3: Graph-Based Data Resolution"

**Topics:**
- EQL query language
- Resolver concept and implementation
- `defresolver` macro
- Input/output specs
- Resolver composition
- Batch resolvers for performance
- Error handling in resolvers

**Little Trader Examples:**
```clojure
;; From components/resolvers.clj
(defresolver account-metrics-resolver
  [{:keys [db]} {:account/keys [id]}]
  {::pc/input #{:account/id}
   ::pc/output [:account/total-pnl :account/win-rate :account/trade-count]}
  (let [trades (d/q '[:find [(pull ?t [*]) ...]
                      :in $ ?account-id
                      :where
                      [?t :trade/account ?a]
                      [?a :account/id ?account-id]
                      [?t :trade/status :closed]]
                    db id)
        metrics (calculate-metrics trades)]
    {:account/total-pnl (:total-pnl metrics)
     :account/win-rate (:win-rate metrics)
     :account/trade-count (count trades)}))
```

**Practical Exercise:**
- Create resolvers for strategy metrics
- Implement market data resolvers
- Build computed field resolvers

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/components/resolvers.clj`
- `/home/user/little-trader/src/com/little_trader/components/parser.clj`

---

### Week 21: Mutations and State Changes
**Video Title:** "Fulcro Mutations: Changing State Correctly"

**Topics:**
- `defmutation` macro
- Optimistic updates
- Remote mutations
- Action, remote, and result-action sections
- Transaction processing
- Error handling in mutations
- UI refresh after mutations

**Little Trader Examples:**
```clojure
;; Trade mutation
(defmutation open-trade
  [{:keys [signal-id side amount]}]
  (action [{:keys [state]}]
    ;; Optimistic update
    (swap! state assoc-in [:component/id :trading-dashboard :open-trade]
           {:trade/status :pending
            :trade/side side
            :trade/amount amount}))
  (remote [env] true)  ;; Send to server
  (result-action [{:keys [result state]}]
    ;; Update with server response
    (let [trade (:trade (get-in result [:body `open-trade]))]
      (swap! state assoc-in [:component/id :trading-dashboard :open-trade] trade))))
```

**Practical Exercise:**
- Implement trade open/close mutations
- Create strategy update mutation
- Build account deposit/withdrawal

---

### Week 22: Routing in Fulcro
**Video Title:** "Navigation and Routing with Fulcro Router"

**Topics:**
- `defrouter` for dynamic routing
- Route targets
- URL-based routing
- Programmatic navigation
- Route parameters
- Nested routing
- Loading states

**Little Trader Examples:**
```clojure
;; From ui/client.cljs - main router
(defrouter MainRouter [this {:keys [current-route]}]
  {:router-targets [TradingDashboard AccountList TradeList StrategyList]})

(defsc Root [this {:keys [router]}]
  {:query [{:router (comp/get-query MainRouter)}]
   :initial-state {:router {}}}
  (div {:className "app-container"}
    (Navigation {:current-route (comp/current-route this)})
    (MainRouter router)))
```

**Practical Exercise:**
- Set up multi-page navigation
- Implement route-based data loading
- Create parameterized routes for trade details

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/ui/client.cljs`

---

### Week 23: ClojureScript and React Integration
**Video Title:** "ClojureScript + React: Building Modern UIs"

**Topics:**
- ClojureScript compilation
- React 18 integration
- Hooks in ClojureScript
- DOM interaction
- Event handling
- Third-party React component integration

**Little Trader Examples:**
```clojure
;; From ui/chart.cljs - TradingView integration
(defn Chart [{:keys [bars bricks]}]
  (let [chart-ref (react/useRef nil)
        chart-instance (react/useRef nil)]

    (react/useEffect
      (fn []
        (when (and @chart-ref (nil? @chart-instance))
          (reset! chart-instance
            (createChart @chart-ref
              #js {:width 800
                   :height 400
                   :layout #js {:background {:color "#131722"}
                               :textColor "#d1d4dc"}})))
        (fn [] ;; Cleanup
          (when @chart-instance
            (.remove @chart-instance))))
      #js [])

    (div {:ref chart-ref :className "chart-container"})))
```

**Practical Exercise:**
- Integrate TradingView charts
- Build custom React hooks in CLJS
- Create reusable UI components

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/ui/chart.cljs`

---

### Week 24: WebSocket Real-Time Communication
**Video Title:** "Real-Time Data: WebSockets in Clojure"

**Topics:**
- WebSocket protocol overview
- Server-side: http-kit WebSocket
- Client-side: js/WebSocket
- Message serialization (Transit)
- Connection management
- Heartbeat/ping-pong
- Reconnection strategies

**Little Trader Examples:**
```clojure
;; Server: server/ws.clj
(defn websocket-handler
  [request]
  (http-kit/with-channel request channel
    (swap! connected-clients conj channel)
    (http-kit/on-close channel
      (fn [status]
        (swap! connected-clients disj channel)))
    (http-kit/on-receive channel
      (fn [message]
        (let [msg (transit/read (transit/reader :json) message)]
          (handle-message channel msg))))))

;; Client: ui/state.cljs
(defn connect-websocket! []
  (let [ws (js/WebSocket. "ws://localhost:8080/ws")]
    (set! (.-onmessage ws)
      (fn [event]
        (let [msg (transit/read (transit/reader :json) (.-data event))]
          (handle-server-message msg))))
    (reset! websocket-atom ws)))
```

**Practical Exercise:**
- Implement live price streaming
- Build real-time signal notifications
- Create trade status updates

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/server/ws.clj`

---

### Week 25: REST API Development
**Video Title:** "Building REST APIs with Ring and Reitit"

**Topics:**
- Ring middleware stack
- Reitit routing
- Request/response handling
- Parameter coercion
- Content negotiation
- API documentation (OpenAPI/Swagger)
- CORS configuration

**Little Trader Examples:**
```clojure
;; From server/core.clj
(def routes
  [["/api"
    ["/bars/:symbol" {:get {:handler get-bars-handler
                            :parameters {:path {:symbol string?}
                                        :query {:limit int?}}}}]
    ["/bricks/:symbol" {:get {:handler get-bricks-handler
                              :parameters {:path {:symbol string?}
                                          :query {:brick-size int?}}}}]
    ["/signals" {:get {:handler get-signals-handler}}]
    ["/trades" {:get {:handler get-trades-handler}
               :post {:handler create-trade-handler
                      :parameters {:body {:side keyword?
                                         :amount number?}}}}]
    ["/metrics" {:get {:handler get-metrics-handler}}]]
   ["/health" {:get {:handler health-handler}}]
   ["/ws" {:get {:handler websocket-handler}}]])
```

**Practical Exercise:**
- Create comprehensive trading API
- Implement request validation
- Add API documentation

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/server/core.clj`
- `/home/user/little-trader/src/com/little_trader/server/routes.clj`

---

### Week 26: Full-Stack Integration Project
**Video Title:** "Bringing It Together: Full-Stack Trading Dashboard"

**Topics:**
- End-to-end data flow
- Frontend-backend integration
- Error handling across the stack
- Performance optimization
- Development workflow
- Debugging techniques

**Project:**
Build a complete feature: Strategy Configuration Editor
- RAD form for strategy parameters
- Server-side validation
- Real-time preview of brick generation
- Save and apply to live trading

---

## Module 4: Database with Datomic (Weeks 27-32)

### Week 27: Introduction to Datomic
**Video Title:** "Datomic: The Immutable Database for Clojure"

**Topics:**
- Datomic architecture and philosophy
- Facts and time in Datomic
- Entities, attributes, values (EAV)
- Database setup and connection
- Schema definition
- Transaction basics

**Little Trader Examples:**
```clojure
;; From data/db.clj
(defstate conn
  :start (let [uri (config/get-in [:datomic :uri])]
           (d/create-database uri)
           (let [conn (d/connect uri)]
             (install-schema! conn)
             conn))
  :stop (d/release conn))
```

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/data/db.clj`

---

### Week 28: Schema Design
**Video Title:** "Designing Datomic Schemas for Trading Systems"

**Topics:**
- Attribute types
- Cardinality (one vs many)
- Uniqueness constraints
- Component entities
- Reference attributes
- Schema evolution

**Little Trader Examples:**
```clojure
;; From data/schema.clj
(def trade-schema
  [{:db/ident :trade/id
    :db/valueType :db.type/uuid
    :db/cardinality :db.cardinality/one
    :db/unique :db.unique/identity}
   {:db/ident :trade/status
    :db/valueType :db.type/keyword
    :db/cardinality :db.cardinality/one}
   {:db/ident :trade/account
    :db/valueType :db.type/ref
    :db/cardinality :db.cardinality/one}])
```

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/data/schema.clj`

---

### Week 29: Datalog Queries
**Video Title:** "Mastering Datalog: Querying Datomic"

**Topics:**
- Query anatomy (:find, :where, :in)
- Pattern matching
- Logic variables
- Predicates and functions
- Aggregates
- Rules for reuse
- Pull expressions

**Little Trader Examples:**
```clojure
;; Complex query for trade analysis
(d/q '[:find (pull ?t [:trade/id :trade/side :trade/pnl-percent
                       {:trade/account [:account/name]}])
       :in $ ?min-pnl
       :where
       [?t :trade/status :closed]
       [?t :trade/pnl-percent ?pnl]
       [(> ?pnl ?min-pnl)]]
     db 0.05)

;; Aggregation query
(d/q '[:find ?side (count ?t) (sum ?pnl) (avg ?pnl)
       :where
       [?t :trade/status :closed]
       [?t :trade/side ?side]
       [?t :trade/pnl ?pnl]]
     db)
```

**Practical Exercise:**
- Query trade history with filters
- Calculate account metrics
- Build performance reports

---

### Week 30: Transactions and History
**Video Title:** "Time Travel: Datomic History and As-Of Queries"

**Topics:**
- Transaction processing
- Transaction functions
- Database values and time
- `as-of` for point-in-time queries
- `history` for audit trails
- `since` for incremental changes

**Little Trader Examples:**
```clojure
;; Query trade state at specific time
(let [db-at-trade-open (d/as-of db trade-open-timestamp)]
  (d/pull db-at-trade-open '[*] [:trade/id trade-id]))

;; Get all changes to a trade
(d/q '[:find ?tx ?attr ?val ?added
       :in $ ?trade-id
       :where
       [?t :trade/id ?trade-id]
       [?t ?attr ?val ?tx ?added]]
     (d/history db) trade-id)
```

**Practical Exercise:**
- Implement trade audit trail
- Build equity curve from history
- Create point-in-time reports

---

### Week 31: Datomic with Fulcro RAD
**Video Title:** "RAD + Datomic: Automatic CRUD Operations"

**Topics:**
- RAD database adapters
- Automatic schema generation
- Save middleware
- Delete middleware
- Optimistic locking
- Validation integration

**Little Trader Examples:**
```clojure
;; From components/database.clj
(defstate datomic-databases
  :start
  (let [config (rad-datomic/config)]
    (rad-datomic/start config)))

;; RAD save middleware
(def save-middleware
  (->
    (rad-datomic/wrap-datomic-save)
    (wrap-validation)))
```

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/components/database.clj`

---

### Week 32: Advanced Datomic Patterns
**Video Title:** "Production Datomic: Performance and Patterns"

**Topics:**
- Indexing strategies
- Query optimization
- Caching patterns
- Peer vs Client mode
- Backup and restore
- Production deployment

**Practical Exercise:**
- Optimize slow queries
- Implement efficient pagination
- Set up database backups

---

## Module 5: Testing and Quality (Weeks 33-38)

### Week 33: Unit Testing with clojure.test
**Video Title:** "Testing Clojure: From Basics to Best Practices"

**Topics:**
- `deftest` and `testing`
- Assertions: `is`, `are`, `thrown?`
- Fixtures: `use-fixtures`
- Test organization
- Running tests with Kaocha
- Test coverage

**Little Trader Examples:**
```clojure
;; From renko_test.clj
(deftest true-range-test
  (testing "true range without previous close"
    (let [bar {:bar/high 100 :bar/low 90}]
      (is (= 10 (renko/true-range bar nil)))))

  (testing "true range with gap up"
    (let [bar {:bar/high 110 :bar/low 105}
          prev-close 100]
      (is (= 10 (renko/true-range bar prev-close))))))
```

**Reference Files:**
- `/home/user/little-trader/test/com/little_trader/domain/renko_test.clj`

---

### Week 34: Property-Based Testing
**Video Title:** "Generative Testing with test.check"

**Topics:**
- Properties vs examples
- Generators: `gen/int`, `gen/string`, etc.
- Custom generators
- `prop/for-all`
- Shrinking for minimal failures
- Finding edge cases automatically

**Little Trader Examples:**
```clojure
(require '[clojure.test.check :as tc]
         '[clojure.test.check.generators :as gen]
         '[clojure.test.check.properties :as prop])

;; Generator for valid bars
(def gen-bar
  (gen/let [open (gen/double* {:min 1 :max 100000})
            close (gen/double* {:min 1 :max 100000})
            high-offset (gen/double* {:min 0 :max 1000})
            low-offset (gen/double* {:min 0 :max 1000})]
    {:bar/open open
     :bar/close close
     :bar/high (+ (max open close) high-offset)
     :bar/low (- (min open close) low-offset)
     :bar/volume (rand 1000)
     :bar/mts (System/currentTimeMillis)}))

;; Property: brick generation always produces valid bricks
(def brick-generation-valid
  (prop/for-all [bars (gen/vector gen-bar 10 100)
                 brick-size (gen/choose 10 500)]
    (let [bricks (renko/generate-all-bricks bars brick-size)]
      (every? #(s/valid? ::renko/brick %) bricks))))
```

**Practical Exercise:**
- Write generators for trading data
- Test signal detection properties
- Verify trade calculation invariants

---

### Week 35: Integration Testing
**Video Title:** "Testing the Full Stack: Integration Tests"

**Topics:**
- Testing with real databases
- API endpoint testing
- WebSocket testing
- Test containers
- Fixtures for complex setup
- Mocking external services

**Little Trader Examples:**
```clojure
(deftest api-integration-test
  (with-test-system [system (test-system)]
    (testing "GET /api/bars returns OHLCV data"
      (let [response (http/get "http://localhost:8080/api/bars/BTC-USD")]
        (is (= 200 (:status response)))
        (is (vector? (:body response)))
        (is (every? #(s/valid? ::bar %) (:body response)))))

    (testing "POST /api/trades creates a trade"
      (let [response (http/post "http://localhost:8080/api/trades"
                      {:body {:side :long :amount 0.1}})]
        (is (= 201 (:status response)))
        (is (uuid? (get-in response [:body :trade/id])))))))
```

---

### Week 36: Test-Driven Development
**Video Title:** "TDD in Clojure: Red, Green, Refactor"

**Topics:**
- TDD workflow
- Writing failing tests first
- Minimal implementation
- Refactoring safely
- REPL-driven TDD
- When to use TDD

**Project:**
Implement a new trading feature using TDD:
- Pyramiding (adding to winning positions)

---

### Week 37: Performance Testing
**Video Title:** "Benchmarking Clojure: Criterium and Profiling"

**Topics:**
- Criterium for microbenchmarks
- JVM warm-up considerations
- Profiling with VisualVM
- Memory profiling
- Identifying bottlenecks
- Optimization techniques

**Little Trader Examples:**
```clojure
(require '[criterium.core :refer [bench quick-bench]])

;; Benchmark brick generation
(quick-bench
  (renko/generate-all-bricks sample-bars 100))

;; Compare implementations
(let [bars (load-bars "BTC-USD" 10000)]
  (println "Original implementation:")
  (bench (generate-bricks-v1 bars 100))
  (println "Optimized implementation:")
  (bench (generate-bricks-v2 bars 100)))
```

---

### Week 38: Code Quality and Linting
**Video Title:** "Clean Clojure: Linting, Formatting, and Best Practices"

**Topics:**
- clj-kondo for linting
- cljfmt for formatting
- Eastwood for static analysis
- Code review practices
- Documentation standards
- Idiomatic Clojure

**Practical Exercise:**
- Set up linting for little-trader
- Configure pre-commit hooks
- Fix all linting issues

---

## Module 6: DevOps and Deployment (Weeks 39-44)

### Week 39: Docker for Clojure Applications
**Video Title:** "Containerizing Clojure: Docker Deep Dive"

**Topics:**
- Multi-stage Docker builds
- JVM configuration for containers
- Image size optimization
- Docker Compose for development
- Environment configuration
- Health checks

**Little Trader Examples:**
```dockerfile
# From Dockerfile
FROM clojure:temurin-21-tools-deps AS backend
WORKDIR /app
COPY deps.edn ./
RUN clojure -P
COPY . .
RUN clojure -T:build uber

FROM eclipse-temurin:21-jre-alpine AS runtime
COPY --from=backend /app/target/little-trader.jar /app/
EXPOSE 8080
HEALTHCHECK --interval=30s CMD wget -q --spider http://localhost:8080/health
CMD ["java", "-jar", "/app/little-trader.jar"]
```

**Reference Files:**
- `/home/user/little-trader/Dockerfile`
- `/home/user/little-trader/docker-compose.yml`

---

### Week 40: CI/CD with GitHub Actions
**Video Title:** "Automated Pipelines: CI/CD for Clojure"

**Topics:**
- GitHub Actions workflow
- Test automation
- Build artifacts
- Docker image publishing
- Deployment triggers
- Secrets management

**Example Workflow:**
```yaml
name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: DeLaGuardo/setup-clojure@12.1
        with:
          cli: latest
      - run: clojure -M:test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/user/little-trader:latest
```

---

### Week 41: Kubernetes Fundamentals
**Video Title:** "Kubernetes for Clojure: Deploying to the Cloud"

**Topics:**
- Kubernetes concepts (Pods, Services, Deployments)
- Writing manifests
- ConfigMaps and Secrets
- Resource limits
- Liveness and readiness probes
- Horizontal Pod Autoscaler

**Example Manifests:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: little-trader
spec:
  replicas: 3
  selector:
    matchLabels:
      app: little-trader
  template:
    spec:
      containers:
      - name: app
        image: little-trader:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATOMIC_URI
          valueFrom:
            secretKeyRef:
              name: little-trader-secrets
              key: datomic-uri
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

---

### Week 42: Observability - Logging
**Video Title:** "Production Logging: Structured Logs with Timbre"

**Topics:**
- Structured logging principles
- Timbre configuration
- Log levels and filtering
- JSON log format for aggregation
- Correlation IDs for tracing
- Log aggregation (ELK, Loki)

**Little Trader Examples:**
```clojure
(require '[taoensso.timbre :as log])

;; Structured logging
(log/info {:event :trade-opened
           :trade-id trade-id
           :side side
           :amount amount
           :price entry-price
           :correlation-id request-id})

;; JSON appender for production
(timbre/merge-config!
  {:appenders {:json (json-appender {:stream :std-out})}})
```

---

### Week 43: Observability - Metrics
**Video Title:** "Metrics and Monitoring: Prometheus + Grafana"

**Topics:**
- Metrics types (counters, gauges, histograms)
- Prometheus client library
- Exposing metrics endpoint
- Grafana dashboards
- Alerting rules
- Trading-specific metrics

**Little Trader Examples:**
```clojure
(require '[iapetos.core :as prometheus])

(def registry
  (-> (prometheus/collector-registry)
      (prometheus/register
        (prometheus/counter :trades/total {:labels [:side :status]})
        (prometheus/gauge :positions/open {:labels [:side]})
        (prometheus/histogram :trade/pnl-percent
          {:labels [:side] :buckets [-0.1 -0.05 0 0.05 0.1 0.2]}))))

;; Record metrics
(prometheus/inc (registry :trades/total {:side "long" :status "opened"}))
(prometheus/observe (registry :trade/pnl-percent {:side "long"}) 0.025)
```

---

### Week 44: Observability - Tracing
**Video Title:** "Distributed Tracing: Following Requests Across Services"

**Topics:**
- OpenTelemetry introduction
- Spans and traces
- Context propagation
- Jaeger setup
- Instrumenting Clojure applications
- Analyzing trace data

**Practical Exercise:**
- Add tracing to API endpoints
- Trace WebSocket message flow
- Create custom spans for business operations

---

## Module 7: Trading Domain (Weeks 45-48)

### Week 45: Technical Indicators
**Video Title:** "Technical Analysis in Clojure: Building Indicators"

**Topics:**
- Moving averages (SMA, EMA, DEMA)
- RSI (Relative Strength Index)
- ATR (Average True Range)
- Bollinger Bands
- MACD
- Custom indicator framework

**Little Trader Examples:**
```clojure
;; From signals.clj - DEMA calculation
(defn calculate-ema
  "Calculate Exponential Moving Average."
  [prices period]
  (let [k (/ 2 (inc period))]
    (reduce
      (fn [ema price]
        (+ (* k price) (* (- 1 k) ema)))
      (first prices)
      (rest prices))))

(defn calculate-dema
  "Calculate Double Exponential Moving Average."
  [prices period]
  (let [ema1 (calculate-ema prices period)
        ema2 (calculate-ema [ema1] period)]  ; Simplified
    (- (* 2 ema1) ema2)))
```

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/domain/signals.clj:100-150`

---

### Week 46: Renko Charts Deep Dive
**Video Title:** "Renko Charts: Implementation and Trading Strategies"

**Topics:**
- Renko chart theory
- Brick size selection
- ATR-based dynamic sizing
- Pattern recognition
- Trend identification
- Noise filtering properties

**Little Trader Examples:**
- Full walkthrough of `renko.clj`
- Brick classification algorithms
- Signal detection patterns

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/domain/renko.clj`

---

### Week 47: Risk Management
**Video Title:** "Risk Management: Protecting Your Capital"

**Topics:**
- Position sizing (Kelly Criterion, fixed fractional)
- Stop-loss strategies
- Trailing stops (fixed, ATR-based, multi-level)
- Risk/reward ratios
- Maximum drawdown limits
- Portfolio heat

**Little Trader Examples:**
```clojure
;; From risk.clj - multi-level trailing stop
(def default-trailing-ranges
  [{:profit-threshold 0.01 :trail-percent 0.005}   ; 1% profit -> 0.5% trail
   {:profit-threshold 0.02 :trail-percent 0.01}    ; 2% profit -> 1% trail
   {:profit-threshold 0.03 :trail-percent 0.015}]) ; 3% profit -> 1.5% trail

(defn find-active-trailing-range
  "Find the applicable trailing range based on current profit."
  [profit-percent trailing-ranges]
  (->> trailing-ranges
       (filter #(<= (:profit-threshold %) profit-percent))
       (sort-by :profit-threshold >)
       first))
```

**Reference Files:**
- `/home/user/little-trader/src/com/little_trader/domain/risk.clj`

---

### Week 48: Backtesting Framework
**Video Title:** "Backtesting: Validating Trading Strategies"

**Topics:**
- Backtesting architecture
- Historical data handling
- Event simulation
- Performance metrics (Sharpe, Sortino, Calmar)
- Walk-forward analysis
- Avoiding overfitting

**Practical Exercise:**
- Build a backtesting engine
- Implement performance metrics
- Create strategy comparison reports

---

## Module 8: Capstone Project (Weeks 49-52)

### Week 49: Project Planning
**Video Title:** "Capstone: Planning Your Trading Feature"

**Topics:**
- Feature specification
- Architecture design
- Task breakdown
- Testing strategy
- Deployment plan

**Project Options:**
1. Multi-Asset Support (trade multiple pairs)
2. Strategy Optimizer (parameter tuning)
3. Alert System (Telegram/Discord notifications)
4. Portfolio Management (multiple strategies)

---

### Week 50: Implementation Sprint 1
**Video Title:** "Capstone: Building the Core Feature"

**Focus:** Core domain logic and database schema

---

### Week 51: Implementation Sprint 2
**Video Title:** "Capstone: Frontend and Integration"

**Focus:** UI components and API integration

---

### Week 52: Deployment and Showcase
**Video Title:** "Capstone: From Code to Production"

**Topics:**
- Final testing
- Production deployment
- Demo and walkthrough
- Course retrospective
- Next steps

---

# YEAR 2: PAID WORKSHOPS
## "Advanced Clojure Mastery"

---

## Workshop 1: Q1 - Distributed Systems with Kafka
**Duration:** 4 weeks (8 sessions, 2 hours each)
**Price:** $499

### Week 1: Apache Kafka Fundamentals
- Kafka architecture (brokers, topics, partitions)
- Producers and consumers in Clojure
- Message serialization (Transit, JSON, Avro)
- Consumer groups and scaling

### Week 2: Event-Driven Trading Architecture
- Order events (placed, filled, cancelled)
- Market data streaming
- Trade execution events
- Event sourcing patterns

### Week 3: Stream Processing with Kafka Streams
- KStreams and KTables
- Windowed aggregations
- Stateful processing
- Real-time analytics

### Week 4: Production Kafka
- Cluster setup and management
- Monitoring and alerting
- Disaster recovery
- Performance tuning

**Project:** Build a real-time trade aggregation service that processes thousands of trades per second and calculates live metrics.

---

## Workshop 2: Q2 - Machine Learning for Trading
**Duration:** 4 weeks (8 sessions, 2 hours each)
**Price:** $599

### Week 1: ML Fundamentals in Clojure
- Feature engineering for trading
- Scicloj ecosystem overview
- Data preparation with tablecloth
- Model training with smile.clj

### Week 2: Predictive Models
- Price direction prediction
- Volatility forecasting
- Signal strength estimation
- Model evaluation metrics

### Week 3: Deep Learning with Cortex
- Neural network basics
- LSTM for time series
- Model training and inference
- GPU acceleration

### Week 4: ML in Production
- Model serving
- A/B testing strategies
- Model monitoring and drift detection
- Continuous retraining pipelines

**Project:** Build a signal confidence predictor that uses ML to enhance trading signals with probability scores.

---

## Workshop 3: Q3 - Advanced Fulcro Patterns
**Duration:** 4 weeks (8 sessions, 2 hours each)
**Price:** $499

### Week 1: State Machines with Fulcro
- UISM (UI State Machines)
- Complex form workflows
- Multi-step processes
- Error recovery

### Week 2: Advanced RAD Customization
- Custom form controls
- Complex report builders
- Plugin development
- Performance optimization

### Week 3: Real-Time Applications
- WebSocket integration patterns
- Optimistic UI updates
- Conflict resolution
- Offline support

### Week 4: Testing Fulcro Applications
- Component testing
- Integration testing
- End-to-end testing with Playwright
- Visual regression testing

**Project:** Build a strategy builder wizard with complex multi-step forms, real-time validation, and live strategy preview.

---

## Workshop 4: Q4 - Production Architecture
**Duration:** 4 weeks (8 sessions, 2 hours each)
**Price:** $699

### Week 1: Microservices with Clojure
- Service decomposition
- API gateway patterns
- Service discovery
- Inter-service communication

### Week 2: Advanced Kubernetes
- Helm charts for Clojure apps
- GitOps with ArgoCD
- Service mesh (Istio)
- Multi-cluster deployment

### Week 3: High Availability
- Database replication
- Failover strategies
- Circuit breakers
- Chaos engineering

### Week 4: Security and Compliance
- Authentication (OAuth2, JWT)
- Authorization (RBAC)
- Secrets management (Vault)
- Audit logging

**Project:** Deploy little-trader as a production-grade system with full observability, auto-scaling, and zero-downtime deployments.

---

## Embedded Product Tracks

These short tracks map directly to the app and docs so students can jump from theory to action.

### Track 1: First-Class REPL

- Goal: learn to inspect and validate the running system.
- Practice: read state, test a pure function, inspect a resolver result.
- Docs: [Embedded Course and Manual](/Users/victorinacio/4coders/little-trader/docs/EMBEDDED_COURSE_AND_MANUAL.md), [Clojure REPL First Class](/Users/victorinacio/4coders/little-trader/docs/CLOJURE_REPL_FIRST_CLASS.md)

### Track 2: UI Copilot and Rules Builder

- Goal: use the LLM as a suggestion-only partner for explanations and patch planning.
- Practice: review a strategy rule, ask for a patch plan, inspect guardrails.
- Docs: [UI Copilot and Rules](/Users/victorinacio/4coders/little-trader/docs/UI_COPILOT_AND_RULES.md)

### Track 3: Architecture Literacy

- Goal: explain the system as layers, loops, and contracts.
- Practice: draw the runtime data flow, identify trust boundaries, locate failure modes.
- Docs: [Architecture Visual Guide](/Users/victorinacio/4coders/little-trader/docs/ARCHITECTURE_VISUAL_GUIDE.md), [C4 Architecture](/Users/victorinacio/4coders/little-trader/docs/C4_ARCHITECTURE.md)

### Track 4: News and Data Curation

- Goal: understand how raw data becomes reliable strategy context.
- Practice: normalize items, filter stale noise, deduplicate headlines, build digests.
- Docs: [News and Data Crawlers](/Users/victorinacio/4coders/little-trader/docs/NEWS_AND_DATA_CRAWLERS.md)

### Track 5: Developer Ergonomics

- Goal: keep local, cloud, and MCP workflows aligned.
- Practice: run smoke tests, compare local and cloud settings, use dual REPL access.
- Docs: [Developer Ergonomics](/Users/victorinacio/4coders/little-trader/docs/DEVELOPER_ERGONOMICS.md)

# APPENDIX

## A. File Reference Index

| Topic | Little Trader File |
|-------|-------------------|
| Project Entry | `/home/user/little-trader/src/com/little_trader/main.clj` |
| Configuration | `/home/user/little-trader/src/com/little_trader/config.clj` |
| Renko Logic | `/home/user/little-trader/src/com/little_trader/domain/renko.clj` |
| Signal Detection | `/home/user/little-trader/src/com/little_trader/domain/signals.clj` |
| Trade Management | `/home/user/little-trader/src/com/little_trader/domain/trades.clj` |
| Risk Management | `/home/user/little-trader/src/com/little_trader/domain/risk.clj` |
| HTTP Server | `/home/user/little-trader/src/com/little_trader/server/core.clj` |
| REST Routes | `/home/user/little-trader/src/com/little_trader/server/routes.clj` |
| WebSocket | `/home/user/little-trader/src/com/little_trader/server/ws.clj` |
| Database | `/home/user/little-trader/src/com/little_trader/data/db.clj` |
| Schema | `/home/user/little-trader/src/com/little_trader/data/schema.clj` |
| RAD Database | `/home/user/little-trader/src/com/little_trader/components/database.clj` |
| Pathom Parser | `/home/user/little-trader/src/com/little_trader/components/parser.clj` |
| Resolvers | `/home/user/little-trader/src/com/little_trader/components/resolvers.clj` |
| UI Client | `/home/user/little-trader/src/com/little_trader/ui/client.cljs` |
| UI App | `/home/user/little-trader/src/com/little_trader/ui/app.cljs` |
| Charts | `/home/user/little-trader/src/com/little_trader/ui/chart.cljs` |
| Client State | `/home/user/little-trader/src/com/little_trader/ui/state.cljs` |
| RAD Models | `/home/user/little-trader/src/com/little_trader/model/*.cljc` |
| Tests | `/home/user/little-trader/test/com/little_trader/domain/*.clj` |
| Docker | `/home/user/little-trader/Dockerfile` |
| Dependencies | `/home/user/little-trader/deps.edn` |
| Shadow-cljs | `/home/user/little-trader/shadow-cljs.edn` |
| Embedded Manual | `/Users/victorinacio/4coders/little-trader/docs/EMBEDDED_COURSE_AND_MANUAL.md` |
| Architecture Guide | `/Users/victorinacio/4coders/little-trader/docs/ARCHITECTURE_VISUAL_GUIDE.md` |
| C4 Architecture | `/Users/victorinacio/4coders/little-trader/docs/C4_ARCHITECTURE.md` |
| News Curation | `/Users/victorinacio/4coders/little-trader/docs/NEWS_AND_DATA_CRAWLERS.md` |
| Developer Ergonomics | `/Users/victorinacio/4coders/little-trader/docs/DEVELOPER_ERGONOMICS.md` |

## B. External Resources

### Official Documentation
- [Clojure.org](https://clojure.org/)
- [ClojureScript.org](https://clojurescript.org/)
- [Fulcro Book](https://book.fulcrologic.com/)
- [Datomic Documentation](https://docs.datomic.com/)
- [Shadow-cljs User Guide](https://shadow-cljs.github.io/docs/UsersGuide.html)

### Community Resources
- [Clojure Slack](https://clojurians.slack.com/)
- [ClojureVerse](https://clojureverse.org/)
- [Clojure Reddit](https://reddit.com/r/clojure)

### Video Content
- [ClojureTV YouTube](https://www.youtube.com/user/ClojureTV)
- [Lambda Island](https://lambdaisland.com/)
- [PurelyFunctional.tv](https://purelyfunctional.tv/)

## C. Recommended Reading

1. **"Clojure for the Brave and True"** - Daniel Higginbotham
2. **"Programming Clojure"** - Alex Miller, Stuart Halloway
3. **"The Joy of Clojure"** - Michael Fogus, Chris Houser
4. **"Web Development with Clojure"** - Dmitri Sotnikov
5. **"Mastering Clojure Macros"** - Colin Jones

## D. Course Completion Certificates

Upon completion of each module, students receive:
- **Year 1 Free Course:** Digital badge and completion certificate
- **Year 2 Workshops:** Professional certificate with project portfolio

---

*Course last updated: November 2024*
*Version: 1.0.0*
