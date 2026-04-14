# Video Scripts and Lesson Plans
## Detailed Production Guide for YouTube Series

---

## Video Production Standards

### Format
- **Duration:** 15-25 minutes per video
- **Resolution:** 1080p minimum, 4K preferred
- **Audio:** Clear narration with code-focused visuals
- **Captions:** Auto-generated + manual review
- **Thumbnail:** Consistent branding with topic preview

### Structure (Each Video)
1. **Intro** (1-2 min): Hook + topic overview
2. **Theory** (3-5 min): Concept explanation
3. **Code Demo** (8-12 min): Little Trader implementation
4. **Practice** (2-3 min): Exercise introduction
5. **Summary** (1-2 min): Key takeaways + next video preview

---

# WEEK 1: Introduction to Clojure and Functional Programming

## Video Script

### INTRO (0:00 - 2:00)

```
[SCREEN: Little Trader dashboard with live chart]

NARRATOR:
"What if I told you there's a programming language where bugs are
rarer, concurrent code is trivial, and you can modify running
applications without restarting them?

Welcome to Clojure - and over the next year, you'll master it by
building something real: a complete cryptocurrency trading system.

I'm [Instructor Name], and this is 'From Zero to Production:
Building Real Trading Systems with Clojure.'

By the end of this series, you'll have:
- Deep Clojure expertise
- A working trading system
- Full-stack web development skills
- DevOps and deployment knowledge

Let's start with WHY Clojure is perfect for financial systems."
```

### THEORY (2:00 - 7:00)

```
[SCREEN: Slide - "Why Clojure for Trading?"]

NARRATOR:
"Trading systems have unique requirements:

1. CORRECTNESS: A bug can cost real money. Clojure's immutable
   data structures eliminate entire categories of bugs.

2. CONCURRENCY: Market data streams in continuously. Clojure's
   state model makes concurrent code safe by default.

3. INTERACTIVITY: Markets change. Clojure's REPL lets you modify
   running systems without downtime.

4. PERFORMANCE: The JVM gives us battle-tested performance with
   access to Java's mature ecosystem.

Let's see what these look like in practice."

[SCREEN: Split - Mutable vs Immutable]

"In most languages, this is dangerous:"

[CODE PANEL - JavaScript]
let trade = {side: 'long', amount: 100};
processTrade(trade);
// Did processTrade modify trade? Who knows!

"In Clojure, data never changes:"

[CODE PANEL - Clojure]
(def trade {:side :long :amount 100})
(process-trade trade)
; trade is GUARANTEED to be unchanged

"This single property eliminates debugging sessions you'll never
have to have."
```

### CODE DEMO (7:00 - 18:00)

```
[SCREEN: Terminal + Editor side by side]

NARRATOR:
"Let's set up our development environment and explore Clojure's REPL.

First, install Clojure CLI tools. On Mac:"

[TERMINAL]
$ brew install clojure/tools/clojure

"On Linux:"

[TERMINAL]
$ curl -O https://download.clojure.org/install/linux-install.sh
$ chmod +x linux-install.sh
$ sudo ./linux-install.sh

"Now let's start a REPL - that's Read-Eval-Print-Loop:"

[TERMINAL]
$ clj
Clojure 1.11.1
user=>

"This is where the magic happens. Type an expression, get a result:"

user=> (+ 1 2 3)
6

user=> (* 10 20)
200

"Notice the parentheses come BEFORE the operator. This is Lisp
syntax - everything is a list, and the first element is the function."

[SCREEN: Anatomy of Clojure Expression]

(function arg1 arg2 arg3)
    │      │     │     │
    │      └─────┴─────┴── Arguments
    └── Function (always first)

"Let's look at our trading system. Clone the repository:"

[TERMINAL]
$ git clone https://github.com/your-org/little-trader
$ cd little-trader

"Open the main entry point:"

[EDITOR: main.clj]
(ns com.little-trader.main
  (:require
   [mount.core :as mount]
   [com.little-trader.config :as config]
   [taoensso.timbre :as log])
  (:gen-class))

"Let's break this down:

- `ns` declares a namespace - like a module or package
- `:require` imports other namespaces
- `:as` creates an alias (log instead of taoensso.timbre)
- `:gen-class` enables Java interop for the -main function

Now look at this function:"

(defn -main
  "Start the Little Trader application."
  [& args]
  (log/info "Starting Little Trader...")
  (mount/start)
  (log/info "System started successfully"))

"`defn` defines a function:
- `-main` is the name (dash prefix is Java convention)
- The string is a docstring (documentation)
- `[& args]` means 'accept any number of arguments'
- The body contains the expressions to execute

Let's start the system and see it work:"

[TERMINAL]
$ clj -M:dev

[REPL OUTPUT]
Starting REPL...
user=> (require '[com.little-trader.main :as main])
user=> (main/-main)
INFO - Starting Little Trader...
INFO - System started successfully
```

