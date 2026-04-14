# Mel Evolution — Flying Avatar, Conversation Persistence & Data Architecture

> **Status**: PLANNED  
> **Created**: 2026-04-05  
> **Epic**: Mel AI Copilot — Phase 2

---

## 1. Flying Avatar Mode

### Vision
Mel transitions from a fixed sidebar to a **flying avatar** — a small animated mascot (the rescued Brazilian street dog) that floats over the UI. This becomes the default Mel presence, with the sidebar reserved for deep conversation review.

### Behavior
- **Idle**: Small avatar (40-50px) floating in a corner, subtle breathing animation
- **Hover**: Expands to show a quick-prompt input + last response preview in a speech balloon
- **Speech balloon**: Auto-appears when Mel has a proactive insight or response, auto-dismisses after ~8s
- **Click**: Opens the flying prompt — a compact input with send button, no chat history
- **Button**: "Open full chat" → slides out the sidebar for conversation history review
- **Drag**: Avatar can be repositioned by the user (position persisted in localStorage)

### Implementation Notes
- Pure DOM (same pattern as current `mel_assistant.cljs` mount)
- CSS transitions for expand/collapse
- `requestAnimationFrame` for smooth floating if idle animation is desired
- z-index above all panels but below modals
- State: `{:mel-mode :avatar | :sidebar}` in re-frame

---

## 2. Conversation Entity — First-Class Data Model

### Datomic Schema
```clojure
;; Conversation entity
:mel.conversation/id          - uuid, identity
:mel.conversation/user-id     - ref to :user/id
:mel.conversation/started-at  - instant
:mel.conversation/updated-at  - instant
:mel.conversation/title       - string (auto-generated or user-set)
:mel.conversation/message-count - long
:mel.conversation/tags        - cardinality-many string (e.g. "strategy", "debug", "options")

;; Message entity
:mel.message/id               - uuid, identity
:mel.message/conversation-id  - ref to conversation
:mel.message/role             - enum [:user :assistant :system]
:mel.message/content          - string (full text)
:mel.message/timestamp        - instant
:mel.message/seq              - long (ordering within conversation)

;; Provider metadata (on each assistant message)
:mel.message/provider         - string (e.g. "openrouter", "local-claude", "anthropic")
:mel.message/model            - string (e.g. "anthropic/claude-sonnet-4", "claude-cli")
:mel.message/pathway          - string (e.g. "BRIDGE (host CLI)", "API (openrouter)")
:mel.message/tokens-prompt    - long (if available from provider)
:mel.message/tokens-completion - long
:mel.message/cost             - double (if available, e.g. OpenRouter cost field)
:mel.message/latency-ms       - long (round-trip time)
:mel.message/client-context   - string (EDN snapshot of mel-context at time of request)
```

---

## 3. Storage Architecture — Local-First + Pulsar + Datomic

### Design Principles
- **Local-first**: Browser localStorage is the primary read source for speed
- **Pulsar**: Durable event log for cross-device sync and recovery
- **Datomic**: Materialized cache for fast server-side queries and analytics

### Data Flow

```
User sends message
    │
    ├─► localStorage (immediate write, optimistic)
    │     Key: "mel-conversations"
    │     Value: last N conversations (configurable, default 50)
    │     Format: transit+json for compact storage
    │
    ├─► POST /api/chat (LLM provider)
    │     Response includes provider metadata
    │
    ├─► Pulsar topic: mel.conversations.{user-id}
    │     Full message + metadata as Pulsar message
    │     Retention: 30 days (configurable)
    │     Schema: Avro or JSON with version field
    │
    └─► Datomic (async, via Pulsar consumer)
          Materialized from Pulsar topic
          Serves as recovery source + analytics backend
```

### Recovery Waterfall
```
On page load:
  1. Read localStorage → if conversations exist, render immediately
  2. Background: fetch /api/mel/conversations?since=<last-known-timestamp>
     └─► Server checks Datomic cache
         └─► If Datomic empty, triggers Pulsar consumer replay
  3. Merge server data with local data (server wins on conflicts)
  4. Update localStorage with merged state
```

### Offline Capability
- Full chat works offline (localStorage + LLM bridge if host is local)
- Messages queued in localStorage with `:pending? true` flag
- On reconnect, pending messages are published to Pulsar

---

## 4. Snapshot Strategy — Last N Conversations

