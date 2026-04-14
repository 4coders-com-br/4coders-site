# Day 1: Foundation & Exchange Integration - Detailed Breakdown

**Total Time**: 4 hours
**Goal**: Connect to real exchanges with authentication, receive live data

---

## Critical Path Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DAY 1 CRITICAL PATH                                 │
└─────────────────────────────────────────────────────────────────────────────┘

PHASE 1: Schema Foundation (45 min)
═══════════════════════════════════
     │
     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1.1 USER ACCOUNT SCHEMA                                                    │
│  ────────────────────────                                                   │
│                                                                             │
│  Inner Work:                                                                │
│  • Define :user/id, :user/email, :user/password-hash                        │
│  • Define :user/created-at, :user/role                                      │
│  • Add to schema.clj, transact to Datomic                                   │
│                                                                             │
│  Output Gate: Can create user entity in Datomic                             │
│  Test: (d/transact conn {:user/email "test@example.com" ...})               │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1.2 EXCHANGE CREDENTIALS SCHEMA                                            │
│  ───────────────────────────────                                            │
│                                                                             │
│  Inner Work:                                                                │
│  • Define :exchange-cred/id, :exchange-cred/user (ref)                      │
│  • Define :exchange-cred/exchange-type (enum: bitfinex, binance, mt5)       │
│  • Define :exchange-cred/api-key-encrypted, :exchange-cred/secret-encrypted │
│  • Define :exchange-cred/permissions, :exchange-cred/active?                │
│                                                                             │
│  Output Gate: Can store encrypted credentials linked to user                │
│  Test: Query user → get all their exchange credentials                      │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1.3 API SESSION SCHEMA                                                     │
│  ──────────────────────                                                     │
│                                                                             │
│  Inner Work:                                                                │
│  • Define :session/id, :session/user (ref)                                  │
│  • Define :session/token, :session/expires-at                               │
│  • Define :session/created-at, :session/last-active                         │
│                                                                             │
│  Output Gate: Can create/validate session tokens                            │
│  Test: Create session, lookup by token, check expiry                        │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │
PHASE 2: Auth & Crypto (45 min)    │
═══════════════════════════════════│
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2.1 PASSWORD HASHING                                                       │
│  ────────────────────                                                       │
│                                                                             │
│  Inner Work:                                                                │
│  • Add buddy-hashers or bcrypt dependency                                   │
│  • Create (hash-password plain) → hashed                                    │
│  • Create (verify-password plain hashed) → boolean                          │
│  • Namespace: com.little-trader.auth.crypto                                 │
│                                                                             │
│  Output Gate: Can hash and verify passwords                                 │
│  Test: (verify-password "secret" (hash-password "secret")) => true          │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2.2 CREDENTIAL ENCRYPTION                                                  │
│  ────────────────────────                                                   │
│                                                                             │
│  Inner Work:                                                                │
│  • Add buddy-core or similar for AES-256                                    │
│  • Get encryption key from env var (LITTLE_TRADER_SECRET_KEY)               │
│  • Create (encrypt-credential plain key) → encrypted-string                 │
│  • Create (decrypt-credential encrypted key) → plain                        │
│                                                                             │
│  Output Gate: Can encrypt/decrypt API keys safely                           │
│  Test: Round-trip encryption preserves value                                │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2.3 JWT TOKEN MANAGEMENT                                                   │
│  ───────────────────────                                                    │
│                                                                             │
│  Inner Work:                                                                │
│  • Add buddy-sign dependency                                                │
│  • Create (create-token user-id) → JWT string                               │
│  • Create (verify-token token) → {:user-id ... :expires ...} or nil         │
│  • Token expiry: 24h, refresh flow optional                                 │
│                                                                             │
│  Output Gate: Can create and validate JWT tokens                            │
│  Test: Create token, verify it, verify expired token fails                  │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │
PHASE 3: Account Service (30 min)  │
═══════════════════════════════════│
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3.1 USER REGISTRATION                                                      │
│  ────────────────────                                                       │
│                                                                             │
│  Inner Work:                                                                │
│  • Create (register-user email password) → {:user-id ... :token ...}        │
│  • Validate email format                                                    │
│  • Check email uniqueness                                                   │
│  • Hash password, create user entity                                        │
│  • Create initial session, return token                                     │
│  • Namespace: com.little-trader.account.service                             │
│                                                                             │
│  Output Gate: New user can register and receive auth token                  │
│  Test: Register user, login with same credentials                           │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3.2 USER LOGIN                                                             │
│  ──────────────                                                             │
│                                                                             │
│  Inner Work:                                                                │
│  • Create (login email password) → {:user-id ... :token ...} or error       │
│  • Lookup user by email                                                     │
│  • Verify password hash                                                     │
│  • Create new session, return token                                         │
│                                                                             │
│  Output Gate: Existing user can login and receive token                     │
│  Test: Login with valid creds succeeds, invalid fails                       │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3.3 EXCHANGE CREDENTIAL MANAGEMENT                                         │
│  ──────────────────────────────────                                         │
│                                                                             │
│  Inner Work:                                                                │
│  • Create (add-exchange-creds user-id exchange api-key secret)              │
│  • Encrypt api-key and secret before storage                                │
│  • Create (get-exchange-creds user-id exchange) → decrypted creds           │
│  • Create (list-exchanges user-id) → [{:exchange :active? :added-at}]       │
│  • Create (remove-exchange-creds user-id exchange)                          │
│                                                                             │
│  Output Gate: User can add/retrieve/remove exchange credentials             │
│  Test: Add creds, retrieve decrypted, verify match original                 │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │
PHASE 4: Exchange Protocol (45 min)│
═══════════════════════════════════│
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4.1 EXCHANGE PROTOCOL DEFINITION                                           │
│  ───────────────────────────────                                            │
│                                                                             │
│  Inner Work:                                                                │
│  • Define Clojure protocol IExchange:                                       │
│    - (connect! [this]) → connection-state                                   │
│    - (disconnect! [this])                                                   │
│    - (get-ticker [this symbol]) → {:bid :ask :last :volume}                 │
│    - (get-ohlcv [this symbol timeframe limit]) → [bars...]                  │
│    - (subscribe-ticker! [this symbol callback])                             │
│    - (place-order [this order]) → order-result                              │
│    - (cancel-order [this order-id]) → cancel-result                         │
│    - (get-balance [this]) → {:currency amount ...}                          │
│    - (get-positions [this]) → [positions...]                                │
│  • Namespace: com.little-trader.exchange.protocol                           │
│                                                                             │
│  Output Gate: Protocol defined, can be implemented by any exchange          │
│  Test: Protocol compiles, documentation clear                               │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4.2 CCXT WRAPPER BASE                                                      │
│  ────────────────────                                                       │
│                                                                             │
│  Inner Work:                                                                │
│  • Add ccxt-clj or clj-http for REST calls                                  │
│  • Create base CCXT adapter that implements IExchange                       │
│  • Handle common CCXT response formats                                      │
│  • Implement rate limiting (token bucket)                                   │
│  • Handle retries with exponential backoff                                  │
│  • Namespace: com.little-trader.exchange.ccxt                               │
│                                                                             │
│  Output Gate: Base adapter with rate limiting and retries                   │
│  Test: Rate limiter works, retries on transient errors                      │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4.3 CONNECTION HEALTH MONITOR                                              │
│  ────────────────────────────                                               │
│                                                                             │
│  Inner Work:                                                                │
│  • Create connection state atom {:status :connected|:disconnected|:error}   │
│  • Heartbeat check every 30s                                                │
│  • Auto-reconnect on disconnect                                             │
│  • Connection event callbacks                                               │
│                                                                             │
│  Output Gate: System knows connection health, auto-recovers                 │
│  Test: Simulate disconnect, verify reconnection                             │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │
PHASE 5: Bitfinex Impl (45 min)    │
═══════════════════════════════════│
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  5.1 BITFINEX REST CLIENT                                                   │
│  ───────────────────────                                                    │
│                                                                             │
│  Inner Work:                                                                │
│  • Implement Bitfinex-specific REST endpoints:                              │
│    - GET /v2/ticker/:symbol                                                 │
│    - GET /v2/candles/trade::timeframe::symbol/hist                          │
│    - POST /v2/auth/r/wallets (authenticated)                                │
│    - POST /v2/auth/w/order/submit (authenticated)                           │
│  • Handle Bitfinex response format (arrays not objects)                     │
│  • Implement HMAC-SHA384 authentication                                     │
│  • Namespace: com.little-trader.exchange.bitfinex                           │
│                                                                             │
│  Output Gate: Can fetch ticker, OHLCV, and balances from Bitfinex           │
│  Test: Fetch BTC/USD ticker, get 100 1h candles                             │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  5.2 BITFINEX WEBSOCKET CLIENT                                              │
│  ───────────────────────────────                                            │
│                                                                             │
│  Inner Work:                                                                │
│  • Connect to wss://api-pub.bitfinex.com/ws/2                               │
│  • Subscribe to ticker channel: {"event":"subscribe","channel":"ticker"}   │
│  • Subscribe to candles: {"event":"subscribe","channel":"candles"}          │
│  • Parse streaming updates                                                  │
│  • Handle heartbeats and reconnection                                       │
│  • Use core.async channels for data flow                                    │
│                                                                             │
│  Output Gate: Receive real-time price updates via WebSocket                 │
│  Test: Subscribe to BTC/USD, receive 5 ticker updates                       │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  5.3 BITFINEX ORDER EXECUTION (Paper Mode)                                  │
│  ─────────────────────────────────────────                                  │
│                                                                             │
│  Inner Work:                                                                │
│  • Implement order submission (market, limit)                               │
│  • Implement order cancellation                                             │
│  • Parse order confirmation response                                        │
│  • NOTE: Test with paper/sandbox mode first!                                │
│  • Add :paper-mode? flag to disable real execution                          │
│                                                                             │
│  Output Gate: Can submit orders (paper mode verified)                       │
│  Test: Place paper order, verify response structure                         │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │
PHASE 6: Integration (30 min)      │
═══════════════════════════════════│
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  6.1 USER → EXCHANGE INTEGRATION                                            │
│  ───────────────────────────────                                            │
│                                                                             │
│  Inner Work:                                                                │
│  • Create (get-user-exchange user-id exchange-type) → IExchange instance    │
│  • Decrypt credentials, create exchange client                              │
│  • Cache clients per user-exchange pair                                     │
│  • Handle credential updates (invalidate cache)                             │
│                                                                             │
│  Output Gate: Given user-id, get authenticated exchange client              │
│  Test: Add creds, get client, fetch balance                                 │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  6.2 LIVE DATA PIPELINE START                                               │
│  ───────────────────────────                                                │
│                                                                             │
│  Inner Work:                                                                │
│  • Create (start-data-feed! user-id exchange symbol)                        │
│  • Subscribe to WebSocket, put updates on core.async channel                │
│  • Create (stop-data-feed! feed-id)                                         │
│  • Store feed state for management                                          │
│                                                                             │
│  Output Gate: Can start/stop live data feeds per user/symbol                │
│  Test: Start BTC/USD feed, receive 10 updates, stop feed                    │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  6.3 REPL HELPERS & VERIFICATION                                            │
│  ───────────────────────────────                                            │
│                                                                             │
│  Inner Work:                                                                │
│  • Create REPL namespace with convenience functions:                        │
│    (repl/create-test-user)                                                  │
│    (repl/add-bitfinex-creds api-key secret)                                 │
│    (repl/test-connection)                                                   │
│    (repl/fetch-ticker "BTC/USD")                                            │
│    (repl/start-live-feed "BTC/USD")                                         │
│    (repl/show-live-prices)                                                  │
│                                                                             │
│  Output Gate: Developer can interactively test entire flow from REPL        │
│  Test: Run through all REPL helpers successfully                            │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                              DAY 1 COMPLETE
═══════════════════════════════════════════════════════════════════════════════