### PRACTICE (18:00 - 21:00)

```
[SCREEN: Exercise slide]

NARRATOR:
"Now it's your turn. Here's your practice exercise:

EXERCISE 1.1: REPL Exploration

1. Start a REPL with `clj`
2. Calculate: (100 * 42000) - (99 * 41900)
   This simulates: buy 100 BTC at 42000, sell 99 at 41900
3. Try nested expressions: What's (* 0.1 (- 42500 42000))?
   This is P&L for 0.1 BTC with 500 price increase

EXERCISE 1.2: Project Exploration

1. Clone little-trader
2. Find and read these files:
   - deps.edn (dependencies)
   - src/com/little_trader/main.clj (entry point)
   - src/com/little_trader/config.clj (configuration)
3. Can you identify what libraries we're using?

Post your answers in the comments - I'll review the best ones
in next week's video!"
```

### SUMMARY (21:00 - 23:00)

```
[SCREEN: Key takeaways slide]

NARRATOR:
"Let's recap what we learned:

1. Clojure runs on the JVM - access to Java ecosystem
2. Immutable data - values never change after creation
3. REPL-driven development - instant feedback
4. Prefix notation - (function arg1 arg2)
5. Namespaces organize code like modules

Next week, we dive deep into Clojure's data structures - the
foundation of everything we'll build. You'll learn why a simple
map is more powerful than most objects in other languages.

Hit subscribe, enable notifications, and I'll see you next week.

Happy coding!"

[END SCREEN: Subscribe + Next video preview]
```

---

# WEEK 2: Data Structures - The Heart of Clojure

## Video Script

### INTRO (0:00 - 1:30)

```
[SCREEN: Code showing complex nested data structure]

NARRATOR:
"Data is the foundation of every program. In Clojure, we have
four core data structures that will handle 99% of your needs.

Today you'll learn:
- Lists, Vectors, Maps, and Sets
- When to use each one
- How they map to trading concepts
- Why immutability is actually efficient

Let's start with the most important one for us: the map."
```

### THEORY (1:30 - 6:00)

```
[SCREEN: The Four Data Structures]

NARRATOR:
"Here are Clojure's core collections:

VECTORS - Ordered, indexed access
[1 2 3 4 5]
Like arrays. Use when order matters and you need random access.

LISTS - Ordered, sequential access
'(1 2 3 4 5)
Like linked lists. Use for code (all Clojure code is lists!).

MAPS - Key-value associations
{:name "BTC" :price 42000}
Like dictionaries/objects. Use for structured data - this is your bread and butter.

SETS - Unique values, fast membership
#{:long :short}
Like mathematical sets. Use when uniqueness matters.

For trading, we'll use maps constantly. Look at this OHLCV bar:"

[CODE]
{:bar/open 42000.0
 :bar/high 42500.0
 :bar/low 41800.0
 :bar/close 42300.0
 :bar/volume 150.5
 :bar/mts 1699920000000}

"The :bar/ prefix is a namespace qualifier - it prevents key
collisions when combining data from different sources."
```

### CODE DEMO (6:00 - 17:00)