### localStorage Schema
```clojure
{:version 1
 :user-id "uuid"
 :conversations
 [{:id "conv-uuid"
   :title "Strategy debugging session"
   :started-at "2026-04-05T..."
   :updated-at "2026-04-05T..."
   :messages [{:id "msg-uuid"
               :role "user"
               :content "..."
               :timestamp "..."}
              {:id "msg-uuid"
               :role "assistant"
               :content "..."
               :timestamp "..."
               :provider "local-claude"
               :model "claude-cli"
               :pathway "BRIDGE (host CLI)"
               :latency-ms 2340}]
   :message-count 12}]
 :total-conversations 142  ;; server-side count
 :last-sync "2026-04-05T..."}
```

### Configurable Parameters
- `mel.snapshot/max-conversations` — default 50 (in localStorage)
- `mel.snapshot/max-messages-per-conversation` — default 100
- `mel.pulsar/retention-days` — default 30
- `mel.pulsar/topic-prefix` — `mel.conversations`

---

## 5. Pulsar Topic Design

### Topics
- `persistent://public/default/mel.conversations.events` — all conversation events (create, message, close)
- `persistent://public/default/mel.conversations.analytics` — aggregated usage stats (daily rollups)

### Message Schema (conversation event)
```json
{
  "version": 1,
  "event-type": "message",
  "conversation-id": "uuid",
  "user-id": "uuid",
  "message": {
    "id": "uuid",
    "role": "assistant",
    "content": "...",
    "timestamp": "iso8601",
    "seq": 5
  },
  "provider-metadata": {
    "provider": "openrouter",
    "model": "anthropic/claude-sonnet-4",
    "pathway": "API (openrouter)",
    "tokens-prompt": 1200,
    "tokens-completion": 450,
    "cost": 0.00315,
    "latency-ms": 2100
  }
}
```

### Consumer
- `mel-conversation-materializer` — reads from Pulsar, writes to Datomic
- Runs as part of the fs-worker or standalone
- Idempotent (message dedup by message-id)

---

## 6. Datomic Materialized Cache

### Queries
```clojure
;; Recent conversations for user
[:find (pull ?c [:mel.conversation/id :mel.conversation/title
                 :mel.conversation/updated-at :mel.conversation/message-count])
 :in $ ?user-id
 :where [?c :mel.conversation/user-id ?user-id]]

;; Full conversation with messages
[:find (pull ?c [* {:mel.conversation/messages [*]}])
 :in $ ?conv-id
 :where [?c :mel.conversation/id ?conv-id]]

;; Usage stats
[:find ?provider (count ?m) (sum ?cost)
 :where [?m :mel.message/provider ?provider]
        [?m :mel.message/cost ?cost]]
```

---

## 7. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/mel/conversations` | List conversations (paginated, from Datomic cache) |
| GET | `/api/mel/conversations/:id` | Full conversation with messages |
| POST | `/api/mel/conversations` | Create new conversation |
| DELETE | `/api/mel/conversations/:id` | Soft-delete conversation |
| GET | `/api/mel/usage` | Provider usage stats (costs, token counts) |

---

## 8. Implementation Phases

### Phase 2a — Flying Avatar (UI only)
- [ ] Create `mel_avatar.cljs` with floating avatar component
- [ ] Add `:mel-mode` to re-frame state (`:avatar` / `:sidebar`)
- [ ] Speech balloon with last response
- [ ] Hover → quick prompt
- [ ] "Open full chat" button → sidebar
- [ ] Draggable position (localStorage persist)
- [ ] Smooth CSS transitions

### Phase 2b — Conversation Persistence (localStorage)
- [ ] Add Datomic schema for conversations and messages
- [ ] Write to localStorage on every message send/receive
- [ ] Load from localStorage on mount
- [ ] Conversation list view in sidebar
- [ ] New conversation / switch conversation

### Phase 2c — Provider Metadata Capture
- [ ] Capture latency-ms on every LLM call
- [ ] Extract tokens/cost from provider response (OpenRouter, Anthropic)
- [ ] Store metadata alongside each assistant message
- [ ] Show provider badge on each message in chat

### Phase 2d — Pulsar Integration
- [ ] Define Pulsar topic + schema
- [ ] Publish conversation events from chat handler
- [ ] Build materializer consumer (Pulsar → Datomic)
- [ ] Recovery endpoint: `/api/mel/conversations?since=timestamp`

### Phase 2e — Full Sync Loop
- [ ] Background sync on page load
- [ ] Merge strategy (server wins)
- [ ] Offline queue with pending flag
- [ ] Usage analytics dashboard

---

## Dependencies
- Apache Pulsar (already running in fs-worker stack)
- Datomic Pro (already running)
- localStorage API (browser-native)
- Transit for compact serialization (already in deps)
