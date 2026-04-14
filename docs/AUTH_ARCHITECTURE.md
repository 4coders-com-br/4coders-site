# Authentication & Authorization Architecture

## Current State: Zero Auth

No authentication exists. All endpoints public. CORS wide open. buddy-hashers dependency present but unused. Datomic user schema defined but not wired to RAD model.

---

## Design Goals

1. **Multi-tenant**: Users own their data (accounts, strategies, trades)
2. **Role-based access**: 4 tiers from learner to admin
3. **Home page only**: Ship with just the dashboard visible; hide all other features behind feature flags/roles
4. **Future-proof**: Support OAuth2/SSO later without rewrite
5. **Fulcro-native**: Use Fulcro RAD patterns, not fight them

---

## Role Hierarchy

```
admin > designer > user > learner
```

| Role | Can See | Can Do |
|------|---------|--------|
| **learner** | Dashboard (read-only), Learn pages | View market data, follow courses |
| **user** | + Accounts, Trades, Positions, Performance | Create accounts, execute trades |
| **designer** | + Strategy Editor, Clara Rules, NNM | Design/backtest strategies |
| **admin** | + User management, system config | CRUD users, manage platform |

---

## Architecture Decision: Session-Based JWT

### Why JWT + HTTP-only Cookie (not localStorage)

| Approach | Pros | Cons |
|----------|------|------|
| **JWT in localStorage** | Simple frontend | XSS vulnerable |
| **JWT in HTTP-only cookie** | XSS-safe, auto-sent | CSRF needed |
| **Server sessions (Ring)** | Simple, revocable | Sticky sessions in k8s |
| **JWT + HTTP-only cookie** | XSS-safe, stateless backend, k8s friendly | Slightly more complex |

**Decision**: JWT in HTTP-only secure cookie + CSRF token

- Stateless backend → works across k8s pods
- HTTP-only → JavaScript can't read it (XSS protection)
- Secure + SameSite=Strict → CSRF protection
- Short-lived JWT (15min) + refresh token rotation

---

## Implementation Plan

### Layer 1: Backend Auth (Clojure)

#### New Files

```
src/com/little_trader/
├── auth/
│   ├── core.clj          # JWT create/verify, password hash/check
│   ├── middleware.clj     # Ring middleware: extract user from cookie
│   └── resolvers.clj     # Pathom mutations: login, logout, signup, current-user
├── model/
│   └── user.cljc         # RAD model: user attributes
```

#### `auth/core.clj` - JWT + Password

```clojure
;; Dependencies to add:
;;   buddy/buddy-sign {:mvn/version "3.5.351"}   ;; JWT signing
;;   buddy/buddy-hashers already present

(ns com.little-trader.auth.core
  (:require [buddy.sign.jwt :as jwt]
            [buddy.hashers :as hashers]
            [buddy.core.keys :as keys]))

;; JWT_SECRET from env (required in production)
;; Token lifetime: 15 minutes access, 7 days refresh
;; Payload: {:user/id uuid, :user/email str, :user/role kw, :exp epoch}
```

#### `auth/middleware.clj` - Ring Middleware

```clojure
;; Extracts JWT from cookie, validates, injects :user into request
;; Public routes: /health, /api/auth/login, /api/auth/signup, /
;; Protected routes: /api/eql, /ws
;; Role check: middleware attaches role, resolvers enforce per-operation
```

#### `auth/resolvers.clj` - Pathom Mutations

```clojure
;; Mutations (public):
;;   (com.little-trader.auth/login {:email "x" :password "y"})
;;     → Sets HTTP-only cookie, returns {:user/id :user/email :user/role}
;;
;;   (com.little-trader.auth/signup {:email "x" :password "y" :role :learner})
;;     → Creates user, sets cookie, returns user
;;
;; Mutations (authenticated):
;;   (com.little-trader.auth/logout {})
;;     → Clears cookie
;;
;;   (com.little-trader.auth/current-user {})
;;     → Returns user from JWT context
;;
;; Admin-only:
;;   (com.little-trader.auth/update-user-role {:user/id uuid :role :designer})
```

### Layer 2: Datomic Schema (already exists)

The schema at `schema.clj:351-380` has:
- `:user/id` (uuid, identity)
- `:user/email` (string, unique)
- `:user/password-hash` (string)
- `:user/created-at` (instant)
- `:user/role` (keyword)

**Additions needed:**
```clojure
{:db/ident :user/active?
 :db/valueType :db.type/boolean
 :db/cardinality :db.cardinality/one}

{:db/ident :user/last-login
 :db/valueType :db.type/instant
 :db/cardinality :db.cardinality/one}

;; Link users to their accounts (multi-tenant)
{:db/ident :account/owner
 :db/valueType :db.type/ref
 :db/cardinality :db.cardinality/one
 :db/doc "User who owns this trading account"}
```

### Layer 3: RAD Model

#### `model/user.cljc`

```clojure
;; RAD attributes for user entity
;; Used by: forms, reports, resolvers
;; Fields: id, email, role, created-at, active?
;; NOTE: password-hash is NEVER exposed to client
```

### Layer 4: Frontend Auth (ClojureScript)

#### New Files

```
src/com/little_trader/ui/
├── login.cljs            # Login form component
├── auth.cljs             # Auth state management (Fulcro mutations)
└── role_guard.cljs       # Route guard based on role
```

#### Login Flow