```
[SCREEN: REPL with trading data]

NARRATOR:
"Let's build trading data structures in the REPL.

First, a single price bar:"

user=> (def my-bar {:bar/open 42000.0
                    :bar/high 42500.0
                    :bar/low 41800.0
                    :bar/close 42300.0
                    :bar/volume 150.5})
#'user/my-bar

"Access values with keywords as functions:"

user=> (:bar/close my-bar)
42300.0

user=> (:bar/high my-bar)
42500.0

"Or use `get` with a default:"

user=> (get my-bar :bar/open)
42000.0

user=> (get my-bar :bar/missing "not found")
"not found"

"Now let's look at our actual model files:"

[EDITOR: model/bar.cljc]

(defattr open :bar/open :double
  {ao/identities #{:bar/id}
   ao/schema :production})

"This is Fulcro RAD - we'll cover it later. The key point:
:bar/open is a double (decimal number).

Now, a collection of bars - we use a vector:"

user=> (def bars [{:bar/open 42000 :bar/close 42100}
                  {:bar/open 42100 :bar/close 42200}
                  {:bar/open 42200 :bar/close 42050}])
#'user/bars

"Get the first bar:"

user=> (first bars)
{:bar/open 42000, :bar/close 42100}

"Get the last bar:"

user=> (last bars)
{:bar/open 42200, :bar/close 42050}

"Get a specific index:"

user=> (nth bars 1)
{:bar/open 42100, :bar/close 42200}

"Now here's the key insight - IMMUTABILITY:"

user=> (def updated-bar (assoc my-bar :bar/close 42400))
#'user/updated-bar

user=> (:bar/close updated-bar)
42400

user=> (:bar/close my-bar)
42300.0  ; UNCHANGED!

"`assoc` returns a NEW map. The original is untouched. This is
how Clojure achieves safety.

But isn't creating new copies expensive? No! Clojure uses
STRUCTURAL SHARING:"

[SCREEN: Diagram showing structural sharing]

"When you 'modify' a map, Clojure shares all unchanged parts
with the original. Only the changed path is new. This makes
immutability efficient.

Let's look at nested data - a Renko brick:"

[EDITOR: model/brick.cljc]

user=> (def brick {:brick/direction 1
                   :brick/open 42000
                   :brick/close 42100
                   :brick/type :forward
                   :brick/bar {:bar/open 42000
                               :bar/close 42100}})

"Access nested data with `get-in`:"

user=> (get-in brick [:brick/bar :bar/close])
42100

"Update nested data with `assoc-in`:"

user=> (assoc-in brick [:brick/bar :bar/volume] 100)
{:brick/direction 1,
 :brick/open 42000,
 :brick/close 42100,
 :brick/type :forward,
 :brick/bar {:bar/open 42000, :bar/close 42100, :bar/volume 100}}

"The original brick is still unchanged!"
```

### PRACTICE (17:00 - 20:00)

```
[SCREEN: Exercise slide]

NARRATOR:
"Practice exercises:

EXERCISE 2.1: Trade Data Structure
Create a map representing a trade with:
- :trade/id (a UUID)
- :trade/side (:long or :short)
- :trade/entry-price (number)
- :trade/amount (number)
- :trade/status (:open)

EXERCISE 2.2: Collection Operations
Given this vector of closes: [100 102 101 105 103]
1. Get the first price
2. Get the last price
3. Add a new price (106) to the end
4. Calculate the price change (last - first)

EXERCISE 2.3: Nested Updates
Given a trade map, use `assoc-in` to add exit data:
- :trade/exit-price
- :trade/exit-timestamp
- Calculate :trade/pnl

Solutions in the GitHub repo: exercises/week02/"
```

---

# WEEK 3: Functions - First-Class Citizens

## Lesson Plan

### Learning Objectives
- Define functions with `defn`
- Use anonymous functions
- Understand multiple arities
- Apply destructuring in parameters
- Write clear docstrings

### Key Concepts

1. **Function Definition**
```clojure
(defn function-name
  "Docstring explaining what it does."
  [param1 param2]
  ;; body - last expression is return value
  (+ param1 param2))
```

2. **Anonymous Functions**
```clojure
;; Full form
(fn [x] (* x 2))

;; Short form
#(* % 2)

;; Multiple args
#(+ %1 %2)
```

3. **Multiple Arities**
```clojure
(defn greet
  ([] (greet "World"))
  ([name] (str "Hello, " name "!")))
```

4. **Destructuring**
```clojure
;; Map destructuring
(defn process-bar [{:keys [open high low close]}]
  (/ (+ high low close) 3))  ; typical price

;; With namespaced keys
(defn process-bar [{:bar/keys [open high low close]}]
  ...)
```

### Little Trader Examples

**True Range Calculation (renko.clj:15-25)**
```clojure
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

Teaching points:
- Docstring with formula
- Destructuring in `let`
- Conditional logic with `if`
- Java interop with `Math/abs`

**P&L Calculation (trades.clj)**
```clojure
(defn calculate-pnl
  "Calculate profit/loss for a trade."
  [entry-price exit-price amount side fees]
  (let [gross-pnl (case side
                    :long (* amount (- exit-price entry-price))
                    :short (* amount (- entry-price exit-price)))]
    (- gross-pnl fees)))