FINAL OUTPUT GATES (Must Pass All):
────────────────────────────────────
□ User can register with email/password
□ User can login and receive JWT token
□ User can add Bitfinex API credentials (encrypted storage)
□ System connects to Bitfinex REST API
□ System connects to Bitfinex WebSocket
□ Live ticker data flows through system
□ All operations accessible via REPL
□ Connection auto-reconnects on failure

VERIFICATION SCRIPT:
────────────────────
```clojure
;; Run in REPL to verify Day 1 complete

;; 1. Create user
(def user (account/register-user "trader@example.com" "securepass123"))
;; => {:user-id "..." :token "eyJ..."}

;; 2. Login
(def session (account/login "trader@example.com" "securepass123"))
;; => {:user-id "..." :token "eyJ..."}

;; 3. Add exchange credentials
(account/add-exchange-creds (:user-id user) :bitfinex
                            (System/getenv "BITFINEX_API_KEY")
                            (System/getenv "BITFINEX_SECRET"))
;; => {:exchange :bitfinex :active? true}

;; 4. Get exchange client
(def bfx (exchange/get-client (:user-id user) :bitfinex))
;; => #BitfinexClient{:connected? true}

;; 5. Fetch ticker (REST)
(exchange/get-ticker bfx "BTC/USD")
;; => {:bid 42150.0 :ask 42151.0 :last 42150.5 :volume 1234.5}

;; 6. Fetch historical data (REST)
(exchange/get-ohlcv bfx "BTC/USD" "1h" 100)
;; => [{:timestamp ... :open ... :high ... :low ... :close ... :volume ...} ...]

;; 7. Start live feed (WebSocket)
(def feed (exchange/start-live-feed! bfx "BTC/USD"
            (fn [tick] (println "Tick:" tick))))
;; => {:feed-id "..." :status :connected}

;; Wait a few seconds, see ticks print...

;; 8. Stop feed
(exchange/stop-live-feed! feed)
;; => {:status :stopped}

;; 9. Check balance (authenticated)
(exchange/get-balance bfx)
;; => {:USD 10000.0 :BTC 0.5}

(println "✅ Day 1 Complete - All gates passed!")
```
```

---

## Dependency Graph (Visual)

```
                              ┌──────────────┐
                              │   START      │
                              └──────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
             ┌──────────┐    ┌──────────────┐   ┌──────────┐
             │ 1.1 User │    │ 1.2 Exchange │   │ 1.3 API  │
             │ Schema   │    │ Cred Schema  │   │ Session  │
             └────┬─────┘    └──────┬───────┘   └────┬─────┘
                  │                 │                │
                  │    ┌────────────┴────────────┐   │
                  │    │                         │   │
                  ▼    ▼                         ▼   ▼
             ┌────────────┐               ┌────────────┐
             │ 2.1 Pass   │               │ 2.2 Cred   │
             │ Hashing    │               │ Encryption │
             └─────┬──────┘               └─────┬──────┘
                   │                            │
                   └──────────┬─────────────────┘
                              │
                              ▼
                       ┌────────────┐
                       │ 2.3 JWT    │
                       │ Tokens     │
                       └─────┬──────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐   ┌──────────────┐
        │ 3.1 User │  │ 3.2 User │   │ 3.3 Exchange │
        │ Register │  │ Login    │   │ Cred Mgmt    │
        └────┬─────┘  └────┬─────┘   └──────┬───────┘
             │             │                │
             └─────────────┼────────────────┘
                           │
                           ▼
                    ┌────────────┐
                    │ 4.1 Exchange│
                    │ Protocol   │
                    └─────┬──────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
              ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ 4.2 CCXT │ │ 4.3 Health│ │          │
        │ Base     │ │ Monitor  │ │          │
        └────┬─────┘ └────┬─────┘ │          │
             │            │       │          │
             └────────────┼───────┘          │
                          │                  │
              ┌───────────┼──────────────────┘
              │           │
              ▼           ▼
        ┌──────────────────────┐
        │ 5.1 Bitfinex REST    │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ 5.2 Bitfinex WS      │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ 5.3 Bitfinex Orders  │
        │ (Paper Mode)         │
        └──────────┬───────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ 6.1 User│ │ 6.2 Live│ │ 6.3 REPL│
   │ Exchange│ │ Data    │ │ Helpers │
   │ Integr. │ │ Pipeline│ │         │
   └────┬────┘ └────┬────┘ └────┬────┘
        │          │           │
        └──────────┼───────────┘
                   │
                   ▼
            ┌────────────┐
            │  DAY 1     │
            │  COMPLETE  │
            └────────────┘