```
1. User hits /          → Check cookie (GET /api/auth/current-user)
2. No valid session     → Show LoginPage
3. Valid session        → Show Root with role-filtered nav
4. Login form submit    → POST /api/auth/login (sets cookie)
5. Success              → Reload current-user, show dashboard
6. Logout               → POST /api/auth/logout (clears cookie)
```

#### Route Guarding

```clojure
;; Current MainRouter has 16 targets
;; After auth, filter by role:

(def route-permissions
  {dashboard/TradingDashboard       #{:learner :user :designer :admin}
   account-forms/AccountList         #{:user :designer :admin}
   account-forms/AccountForm         #{:user :designer :admin}
   trade-forms/TradeList             #{:user :designer :admin}
   trade-forms/TradeForm             #{:user :designer :admin}
   trade-forms/OpenTradesList        #{:user :designer :admin}
   strategy-forms/StrategyList       #{:designer :admin}
   strategy-forms/StrategyForm       #{:designer :admin}
   strategy-editor/StrategyEditor    #{:designer :admin}
   balance-reports/BalanceHistoryReport #{:user :designer :admin}
   balance-reports/AccountSummaryReport #{:user :designer :admin}
   learn-studio/LearnStudio          #{:learner :user :designer :admin}
   learn/LearnPage                   #{:learner :user :designer :admin}
   learn-nnm/LearnNNMStudio          #{:designer :admin}
   nnm-trading/NNMTradingPage        #{:designer :admin}
   repl/ReplPage                     #{:admin}
   chat/ChatPage                     #{:user :designer :admin}})
```

### Layer 5: Home Page Only (Phase 1 Deploy)

For the immediate deploy, the strategy is:

1. **Backend**: Add auth middleware but allow unauthenticated access to dashboard data
2. **Frontend**: Show only the login page → dashboard. Nav menu hidden except Dashboard
3. **All other routes**: Return 403 if role insufficient

This means Phase 1 ships:
- Login/signup page
- Dashboard (all roles)
- Learn pages (learner+)
- Everything else hidden

---

## Multi-Tenant Data Model

```
User (1) ──→ (N) Account (trading account)
User (1) ──→ (N) Strategy
Account (1) ──→ (N) Trade
Strategy (1) ──→ (N) Trade
Trade (1) ──→ (N) Execution

Scoping rule: All Pathom resolvers filter by :user/id from JWT context
```

### Resolver Guard Pattern

```clojure
(defn require-role [env minimum-role]
  (let [user-role (get-in env [:user :user/role])
        hierarchy {:admin 4 :designer 3 :user 2 :learner 1}]
    (when (< (hierarchy user-role 0) (hierarchy minimum-role))
      (throw (ex-info "Forbidden" {:status 403})))))

;; Usage in resolver:
(pco/defresolver account-list [{:keys [user] :as env} _]
  {::pco/output [{:account/all-accounts [:account/id :account/name]}]}
  (require-role env :user)
  ;; Only return accounts owned by this user
  (d/q '[:find [(pull ?a [*]) ...]
         :in $ ?user-id
         :where [?a :account/owner ?u]
                [?u :user/id ?user-id]]
       db (:user/id user)))
```

---

## Dependencies to Add

```clojure
;; deps.edn additions:
buddy/buddy-sign {:mvn/version "3.5.351"}   ;; JWT create/verify
;; buddy-hashers already present
```

No other deps needed. Ring cookie support is built into ring-core.

---

## Environment Variables

```
JWT_SECRET=<random-256-bit-key>     ;; Required in prod
JWT_EXPIRY_MINUTES=15               ;; Access token lifetime
REFRESH_TOKEN_DAYS=7                ;; Refresh token lifetime
ADMIN_EMAIL=admin@4coders.com       ;; Seed admin account on first boot
ADMIN_PASSWORD=<set-on-first-deploy>
```

---

## Deployment Changes

### Kubernetes
```yaml
# k8s/secret.yaml (new)
apiVersion: v1
kind: Secret
metadata:
  name: little-trader-auth
type: Opaque
data:
  jwt-secret: <base64>
  admin-password: <base64>
```

### Docker
```dockerfile
ENV JWT_SECRET=""
ENV JWT_EXPIRY_MINUTES="15"
```

### Cloud Run
```yaml
# Add to cloud-run.yml:
env:
  - name: JWT_SECRET
    valueFrom:
      secretKeyRef:
        name: jwt-secret
```

---

## Implementation Order

1. **Add `buddy-sign` dep** to deps.edn
2. **Create `auth/core.clj`** - JWT + password functions
3. **Create `auth/middleware.clj`** - Ring auth middleware
4. **Create `auth/resolvers.clj`** - Login/signup/logout mutations
5. **Create `model/user.cljc`** - RAD user attributes
6. **Update `schema.clj`** - Add `:account/owner`, `:user/active?`
7. **Update `model.cljc`** - Include user attributes
8. **Update `server/core.clj`** - Wire auth middleware, restrict CORS
9. **Update `parser.clj`** - Inject user context into Pathom env
10. **Create `ui/login.cljs`** - Login form
11. **Create `ui/auth.cljs`** - Auth state mutations
12. **Update `ui/client.cljs`** - Conditional nav, route guard, login-first flow
13. **Update deployment configs** - JWT_SECRET env var
14. **Seed admin user** on first boot
15. **Test & deploy**