```

### Exercises

1. Write a function `typical-price` that takes a bar and returns (H+L+C)/3
2. Write a function `price-change-percent` that takes two prices and returns percentage change
3. Write a function `is-bullish?` that takes a bar and returns true if close > open

---

# WEEK 9: Recursion and Loop/Recur

## Detailed Code Walkthrough

### The Brick Generation Algorithm

This is one of the most important algorithms in little-trader. Let's trace through it step by step.

**Location:** `/home/user/little-trader/src/com/little_trader/domain/renko.clj:180-220`

```clojure
(defn generate-all-bricks
  "Generate all Renko bricks from a sequence of bars.

   This is the main entry point for batch brick generation,
   used in backtesting mode.

   Algorithm:
   1. Start with first bar as initial brick
   2. For each subsequent bar:
      a. Calculate price movement from current brick
      b. If movement exceeds brick-size, generate new brick(s)
      c. Update current brick reference
   3. Return all generated bricks

   Parameters:
   - bars: sequence of OHLCV bars
   - brick-size: size of each brick in price units

   Returns:
   - Vector of bricks, each with :brick/direction, :brick/open, :brick/close"
  [bars brick-size]
  (when (seq bars)
    (loop [remaining-bars (rest bars)           ; Bars left to process
           current-brick (first-brick (first bars) brick-size)  ; Active brick
           all-bricks [current-brick]]          ; Accumulator
      (if (empty? remaining-bars)
        all-bricks                              ; Base case: return result
        (let [bar (first remaining-bars)
              new-bricks (get-new-bricks-from-ohlcv
                          current-brick bar brick-size)]
          (recur
            (rest remaining-bars)               ; Reduce problem size
            (or (last new-bricks) current-brick) ; Update current
            (into all-bricks new-bricks)))))))  ; Add to accumulator
```

### Trace Through Example

```
Input: bars = [{:close 100} {:close 150} {:close 200} {:close 180}]
       brick-size = 50

Iteration 0 (Initial):
  remaining-bars: [{:close 150} {:close 200} {:close 180}]
  current-brick:  {:direction 1, :open 100, :close 150}
  all-bricks:     [{:direction 1, :open 100, :close 150}]

Iteration 1:
  bar: {:close 150}
  new-bricks: [] (no movement)
  remaining-bars: [{:close 200} {:close 180}]
  current-brick: {:direction 1, :open 100, :close 150}
  all-bricks: [{:direction 1, :open 100, :close 150}]

Iteration 2:
  bar: {:close 200}
  new-bricks: [{:direction 1, :open 150, :close 200}]
  remaining-bars: [{:close 180}]
  current-brick: {:direction 1, :open 150, :close 200}
  all-bricks: [{:d 1, :o 100, :c 150} {:d 1, :o 150, :c 200}]

Iteration 3:
  bar: {:close 180}
  new-bricks: [] (not enough movement for reversal)
  remaining-bars: []
  current-brick: {:direction 1, :open 150, :close 200}
  all-bricks: [{:d 1, :o 100, :c 150} {:d 1, :o 150, :c 200}]

Base case reached, return all-bricks
```

### Why Loop/Recur?

```clojure
;; This would blow the stack for large datasets:
(defn generate-bricks-recursive [bars brick-size]
  (if (empty? (rest bars))
    [(first-brick (first bars) brick-size)]
    (let [previous-bricks (generate-bricks-recursive (butlast bars) brick-size)
          ...])))

;; loop/recur provides tail-call optimization:
;; - Fixed stack usage regardless of input size
;; - Processes 100,000 bars without issues
```

---

# WEEK 13: Asynchronous Programming with core.async

## Detailed WebSocket Implementation

### Server-Side WebSocket (server/ws.clj)

```clojure
(ns com.little-trader.server.ws
  "WebSocket server for real-time data streaming.

   Architecture:
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
   │  Market     │────▶│  Broadcast  │────▶│  Connected  │
   │  Data Feed  │     │  Channel    │     │  Clients    │
   └─────────────┘     └─────────────┘     └─────────────┘

   - Market data arrives and is put on broadcast channel
   - Broadcaster loop reads from channel
   - Each message is sent to all subscribed clients"
  (:require
   [clojure.core.async :as async :refer [go go-loop chan <! >! put! close!]]
   [org.httpkit.server :as http-kit]
   [taoensso.timbre :as log]))