```

---

## Files to Create

| Phase | File | Purpose |
|-------|------|---------|
| 1.x | `src/com/little_trader/data/schema.clj` | Add user/cred/session schemas (extend existing) |
| 2.1 | `src/com/little_trader/auth/crypto.clj` | Password hashing |
| 2.2 | `src/com/little_trader/auth/crypto.clj` | Credential encryption (same file) |
| 2.3 | `src/com/little_trader/auth/token.clj` | JWT token management |
| 3.x | `src/com/little_trader/account/service.clj` | Account registration, login, cred mgmt |
| 4.1 | `src/com/little_trader/exchange/protocol.clj` | IExchange protocol |
| 4.2 | `src/com/little_trader/exchange/ccxt.clj` | CCXT base wrapper |
| 4.3 | `src/com/little_trader/exchange/health.clj` | Connection health monitor |
| 5.x | `src/com/little_trader/exchange/bitfinex.clj` | Bitfinex implementation |
| 6.x | `src/com/little_trader/exchange/manager.clj` | User-exchange integration |
| 6.3 | `dev/repl.clj` | REPL development helpers |

---

## Dependencies to Add

```clojure
;; deps.edn additions
{:deps
 {;; Authentication
  buddy/buddy-hashers {:mvn/version "2.0.167"}  ; bcrypt password hashing
  buddy/buddy-sign {:mvn/version "3.5.351"}     ; JWT tokens
  buddy/buddy-core {:mvn/version "1.11.423"}    ; AES encryption

  ;; HTTP Client
  clj-http/clj-http {:mvn/version "3.12.3"}     ; REST API calls

  ;; WebSocket
  stylefruits/gniazdo {:mvn/version "1.2.2"}    ; WebSocket client

  ;; Async
  org.clojure/core.async {:mvn/version "1.6.681"} ; Already likely present
  }}
```

---

## Time Allocation

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Schema | 45 min | 0:45 |
| Phase 2: Auth & Crypto | 45 min | 1:30 |
| Phase 3: Account Service | 30 min | 2:00 |
| Phase 4: Exchange Protocol | 45 min | 2:45 |
| Phase 5: Bitfinex Impl | 45 min | 3:30 |
| Phase 6: Integration | 30 min | 4:00 |

---

## Ready to Start?

When you say "go", I will:

1. **Read** existing `schema.clj` to understand current structure
2. **Read** `deps.edn` to check existing dependencies
3. **Implement** Phase 1.1 (User Account Schema) first
4. **Test** in REPL before moving to next phase
5. Continue through critical path in order

Each phase will be marked complete only when its **Output Gate** passes.