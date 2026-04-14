# Model Context Protocol (MCP) Development

**Integrating MCP Servers for Enhanced Claude Code Development**

> **New**: For cloud staging environment with live REPL access, see [CLOUD_MCP_STAGING.md](./CLOUD_MCP_STAGING.md)

## Table of Contents
1. [MCP Overview](#mcp-overview)
2. [MCP Server Architecture](#mcp-server-architecture)
3. [MCP Resources](#mcp-resources)
4. [MCP Tools](#mcp-tools)
5. [MCP Implementation](#mcp-implementation)
6. [Integration with Claude Code](#integration-with-claude-code)
7. [Cloud Staging Integration](#cloud-staging-integration)

---

## MCP Overview

### What is MCP?

The **Model Context Protocol (MCP)** is an open standard for connecting Claude (and other AI models) to external data sources, tools, and systems. It enables:

- **Context Injection**: Make information available to Claude without token overhead
- **Tool Integration**: Expose capabilities as structured tools
- **Bidirectional Communication**: Real-time data exchange
- **Security**: Explicit permissions and authentication
- **Standardization**: Interoperable across multiple AI providers

### Why MCP for Trading System?

MCP allows Claude to:
- Access live market data and trade history in real-time
- Execute domain-specific operations (run backtest, analyze trades)
- Query the codebase context (what files exist, what functions do)
- Integrate with external systems (GitHub, databases, monitoring)
- Maintain up-to-date context during long development sessions

### MCP Architecture Diagram

```
┌─────────────────────────────────────────┐
│          Claude Code (IDE)              │
│  - Editor with Claude assistance        │
│  - Task execution                       │
│  - Real-time collaboration              │
└────────────────┬────────────────────────┘
                 │
      ┌──────────▼──────────┐
      │   MCP Client        │
      │  (Claude Code)      │
      └──────────┬──────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼────┐  ┌───▼────┐  ┌───▼────┐
│ MCP    │  │ MCP    │  │ MCP    │
│Server1 │  │Server2 │  │Server3 │
│        │  │        │  │        │
│Codebase│  │Market  │  │Backtest│
│Context │  │Data    │  │Engine  │
└────────┘  └────────┘  └────────┘
```

---

## MCP Server Architecture

### Core MCP Server Components

```clojure
(ns com.little-trader.mcp.server
  (:require [clojure.core.async :as async]
            [cheshire.core :as json]))

;; MCP Protocol Message Types
(def ^:const MESSAGE_TYPES {
  :request "request"
  :response "response"
  :notification "notification"
  :error "error"
})

;; MCP Resource Types
(def ^:const RESOURCE_TYPES {
  :text "text/plain"
  :json "application/json"
  :markdown "text/markdown"
  :trading-data "application/x-trading+json"
})

;; MCP Tool Types
(def ^:const TOOL_TYPES {
  :bash-execute "bash"
  :clojure-eval "clojure"
  :query-db "database"
  :run-backtest "backtest"
  :analyze-trade "analysis"
})
```

### MCP Server Interface

```clojure
(defprotocol MCPServer
  "MCP Server interface for Claude integration"

  (initialize [this])
  "Initialize the MCP server"

  (get-resources [this])
  "Return list of available resources"

  (read-resource [this resource-id])
  "Read a specific resource by ID"

  (list-tools [this])
  "Return list of available tools"

  (call-tool [this tool-name args])
  "Execute a tool with arguments"

  (subscribe-resource [this resource-id callback])
  "Subscribe to resource changes")
```

---

## MCP Resources

### 1. Codebase Context Resource

**Resource ID**: `codebase://**`

Provides Claude with understanding of the codebase structure.

```clojure
(defn codebase-context-resource []
  {:id "codebase://root"
   :name "Renko Trader Codebase"
   :type "application/x-codebase+json"
   :description "Complete codebase structure and file organization"
   :data {
     :structure {
       :src {:path "src/com/little_trader"
             :description "Main source code"
             :subdirs [
               {:path "domain" :files ["renko.clj" "signals.clj" "trade.clj" "risk.clj"]}
               {:path "strategy" :files ["executor.clj" "backtest.clj" "modes.clj"]}
               {:path "data" :files ["db.clj" "schema.clj" "queries.clj"]}
               {:path "streams" :files ["kafka.clj" "events.clj"]}
               {:path "ui" :files ["dashboard.cljs" "charts.cljs"]}
               {:path "server" :files ["core.clj" "resolvers.clj" "mutations.clj"]}
               {:path "util" :files ["logger.clj" "math.clj" "time.clj" "spec.clj"]}
             ]}
       :test {:path "test/com/little_trader"
              :description "Test files"}
     }
     :modules {
       "domain.renko" {:exports ["generate-bricks" "classify-brick-type"]
                       :dependencies ["data" "util.math"]}
       "domain.signals" {:exports ["detect-renko-signals" "detect-risk-signals"]
                         :dependencies ["domain.renko" "util"]}
       "strategy.executor" {:exports ["run-strategy" "backtest-loop"]
                            :dependencies ["domain" "data" "streams"]}
     }
     :dependencies [
       "[org.clojure/clojure \"1.11.1\"]"
       "[com.fulcrologic/fulcro \"3.5.0\"]"
       "[com.datomic/datomic-pro \"1.0.6242\"]"
       "[clj-kafka \"0.6.1\"]"
     ]
   }})

(defn get-file-context [file-path]
  "Provide specific file context with type info"
  {:id (str "codebase://file/" file-path)
   :name file-path
   :type "text/clojure"
   :description (str "Source file: " file-path)
   :data {:content (read-file file-path)
          :size (file-size file-path)
          :last-modified (file-mtime file-path)
          :tests-related (find-related-tests file-path)}})
```

### 2. Trading Data Resource

**Resource ID**: `trading://data/*`

Real-time market and trade data.

```clojure
(defn trading-data-resource []
  {:id "trading://data/current"
   :name "Current Trading Data"
   :type "application/x-trading+json"
   :description "Real-time market data and active trades"
   :updates-every 1000  ;; milliseconds
   :data {
     :market {
       :symbol "BTC/USD"
       :current-price 42500.50
       :daily-volume 850000000
       :daily-high 43200
       :daily-low 41800
       :volatility-24h 2.4
       :trend :bullish}
     :bricks {
       :last-10 [
         {:mts 1234567890000 :close 42450 :direction 1 :type "forward_single"}
         {:mts 1234567880000 :close 42350 :direction -1 :type "backward_single"}
         ; ... more bricks
       ]
       :current-sequence [1 1 -1]
       :next-signal-probable "double_brick_start_long"}
     :trades {
       :open [{:id "trade-123" :entry-price 42000 :side :long
               :entry-timestamp 1234567800000 :current-pnl 500 :status :open}]
       :recent-closed [
         {:id "trade-122" :entry 41500 :exit 42200 :side :long
          :pnl 700 :pnl-percent 1.69 :duration 45}
       ]
       :statistics {
         :total-trades 256
         :win-rate 0.54
         :profit-factor 2.1
         :avg-win 250
         :avg-loss 120}}
     :performance {
       :today {:trades 8 :pnl 1240 :win-rate 0.625}
       :this-week {:trades 32 :pnl 5600 :win-rate 0.531}
       :this-month {:trades 128 :pnl 18900 :win-rate 0.547}}}})

(defn subscribe-to-trades [callback]
  "Subscribe to trade updates via Kafka"
  (let [consumer (kafka/create-consumer {:topics ["trades"]})]
    (async/go-loop []
      (when-let [trade (kafka/poll consumer)]
        (callback {:type :trade-update :data trade})
        (recur)))))
```

### 3. Schema & API Resource

**Resource ID**: `schema://api`

Database schema and available queries.

```clojure
(defn schema-resource []
  {:id "schema://api"
   :name "API Schema"
   :type "application/x-schema+json"
   :description "Database schema and available queries"
   :data {
     :entities {
       :bar {:attributes [
         {:name "id" :type "uuid" :cardinality "one"}
         {:name "mts" :type "long" :cardinality "one"}
         {:name "symbol" :type "string" :cardinality "one"}
         {:name "ohlcv" :type "tuple" :cardinality "one"}
         {:name "volume" :type "double" :cardinality "one"}]
             :description "OHLCV bar data"}
       :brick {:attributes [
         {:name "id" :type "uuid" :cardinality "one"}
         {:name "bar" :type "ref" :cardinality "one"}
         {:name "direction" :type "long" :cardinality "one"}
         {:name "type" :type "string" :cardinality "one"}]
               :description "Renko brick"}
       :trade {:attributes [
         {:name "id" :type "uuid" :cardinality "one"}
         {:name "entry-price" :type "double" :cardinality "one"}
         {:name "entry-amount" :type "double" :cardinality "one"}
         {:name "exit-price" :type "double" :cardinality "one"}
         {:name "pnl" :type "double" :cardinality "one"}
         {:name "status" :type "keyword" :cardinality "one"}]
              :description "Trade record"}}
     :queries {
       :open-trades {:description "Get all open trades"
                     :return-type "list<trade>"}
       :recent-signals {:description "Get last N signals"
                        :params [{:name "limit" :type "int"}]
                        :return-type "list<signal>"}
       :trade-stats {:description "Get trade performance metrics"
                     :return-type "map"}}}})
```

---

## MCP Tools

### 1. Backtest Execution Tool

```clojure
(defn backtest-tool []
  {:name "run-backtest"
   :description "Run a backtest on historical data with given parameters"
   :inputSchema {
     :type "object"
     :properties {
       :symbol {:type "string"
                :description "Trading pair (e.g., BTC/USD)"}
       :brick-size {:type "number"
                    :description "Renko brick size in USD"}
       :start-date {:type "string"
                    :description "Start date (YYYY-MM-DD)"}
       :end-date {:type "string"
                  :description "End date (YYYY-MM-DD)"}
       :one-brick-enabled {:type "boolean"
                          :description "Enable one-brick signals"}
       :double-brick-enabled {:type "boolean"
                             :description "Enable double-brick signals"}
       :stop-loss-percent {:type "number"
                          :description "Stop loss threshold (e.g., -0.02)"}
       :take-profit-enabled {:type "boolean"
                            :description "Enable take profit"}
     }
     :required ["symbol" "brick-size" "start-date" "end-date"]
   }
   :execute (fn [params]
     {:id (str "backtest-" (System/currentTimeMillis))
      :status "running"
      :result (backtest/backtest-loop params)})})

;; Example MCP Tool Call from Claude
#_{
  "tool_name": "run-backtest",
  "arguments": {
    "symbol": "BTC/USD",
    "brick_size": 100,
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "one_brick_enabled": true,
    "double_brick_enabled": true,
    "stop_loss_percent": -0.02,
    "take_profit_enabled": true
  }
}
```

### 2. Trade Analysis Tool

```clojure
(defn analyze-trade-tool []
  {:name "analyze-trade"
   :description "Analyze a specific trade with detailed breakdown"
   :inputSchema {
     :type "object"
     :properties {
       :trade-id {:type "string"
                 :description "Trade ID to analyze"}
       :include-similar {:type "boolean"
                        :description "Include similar trades comparison"}}
     :required ["trade-id"]}
   :execute (fn [{:keys [trade-id include-similar]}]
     (let [trade (d/query-trade db trade-id)
           similar (when include-similar
                    (d/find-similar-trades db trade))]
       {:trade trade
        :pnl-analysis (analyze-pnl trade)
        :risk-analysis (analyze-risk trade)
        :pattern-analysis (analyze-pattern trade)
        :similar-trades similar}))})
```

### 3. Code Search & Navigation Tool

```clojure
(defn code-search-tool []
  {:name "search-code"
   :description "Search codebase for functions, classes, and patterns"
   :inputSchema {
     :type "object"
     :properties {
       :query {:type "string"
              :description "Search term (function name, pattern, etc.)"}
       :scope {:type "string"
              :enum ["all" "domain" "strategy" "ui" "tests"]
              :description "Scope to search"}
       :type {:type "string"
             :enum ["function" "macro" "protocol" "defn"]
             :description "Type of definition to search"}
     }
     :required ["query"]}
   :execute (fn [{:keys [query scope type]}]
     (code/search-codebase query {:scope scope :type type}))})

;; Returns
#_{
  "results": [
    {
      "file": "src/com/little_trader/domain/renko.clj",
      "line": 42,
      "name": "renko-rule-ohlcv",
      "signature": "(renko-rule-ohlcv last-brick new-ohlcv brick-size)",
      "context": "Generate new bricks from OHLCV data"
    },
    {
      "file": "test/com/little_trader/domain/renko_test.clj",
      "line": 15,
      "name": "renko-rule-ohlcv"
      "type": "test"
    }
  ]
}
```

### 4. Execute Git Operations Tool

```clojure
(defn git-operations-tool []
  {:name "git-ops"
   :description "Execute git operations (status, diff, commit, etc.)"
   :inputSchema {
     :type "object"
     :properties {
       :operation {:type "string"
                  :enum ["status" "diff" "log" "commit" "push" "branch"]
                  :description "Git operation"}
       :args {:type "object"
             :description "Operation-specific arguments"}}
     :required ["operation"]}
   :execute (fn [{:keys [operation args]}]
     (git/execute-operation operation args))})
```

---

## MCP Implementation

### MCP Server Initialization

```clojure
(ns com.little-trader.mcp.core
  (:require [clojure.core.async :as async]
            [clojure.java.io :as io]
            [cheshire.core :as json]
            [com.little-trader.mcp.resources :as resources]
            [com.little-trader.mcp.tools :as tools]))

(defn initialize-mcp-server [config]
  "Initialize MCP server with all resources and tools"
  (let [server-state (atom {
    :resources (atom {})
    :tools (atom {})
    :subscriptions (atom {})
  })}]

    ;; Register resources
    (swap! (:resources @server-state) assoc
      "codebase://root" (resources/codebase-context-resource)
      "trading://data/current" (resources/trading-data-resource)
      "schema://api" (resources/schema-resource))

    ;; Register tools
    (swap! (:tools @server-state) assoc
      "run-backtest" (tools/backtest-tool)
      "analyze-trade" (tools/analyze-trade-tool)
      "search-code" (tools/code-search-tool)
      "git-ops" (tools/git-operations-tool))

    ;; Start resource update loops
    (start-resource-updates! server-state)

    server-state))

(defn start-resource-updates! [server-state]
  "Start background loops to update resources"
  ;; Update trading data every second
  (async/go-loop []
    (when-let [data (get-live-trading-data)]
      (update-resource server-state "trading://data/current" data)
      (notify-subscribers server-state "trading://data/current" data))
    (async/<! (async/timeout 1000))
    (recur))

  ;; Update codebase context when files change
  (start-file-watcher
    (fn [changed-files]
      (update-resource server-state "codebase://root"
        (resources/codebase-context-resource))
      (notify-subscribers server-state "codebase://root" changed-files))))

(defn handle-resource-read [server-state resource-id]
  "Handle Claude requesting a resource"
  (if-let [resource (get @(:resources @server-state) resource-id)]
    {:status "success" :data resource}
    {:status "error" :error (str "Resource not found: " resource-id)}))

(defn handle-tool-call [server-state tool-name args]
  "Handle Claude requesting a tool execution"
  (if-let [tool (get @(:tools @server-state) tool-name)]
    (try
      {:status "success" :result ((:execute tool) args)}
      (catch Exception e
        {:status "error" :error (.getMessage e)}))
    {:status "error" :error (str "Tool not found: " tool-name)}))
```

### Stdio Transport (Local Development)

```clojure
(ns com.little-trader.mcp.transport
  (:require [clojure.java.io :as io]
            [cheshire.core :as json]))

(defn start-stdio-transport [mcp-server]
  "Start stdio-based MCP transport for Claude Code"
  (let [in (io/reader System/in)
        out (io/writer System/out)]

    ;; Read loop
    (async/go-loop []
      (when-let [line (.readLine in)]
        (let [message (json/parse-string line true)]
          (handle-mcp-message mcp-server message out))
        (recur)))))

(defn handle-mcp-message [mcp-server message out]
  "Process incoming MCP message"
  (let [{:keys [type method params id]} message]
    (case type
      "request"
      (let [response (case method
                       "initialize" (initialize-mcp-server params)
                       "resources/read" (handle-resource-read mcp-server (:resource-id params))
                       "tools/call" (handle-tool-call mcp-server (:name params) (:arguments params))
                       {:error "Unknown method"})]
        (write-response out id response))

      "notification"
      (case method
        "shutdown" (System/exit 0)
        nil))))

(defn write-response [out id response]
  "Write JSON response to stdout"
  (.write out (json/generate-string
    (merge {:jsonrpc "2.0" :id id} response)))
  (.write out "\n")
  (.flush out))
```

---

## Integration with Claude Code

### Configuration in `.claude/mcp.edn`

```clojure
{:mcp-servers [
  {
    :name "renko-trading-system"
    :type :stdio
    :command "clojure"
    :args ["-M:mcp" "-m" "com.little-trader.mcp.core/start"]
    :env {
      "DATOMIC_URI" "datomic:mem://renko"
      "KAFKA_BROKERS" "localhost:9092"
    }
    :resources [
      {:pattern "codebase://**" :read true}
      {:pattern "trading://**" :read true :subscribe true}
      {:pattern "schema://**" :read true}
    ]
    :tools [
      "run-backtest"
      "analyze-trade"
      "search-code"
      "git-ops"
    ]
  }
]}
```

### SessionStart Hook Example

**File**: `.claude/hooks/session-start.md`

```markdown
# Claude Code Session Initialization

When a new Claude Code session starts, execute this hook:

## Initialize MCP Server
```bash
clojure -M:mcp -m com.little-trader.mcp.core/start
```

## Provide Context
Load the following MCP resources:
- `codebase://root` - Project structure
- `schema://api` - Database schema
- `trading://data/current` - Current market state

## Enable Tools
- `run-backtest` - Run backtests
- `analyze-trade` - Analyze trades
- `search-code` - Search codebase
- `git-ops` - Git operations

## Example: Help me refactor the renko signal detection

I can now:
1. Search your code for the signal detection logic
2. Understand the current schema and architecture
3. Run backtests to validate changes
4. Make commits automatically
```

### Using MCP in Claude Code

**Example Interaction**:

```
User: "Help me optimize the renko brick generation for performance"

Claude Code (via MCP):
1. [MCP] Read resource "codebase://src/com/little_trader/domain/renko.clj"
   → Gets current implementation

2. [MCP] Call tool "search-code" with query "generate-bricks"
   → Finds all usages and tests

3. [MCP] Run profiling backtest with 1M bars
   → Benchmarks current performance

4. Makes optimizations:
   - Vectorized operations where possible
   - Reduced allocations
   - Inline critical functions

5. [MCP] Run backtest again to validate
   → Ensures results still correct and reproducible

6. [MCP] Git commit changes
   → Automatic commit with explanation
```

---

## Advanced MCP Patterns

### 1. Long-Running Operations

```clojure
(defn long-running-tool []
  {:name "analyze-large-dataset"
   :description "Analyze large backtest dataset (may take minutes)"
   :supports-progress true
   :execute (fn [params]
     (let [progress-chan (async/chan)]
       (async/go
         (doseq [i (range 1000)]
           (analyze-batch i)
           (async/>! progress-chan {:percent (* i 0.1) :status "Processing..."})))
       {:status "in-progress"
        :progress-channel progress-chan}))})
```

### 2. Resource Subscriptions

```clojure
(defn subscribe-trades [callback]
  "Subscribe to trade updates in real-time"
  (let [subscription-id (str "trades-" (random-uuid))]
    (kafka/subscribe "trades" (fn [trade]
      (callback {:type "trade-update" :data trade})))
    {:subscription-id subscription-id
     :resource-id "trading://data/trades"}))
```

### 3. Context Caching

```clojure
(def ^:private resource-cache (atom {}))

(defn get-resource-cached [resource-id ttl-ms]
  "Get resource with caching to reduce token usage"
  (let [cached (@resource-cache resource-id)]
    (if (and cached (< (- (System/currentTimeMillis) (:timestamp cached)) ttl-ms))
      (:data cached)
      (let [fresh (get-resource resource-id)]
        (swap! resource-cache assoc resource-id
          {:data fresh :timestamp (System/currentTimeMillis)})
        fresh))))
```

---

## Best Practices

### 1. Resource Design
- **Keep resources focused**: One concern per resource
- **Version your resources**: Include version in resource ID if schema changes
- **Document thoroughly**: Clear descriptions help Claude understand context
- **Subscribe carefully**: Only subscribe to high-priority resources

### 2. Tool Design
- **Clear contracts**: Define exact input/output schemas
- **Fast execution**: Keep tools <5 second response time
- **Error handling**: Return meaningful error messages
- **Idempotent**: Running twice should be safe

### 3. Performance
- **Cache aggressively**: Use resource subscriptions wisely
- **Batch operations**: Combine multiple small requests
- **Lazy loading**: Only load what's needed
- **Progressive updates**: Stream results as available

### 4. Security
- **Validate inputs**: Check all tool parameters
- **Rate limit**: Prevent abuse of expensive operations
- **Audit logging**: Track all MCP operations
- **Authentication**: Secure tool access

---

## Troubleshooting

### MCP Connection Issues
```bash
# Check if MCP server is running
curl http://localhost:5000/health

# View MCP logs
tail -f logs/mcp.log

# Test resource access
clojure -e "(require '[com.little-trader.mcp.core]) (get-resource-cached \"codebase://root\" 60000)"
```

### Claude Code Integration Issues
```
Check:
1. .claude/mcp.edn is properly formatted
2. MCP server command is executable
3. Environment variables are set correctly
4. SessionStart hook runs successfully
```

---

## Summary

MCP provides:
- ✅ Real-time codebase context to Claude
- ✅ Direct access to market data and trades
- ✅ Backtest execution tool
- ✅ Code search and navigation
- ✅ Git integration
- ✅ Efficient token usage through subscriptions
- ✅ Long-running operation support
- ✅ Bidirectional communication

With MCP, Claude Code becomes a powerful AI-assisted trading system development environment!

---

## Cloud Staging Integration

### Overview

The cloud staging environment extends MCP capabilities with live nREPL access in Kubernetes. This enables Claude Code to evaluate code directly in a running staging environment.

### Quick Setup

**For Claude Desktop users** (full MCP features):
```bash
# Install clojure-mcp
# Add to ~/.clojure/deps.edn:
# {:aliases {:mcp {:deps {com.bhauman/clojure-mcp {:git/url "..." :git/tag "v0.1.12"}}
#                  :exec-fn clojure-mcp.main/start-mcp-server}}}

# Configure Claude Desktop with cloud connection
# See CLOUD_MCP_STAGING.md for full configuration
```

**For Claude Code CLI users** (minimal setup):
```bash
# Install clojure-mcp-light via bbin
bbin install https://github.com/bhauman/clojure-mcp-light.git --tag v0.2.0

# Configure hooks in ~/.claude/settings.json
# See CLOUD_MCP_STAGING.md for full configuration
```

### Key Features

| Feature | Local MCP | Cloud Staging MCP |
|---------|-----------|-------------------|
| Code Evaluation | Local REPL | Cloud nREPL |
| Database Access | Local/Mock | Real Datomic |
| Kafka Integration | Local/Mock | Real Kafka |
| Hot Reload | Local only | Cloud + Local |
| State Persistence | Session | Persistent |

### Connection Flow

```
Claude Code/Desktop
        │
        ▼
clojure-mcp (local)
        │
        ▼ (port-forward)
kubectl port-forward
        │
        ▼
K8s nREPL Service (staging)
        │
        ▼
little-trader Pod
```

### Documentation

For comprehensive setup and configuration, see:
- **[CLOUD_MCP_STAGING.md](./CLOUD_MCP_STAGING.md)** - Full architecture and implementation guide
- **[DEVOPS.md](./DEVOPS.md)** - Infrastructure and deployment details

### External Resources

- [clojure-mcp](https://github.com/bhauman/clojure-mcp) - Full MCP server for Claude + nREPL
- [clojure-mcp-light](https://github.com/bhauman/clojure-mcp-light) - Minimal tooling for Claude Code
- [Model Context Protocol](https://docs.claude.com/en/docs/mcp) - Official MCP documentation