;; Connected clients atom
(defonce connected-clients (atom #{}))

;; Broadcast channel with sliding buffer (drops old messages if slow)
(defonce broadcast-chan (chan (async/sliding-buffer 100)))

;; Subscription tracking
(defonce subscriptions (atom {}))  ; {client-id #{:bars :bricks :signals}}

(defn send-message!
  "Send a message to a WebSocket client."
  [client msg]
  (try
    (http-kit/send! client (transit/write msg))
    (catch Exception e
      (log/warn "Failed to send to client" (ex-message e))
      (swap! connected-clients disj client))))

(defn start-broadcaster!
  "Start the broadcast loop.

   This is a go-loop that:
   1. Waits for messages on broadcast-chan
   2. Filters clients by subscription
   3. Sends to each subscribed client"
  []
  (go-loop []
    (when-let [{:keys [type data] :as msg} (<! broadcast-chan)]
      (let [channel-key (keyword type)]
        (doseq [client @connected-clients
                :let [client-subs (get @subscriptions client #{})]
                :when (contains? client-subs channel-key)]
          (send-message! client msg)))
      (recur))))

(defn handle-subscribe
  "Handle subscription request from client."
  [client {:keys [channel]}]
  (swap! subscriptions update client (fnil conj #{}) (keyword channel))
  (log/info "Client subscribed to" channel))

(defn handle-unsubscribe
  "Handle unsubscription request from client."
  [client {:keys [channel]}]
  (swap! subscriptions update client disj (keyword channel)))

(defn handle-message
  "Route incoming WebSocket messages."
  [client msg]
  (case (:type msg)
    :subscribe (handle-subscribe client msg)
    :unsubscribe (handle-unsubscribe client msg)
    :ping (send-message! client {:type :pong})
    (log/warn "Unknown message type" (:type msg))))

(defn websocket-handler
  "HTTP-Kit WebSocket handler."
  [request]
  (http-kit/with-channel request channel
    ;; On connect
    (swap! connected-clients conj channel)
    (log/info "Client connected. Total:" (count @connected-clients))

    ;; On disconnect
    (http-kit/on-close channel
      (fn [status]
        (swap! connected-clients disj channel)
        (swap! subscriptions dissoc channel)
        (log/info "Client disconnected. Total:" (count @connected-clients))))

    ;; On message
    (http-kit/on-receive channel
      (fn [raw-message]
        (let [msg (transit/read raw-message)]
          (handle-message channel msg))))))

;; Public API for publishing data
(defn publish-bar! [bar]
  (put! broadcast-chan {:type :bar :data bar}))

(defn publish-brick! [brick]
  (put! broadcast-chan {:type :brick :data brick}))

(defn publish-signal! [signal]
  (put! broadcast-chan {:type :signal :data signal}))

(defn publish-trade! [trade]
  (put! broadcast-chan {:type :trade :data trade}))
```

### Client-Side WebSocket (ui/state.cljs)

```clojure
(ns com.little-trader.ui.state
  "Client-side state management with WebSocket integration."
  (:require
   [cognitect.transit :as transit]))

(defonce app-state
  (atom {:bars []
         :bricks []
         :signals []
         :trades []
         :open-trade nil
         :connection-status :disconnected
         :subscriptions #{}}))

(defonce websocket (atom nil))

;; Transit reader/writer for WebSocket messages
(def transit-reader (transit/reader :json))
(def transit-writer (transit/writer :json))

(defn handle-bar-message [data]
  (swap! app-state update :bars conj data))

(defn handle-brick-message [data]
  (swap! app-state update :bricks conj data))

(defn handle-signal-message [data]
  (swap! app-state update :signals conj data))

(defn handle-trade-message [data]
  (if (= :open (:trade/status data))
    (swap! app-state assoc :open-trade data)
    (swap! app-state
           (fn [s]
             (-> s
                 (assoc :open-trade nil)
                 (update :trades conj data))))))

(defn handle-server-message [msg]
  (case (:type msg)
    :bar (handle-bar-message (:data msg))
    :brick (handle-brick-message (:data msg))
    :signal (handle-signal-message (:data msg))
    :trade (handle-trade-message (:data msg))
    :pong nil  ; Heartbeat response
    (js/console.warn "Unknown message type:" (:type msg))))

(defn send-message! [msg]
  (when-let [ws @websocket]
    (when (= 1 (.-readyState ws))  ; OPEN
      (.send ws (transit/write transit-writer msg)))))

(defn subscribe! [channel]
  (send-message! {:type :subscribe :channel channel})
  (swap! app-state update :subscriptions conj channel))

(defn unsubscribe! [channel]
  (send-message! {:type :unsubscribe :channel channel})
  (swap! app-state update :subscriptions disj channel))

(defn connect-websocket!
  "Connect to WebSocket server with automatic reconnection."
  []
  (let [ws-url (str "ws://" js/location.host "/ws")
        ws (js/WebSocket. ws-url)]

    (set! (.-onopen ws)
      (fn [_]
        (swap! app-state assoc :connection-status :connected)
        ;; Auto-subscribe to all channels
        (subscribe! :bars)
        (subscribe! :bricks)
        (subscribe! :signals)
        (subscribe! :trades)
        ;; Start heartbeat
        (js/setInterval #(send-message! {:type :ping}) 30000)))

    (set! (.-onmessage ws)
      (fn [event]
        (let [msg (transit/read transit-reader (.-data event))]
          (handle-server-message msg))))

    (set! (.-onclose ws)
      (fn [_]
        (swap! app-state assoc :connection-status :disconnected)
        ;; Reconnect after 5 seconds
        (js/setTimeout connect-websocket! 5000)))

    (set! (.-onerror ws)
      (fn [error]
        (js/console.error "WebSocket error:" error)
        (swap! app-state assoc :connection-status :error)))

    (reset! websocket ws)))

(defn disconnect-websocket! []
  (when-let [ws @websocket]
    (.close ws)
    (reset! websocket nil)))
```

---

# WEEK 19: Fulcro RAD - Rapid Application Development

## Complete RAD Attribute Tutorial

### Understanding RAD Attributes

RAD attributes are declarative definitions that automatically generate:
- Database schemas
- CRUD forms
- Reports and tables
- Validation rules
- UI controls

### Anatomy of a RAD Attribute

```clojure
(defattr attribute-name :namespace/attribute-key :type
  {;; Required options
   ao/identities #{:entity/id}      ; Which entity owns this
   ao/schema :production            ; Schema target

   ;; Optional: for identity attributes
   ao/identity? true                ; This is a primary key

   ;; Optional: for enums
   ao/enumerated-values #{:val1 :val2 :val3}

   ;; Optional: for references
   ao/target :other-entity/id       ; Reference target
   ao/cardinality :one              ; or :many

   ;; Optional: UI customization
   ao/required? true
   fo/label "Display Label"
   fo/field-style :pick-one         ; Dropdown for enums

   ;; Optional: validation
   ao/valid? (fn [v] (pos? v))})
```

### Complete Trade Entity Example

**File:** `/home/user/little-trader/src/com/little_trader/model/trade.cljc`

```clojure
(ns com.little-trader.model.trade
  "RAD attribute definitions for Trade entity."
  (:require
   [com.fulcrologic.rad.attributes :as attr :refer [defattr]]
   [com.fulcrologic.rad.attributes-options :as ao]
   [com.fulcrologic.rad.form-options :as fo]
   #?(:clj [com.little-trader.data.schema :as schema])))

;; Primary key
(defattr id :trade/id :uuid
  {ao/identity? true
   ao/schema :production
   fo/label "Trade ID"})

;; Status enum
(defattr status :trade/status :keyword
  {ao/identities #{:trade/id}
   ao/schema :production
   ao/enumerated-values #{:pending :open :closed :halted}
   fo/label "Status"
   fo/field-style :pick-one})

;; Side enum
(defattr side :trade/side :keyword
  {ao/identities #{:trade/id}
   ao/schema :production
   ao/enumerated-values #{:long :short}
   fo/label "Side"
   fo/field-style :pick-one
   ao/required? true})

;; Numeric values
(defattr entry-price :trade/entry-price :double
  {ao/identities #{:trade/id}
   ao/schema :production
   fo/label "Entry Price"
   ao/required? true
   ao/valid? (fn [v] (and (number? v) (pos? v)))})

(defattr exit-price :trade/exit-price :double
  {ao/identities #{:trade/id}
   ao/schema :production
   fo/label "Exit Price"})

(defattr amount :trade/amount :double
  {ao/identities #{:trade/id}
   ao/schema :production
   fo/label "Amount"
   ao/required? true
   ao/valid? (fn [v] (and (number? v) (pos? v)))})

(defattr pnl :trade/pnl :double
  {ao/identities #{:trade/id}
   ao/schema :production
   fo/label "P&L"
   fo/read-only? true})  ; Computed field

(defattr pnl-percent :trade/pnl-percent :double
  {ao/identities #{:trade/id}
   ao/schema :production
   fo/label "P&L %"
   fo/read-only? true})

;; Timestamps
(defattr entry-timestamp :trade/entry-timestamp :instant
  {ao/identities #{:trade/id}
   ao/schema :production
   fo/label "Entry Time"})

(defattr exit-timestamp :trade/exit-timestamp :instant
  {ao/identities #{:trade/id}
   ao/schema :production
   fo/label "Exit Time"})

;; References
(defattr account :trade/account :ref
  {ao/identities #{:trade/id}
   ao/schema :production
   ao/target :account/id
   ao/cardinality :one
   fo/label "Account"})

(defattr strategy :trade/strategy :ref
  {ao/identities #{:trade/id}
   ao/schema :production
   ao/target :strategy/id
   ao/cardinality :one
   fo/label "Strategy"})

;; Attribute list for registration
(def attributes
  [id status side entry-price exit-price amount
   pnl pnl-percent entry-timestamp exit-timestamp
   account strategy])
```

### Generated Form Component

RAD automatically generates forms from attributes:

```clojure
(ns com.little-trader.ui.trade-form
  (:require
   [com.fulcrologic.fulcro.components :as comp :refer [defsc]]
   [com.fulcrologic.rad.form :as form]
   [com.fulcrologic.rad.form-options :as fo]
   [com.little-trader.model.trade :as trade]))

(form/defsc-form TradeForm [this props]
  {fo/id trade/id
   fo/attributes [trade/side
                  trade/entry-price
                  trade/amount
                  trade/account
                  trade/strategy]
   fo/route-prefix "trade"
   fo/title "Trade Entry"
   fo/layout [[:trade/side :trade/amount]
              [:trade/entry-price]
              [:trade/account :trade/strategy]]})
```

---

# WORKSHOP 1: Q1 - Distributed Systems with Kafka

## Week 1 Deep Dive: Kafka Producer for Trading Events

### Project Structure

```
src/
└── com/little_trader/
    └── kafka/
        ├── config.clj       ; Kafka configuration
        ├── producer.clj     ; Event producers
        ├── consumer.clj     ; Event consumers
        └── schemas.clj      ; Event schemas (Avro)
```

### Producer Implementation

```clojure
(ns com.little-trader.kafka.producer
  "Kafka producer for trading events.

   Event Types:
   - trade.opened - New trade initiated
   - trade.closed - Trade completed
   - trade.halted - Trade stopped by risk management
   - signal.detected - Trading signal generated
   - bar.received - New market data bar"
  (:require
   [clojure.spec.alpha :as s]
   [cognitect.transit :as transit])
  (:import
   [org.apache.kafka.clients.producer KafkaProducer ProducerRecord]
   [org.apache.kafka.common.serialization StringSerializer ByteArraySerializer]))

;; Specs for events
(s/def ::event-type #{:trade.opened :trade.closed :trade.halted
                      :signal.detected :bar.received})
(s/def ::timestamp pos-int?)
(s/def ::correlation-id uuid?)
(s/def ::payload map?)

(s/def ::event
  (s/keys :req-un [::event-type ::timestamp ::payload]
          :opt-un [::correlation-id]))

;; Producer configuration
(def producer-config
  {"bootstrap.servers" (System/getenv "KAFKA_BOOTSTRAP_SERVERS" "localhost:9092")
   "key.serializer" StringSerializer
   "value.serializer" ByteArraySerializer
   "acks" "all"                    ; Wait for all replicas
   "retries" 3                     ; Retry on failure
   "linger.ms" 1                   ; Batch for 1ms
   "batch.size" 16384              ; Batch size in bytes
   "compression.type" "snappy"})   ; Compress messages

(defonce producer (atom nil))

(defn start-producer!
  "Initialize the Kafka producer."
  []
  (reset! producer (KafkaProducer. producer-config)))

(defn stop-producer!
  "Close the Kafka producer."
  []
  (when-let [p @producer]
    (.close p)
    (reset! producer nil)))

(defn serialize-event
  "Serialize event to Transit JSON bytes."
  [event]
  (let [out (java.io.ByteArrayOutputStream. 4096)
        writer (transit/writer out :json)]
    (transit/write writer event)
    (.toByteArray out)))

(defn topic-for-event
  "Determine topic based on event type."
  [event-type]
  (case event-type
    (:trade.opened :trade.closed :trade.halted) "trading.trades"
    :signal.detected "trading.signals"
    :bar.received "market.bars"
    "trading.events"))

(defn publish-event!
  "Publish an event to Kafka.

   Parameters:
   - event: Map with :event-type, :timestamp, :payload
   - opts: Optional {:key partition-key, :callback fn}

   Returns:
   - Future containing RecordMetadata on success"
  ([event]
   (publish-event! event {}))
  ([event {:keys [key callback]}]
   {:pre [(s/valid? ::event event)]}
   (let [topic (topic-for-event (:event-type event))
         partition-key (or key (str (random-uuid)))
         value (serialize-event event)
         record (ProducerRecord. topic partition-key value)]
     (if callback
       (.send @producer record callback)
       (.send @producer record)))))

;; Convenience functions
(defn publish-trade-opened!
  "Publish trade opened event."
  [trade]
  (publish-event!
   {:event-type :trade.opened
    :timestamp (System/currentTimeMillis)
    :correlation-id (:trade/id trade)
    :payload trade}
   {:key (str (:trade/account trade))}))

(defn publish-trade-closed!
  "Publish trade closed event."
  [trade]
  (publish-event!
   {:event-type :trade.closed
    :timestamp (System/currentTimeMillis)
    :correlation-id (:trade/id trade)
    :payload trade}
   {:key (str (:trade/account trade))}))

(defn publish-signal!
  "Publish signal detected event."
  [signal]
  (publish-event!
   {:event-type :signal.detected
    :timestamp (System/currentTimeMillis)
    :payload signal}
   {:key (:signal/symbol signal)}))

(defn publish-bar!
  "Publish market data bar."
  [bar]
  (publish-event!
   {:event-type :bar.received
    :timestamp (System/currentTimeMillis)
    :payload bar}
   {:key (:bar/symbol bar)}))
```

### Consumer Implementation

```clojure
(ns com.little-trader.kafka.consumer
  "Kafka consumer for processing trading events."
  (:require
   [clojure.core.async :as async :refer [go-loop chan >! <! close!]]
   [cognitect.transit :as transit]
   [taoensso.timbre :as log])
  (:import
   [org.apache.kafka.clients.consumer KafkaConsumer ConsumerRecords]
   [org.apache.kafka.common.serialization StringDeserializer ByteArrayDeserializer]
   [java.time Duration]))

(def consumer-config
  {"bootstrap.servers" (System/getenv "KAFKA_BOOTSTRAP_SERVERS" "localhost:9092")
   "group.id" "little-trader-consumers"
   "key.deserializer" StringDeserializer
   "value.deserializer" ByteArrayDeserializer
   "auto.offset.reset" "earliest"
   "enable.auto.commit" false})      ; Manual commit for reliability

(defn deserialize-event
  "Deserialize Transit JSON bytes to event."
  [bytes]
  (let [in (java.io.ByteArrayInputStream. bytes)
        reader (transit/reader in :json)]
    (transit/read reader)))

(defn create-consumer
  "Create and configure a Kafka consumer."
  [topics]
  (let [consumer (KafkaConsumer. consumer-config)]
    (.subscribe consumer topics)
    consumer))

(defn start-consumer-loop!
  "Start a consumer loop that puts events on a channel.

   Parameters:
   - topics: Collection of topic names to subscribe
   - handler-fn: Function to call for each event

   Returns:
   - Control channel. Put :stop to terminate."
  [topics handler-fn]
  (let [control-chan (chan)
        consumer (create-consumer topics)]
    (go-loop []
      (let [[v ch] (async/alts! [control-chan (async/timeout 100)])]
        (if (and (= ch control-chan) (= v :stop))
          (do
            (log/info "Stopping consumer")
            (.close consumer))
          (do
            (try
              (let [records (.poll consumer (Duration/ofMillis 100))]
                (doseq [record records]
                  (let [event (deserialize-event (.value record))]
                    (handler-fn event)))
                (.commitSync consumer))
              (catch Exception e
                (log/error e "Error processing records")))
            (recur)))))
    control-chan))

;; Event handlers
(defmulti handle-event :event-type)

(defmethod handle-event :trade.opened
  [{:keys [payload correlation-id]}]
  (log/info "Trade opened" correlation-id)
  ;; Update metrics, notify clients, etc.
  )

(defmethod handle-event :trade.closed
  [{:keys [payload correlation-id]}]
  (log/info "Trade closed" correlation-id (:pnl payload))
  ;; Calculate metrics, update account balance, etc.
  )

(defmethod handle-event :signal.detected
  [{:keys [payload]}]
  (log/info "Signal detected" (:signal/type payload))
  ;; Evaluate for trading, notify UI, etc.
  )

(defmethod handle-event :default
  [event]
  (log/warn "Unknown event type" (:event-type event)))

;; Usage
(defn start-trade-consumer! []
  (start-consumer-loop!
   ["trading.trades" "trading.signals"]
   handle-event))
```

---

## Exercise Solutions Repository Structure

```
exercises/
├── week01/
│   ├── exercise_1_1.clj      ; REPL exploration
│   └── exercise_1_2.clj      ; Project exploration
├── week02/
│   ├── exercise_2_1.clj      ; Trade data structure
│   ├── exercise_2_2.clj      ; Collection operations
│   └── exercise_2_3.clj      ; Nested updates
├── week03/
│   ├── exercise_3_1.clj      ; typical-price function
│   └── ...
└── solutions/
    ├── week01_solutions.clj
    ├── week02_solutions.clj
    └── ...
```

---

*Production Guide Version 1.0 - November 2024*
