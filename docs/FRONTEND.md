# FRONTEND.md - Modular Component Architecture Guide

**Patterns for Building Scalable, Testable, and Reusable Frontend Components**

> Based on insights from Bradford Cross's talk on building modular re-frame applications at Blind Circle, adapted for our Clojure/Fulcro/UIx stack.

## Table of Contents
1. [Philosophy](#philosophy)
2. [Component Definition Patterns](#component-definition-patterns)
3. [State Patterns](#state-patterns)
4. [Component Linking Patterns](#component-linking-patterns)
5. [System Definition Patterns](#system-definition-patterns)
6. [Testing Strategy](#testing-strategy)
7. [Actionable Checklist](#actionable-checklist)
8. [Migration Guide](#migration-guide)

---

## Philosophy

### The Modularity Problem

When building frontend applications with multiple teams contributing code:
- Teams need to work on the same application without stepping on each other
- Components need clear boundaries (like the "majestic monolith" vs microservices)
- Engineers may not have deep frontend experience
- Different timezones require autonomous, self-documenting code

### What is Modularity?

A component is **modular** if:

1. **Add without change**: You can add my component to your page without changing your state management
2. **Limited breakage surface**: If you're using my component, there are very limited ways my code can break yours
3. **Reusable**: Once written, the component works on any page without rewriting

> "The dream is the Lego brick model - a high-level description of components and how they relate, and based on that we generate the state management."

### Core Definitions

| Term | Definition |
|------|------------|
| **Component** | A rectangle on the screen (visual boundary) |
| **System** | A collection of components (e.g., a page) |
| **Explicit State** | State that's explicitly passed as parameters |
| **Implicit State** | State accessed via subscriptions/global store |

---

## Component Definition Patterns

### Pattern 1: Pure Functions (Most Modular)

**When to use**: Structural display, no logic, maximum reusability

```clojure
;; PURE FUNCTION - No state dependencies
(defui toggle-filter-render [{:keys [label on? on-toggle]}]
  ($ :div {:class "filter-item"}
     ($ :label label)
     ($ :button {:on-click on-toggle
                 :class (if on? "active" "inactive")}
        (if on? "ON" "OFF"))))
```

**Advantages**:
- Fully testable without mocking
- Zero coupling to application state
- Maximum reusability across projects

**Disadvantages**:
- Consumers must wire up all state and handlers
- More boilerplate at call sites

**Actionable**: Use for leaf components like buttons, badges, display cards.

---

### Pattern 2: Inline Subscriptions/Events (Convenient but Coupled)

**When to use**: Quick prototyping, single-use components

```clojure
;; INLINE SUBSCRIPTIONS - Hardcoded state access
(defui toggle-filter [{:keys [label filter-key]}]
  (let [filters (use-subscription [:filters])
        on? (get filters filter-key)]
    ($ :div {:class "filter-item"}
       ($ :label label)
       ($ :button {:on-click #(dispatch [:toggle-filter filter-key])
                   :class (if on? "active" "inactive")}
          (if on? "ON" "OFF")))))
```

**Problems**:
- Tests require mocking the entire subscription system
- Component is coupled to specific subscription names
- Hard to reuse with different state shapes

**Actionable**: Avoid for shared components. OK for one-off page-specific UI.

---

### Pattern 3: Decorator Pattern (Best Balance)

**When to use**: Most components - separates concerns while keeping call sites clean

```clojure
;; STEP 1: Pure render function (easily testable)
(defui toggle-filter-render [{:keys [label on? on-toggle]}]
  ($ :div {:class "filter-item"}
     ($ :label label)
     ($ :button {:on-click on-toggle
                 :class (if on? "active" "inactive")}
        (if on? "ON" "OFF"))))

;; STEP 2: Stateful wrapper (thin layer)
(defui toggle-filter [{:keys [label filter-key]}]
  (let [filters (use-subscription [:filters])
        on? (get filters filter-key)]
    ($ toggle-filter-render
       {:label label
        :on? on?
        :on-toggle #(dispatch [:toggle-filter filter-key])})))
```

**Testing Strategy**:
1. Test `toggle-filter-render` thoroughly with unit tests
2. Test `toggle-filter` minimally (integration test)
3. Test subscriptions/events separately

**Actionable**: Default pattern for all new components.

---

### Pattern 4: DSL/Helper Pattern (DRY Optimization)

**When to use**: Many similar components, reduce boilerplate

```clojure
;; HELPER FUNCTION - Generates decorated components
(defn make-component
  "Create a component with automatic subscription/dispatch wiring."
  [{:keys [subscriptions events render-fn]}]
  (fn [props]
    (let [sub-values (reduce-kv
                       (fn [acc k sub-key]
                         (assoc acc k (use-subscription sub-key)))
                       {}
                       subscriptions)
          event-handlers (reduce-kv
                           (fn [acc k event-key]
                             (assoc acc k #(dispatch [event-key %])))
                           {}
                           events)]
      (render-fn (merge props sub-values event-handlers)))))

;; USAGE
(def toggle-filter
  (make-component
    {:subscriptions {:on? [:filter-active]}
     :events {:on-toggle :toggle-filter}
     :render-fn toggle-filter-render}))
```

**Actionable**: Consider for component libraries or design systems.

---

## State Patterns

### Pattern A: Direct/Implicit State (Avoid)

State access hardcoded inside component:

```clojure
;; BAD: Implicit dependencies
(defui filters-panel []
  (let [filters (use-subscription [:filters])  ;; Hidden dependency
        results (use-subscription [:results])] ;; Hidden dependency
    ($ :div
       ($ toggle-filter {:filter-key :active})
       ($ text-search {:key :search-text}))))
```

**Problems**:
- Can't use component with different state shape
- Hidden dependencies make debugging hard
- Testing requires full state setup

---

### Pattern B: Indirect/Explicit State (Prefer)

State access parameterized:

```clojure
;; GOOD: Explicit dependencies
(defui filters-panel [{:keys [filters on-filter-change search-text on-search-change]}]
  ($ :div
     ($ toggle-filter-render
        {:label "Active Only"
         :on? (:active filters)
         :on-toggle #(on-filter-change :active (not (:active filters)))})
     ($ text-search-render
        {:value search-text
         :on-change on-search-change})))
```

**Benefits**:
- Component is provably modular (can't access unspecified state)
- Easy to test with any state shape
- Clear contract for consumers

**Actionable**: Parameterize subscriptions and dispatch in component props.

---

## Component Linking Patterns

### Pattern X: Direct Linking (Inflexible)

Components reference other components directly:

```clojure
;; BAD: Hardcoded component references
(defui results-list [{:keys [results]}]
  ($ :div {:class "results"}
     (for [result results]
       ;; Can't change result rendering
       ($ result-card {:key (:id result) :data result}))))
```

**Problem**: Can't customize what renders inside `results-list`.

---

### Pattern Y: Component Injection (Flexible)

Components passed as arguments:

```clojure
;; GOOD: Inject component as prop
(defui results-list [{:keys [results result-component]
                      :or {result-component result-card}}]
  ($ :div {:class "results"}
     (for [result results]
       ($ result-component {:key (:id result) :data result}))))

;; USAGE: Default behavior
($ results-list {:results data})

;; USAGE: Custom result rendering
($ results-list {:results data
                 :result-component blue-result-card})
```

**Actionable**: Accept sub-component functions as props for extensibility.

---

## System Definition Patterns

### Implicit System Definition (Hard to Maintain)

Page structure defined by nesting:

```clojure
;; BAD: Structure hidden in code
(defui page []
  ($ :div
     ($ header)
     ($ :div {:class "content"}
        ($ sidebar
           ($ filters-panel)
           ($ actions-panel))
        ($ main-content
           ($ results-list)))))
```

**Problems**:
- Can't modify structure without code changes
- Hard to create variants (feature flags)
- No data-driven composition

---

### Explicit System Definition (Data-Driven)

Page structure defined in configuration:

```clojure
;; GOOD: Structure as data
(def page-config
  {:root {:component root-layout
          :children [:header :sidebar :content]}
   :header {:component header
            :props {:title "Trading Dashboard"}}
   :sidebar {:component sidebar
             :children [:filters :actions]}
   :filters {:component filters-panel
             :props {:subscription [:filters]
                     :on-change [:update-filters]}}
   :content {:component results-list
             :props {:result-component result-card}}})

;; RENDER FROM CONFIG
(defn render-from-config [config]
  (let [{:keys [component props children]} (get config :root)]
    ($ component
       (merge props
              {:children (map #(render-from-config (assoc config :root (get config %)))
                              children)}))))
```

**Benefits**:
- UI described as data structure
- Easy to create variants (merge configs)
- Feature flags become config changes
- Can serialize/deserialize UI definitions

### Feature Flagging Example

```clojure
;; BASE CONFIG
(def base-page-config
  {:filters {:component filters-panel
             :props {:subscription [:filters]
                     :on-change [:update-filters]}}})

;; VARIANT: URL-based filters
(def url-filters-diff
  {:filters {:props {:subscription [:url-params :filters]
                     :on-change [:update-url-params]}}})

;; MERGED CONFIG
(def v2-page-config
  (deep-merge base-page-config url-filters-diff))
```

**Actionable**: Define page structure as EDN/data, render from config.

---

## Testing Strategy

### Testing Pyramid for Components

```
                    ┌───────────────────────┐
                    │  E2E Tests            │  Few: Full page flows
                    │  (Playwright/Cypress) │
                    └───────────┬───────────┘
                    ┌───────────▼───────────┐
                    │  Integration Tests    │  Some: Decorated components
                    │  (devcards, storybook)│
                    └───────────┬───────────┘
        ┌───────────────────────▼───────────────────────┐
        │  Unit Tests                                   │  Many: Pure render fns
        │  (cljs.test, no DOM needed)                   │
        └───────────────────────────────────────────────┘
```

### Unit Testing Pure Render Functions

```clojure
(ns com.little-trader.ui.trade-panel-test
  (:require [cljs.test :refer [deftest is testing]]
            [com.little-trader.ui.trade-panel :as tp]))

(deftest position-status-shows-no-position
  (testing "when trade is nil"
    (let [result (tp/position-status-render {:trade nil :current-price 50000})]
      (is (= "NO POSITION" (get-in result [:children 1 :children]))))))

(deftest position-status-shows-pnl
  (testing "long position with profit"
    (let [trade {:side :long :entry-price 49000 :status :open}
          result (tp/position-status-render {:trade trade :current-price 50000})]
      (is (str/includes? (str result) "+$1,000")))))
```

### Integration Testing with Devcards

```clojure
(ns com.little-trader.ui.cards
  (:require [devcards.core :refer [defcard-rg]]))

(defcard-rg trade-panel-no-position
  "Trade panel without active position"
  [trade-panel {:trade nil
                :current-price 50000
                :on-open-long #(js/console.log "Long")
                :on-open-short #(js/console.log "Short")}])

(defcard-rg trade-panel-long-position
  "Trade panel with profitable long"
  [trade-panel {:trade {:side :long :entry-price 49000 :status :open}
                :current-price 50000
                :on-close #(js/console.log "Close")}])
```

---

## Actionable Checklist

### Before Creating a New Component

- [ ] **Identify state needs**: What data does this component need?
- [ ] **Choose pattern**: Pure function, decorator, or inline?
- [ ] **Define props contract**: What parameters should be explicit?
- [ ] **Plan for injection**: What sub-components might vary?
- [ ] **Consider testing**: Can I test the render without mocking?

### Component Review Checklist

- [ ] **No hardcoded subscriptions** in render functions
- [ ] **Props are explicit** about what data is needed
- [ ] **Sub-components injectable** where customization is likely
- [ ] **Pure render function** extracted for testing
- [ ] **Tests don't need** state system mocking

### Page/System Review Checklist

- [ ] **Page structure is data** (not hidden in nesting)
- [ ] **Components are configurable** via props
- [ ] **Feature flags possible** without code changes
- [ ] **Config can be merged** for variants

---

## Migration Guide

### Step 1: Identify Coupled Components

Look for patterns like:
```clojure
;; RED FLAG: Inline subscription
(let [data (use-subscription [:some-key])]
```

### Step 2: Extract Pure Render Functions

```clojure
;; BEFORE
(defui my-component []
  (let [data (use-subscription [:data])]
    ($ :div data)))

;; AFTER
(defui my-component-render [{:keys [data]}]
  ($ :div data))

(defui my-component []
  (let [data (use-subscription [:data])]
    ($ my-component-render {:data data})))
```

### Step 3: Parameterize State Access

```clojure
;; BEFORE: Fixed subscription
(defui my-component []
  (let [data (use-subscription [:filters :active])]
    ...))

;; AFTER: Configurable subscription
(defui my-component [{:keys [data-subscription]}]
  (let [data (use-subscription data-subscription)]
    ...))
```

### Step 4: Create Page Configs

```clojure
;; BEFORE: Hardcoded structure
(defui page []
  ($ :div
     ($ header)
     ($ content)))

;; AFTER: Data-driven structure
(def page-config
  {:header header
   :content content})

(defui page []
  (render-from-config page-config))
```

---

## Current Codebase Analysis

### Good Patterns Already in Use

**`trade-panel.cljs`**:
- Uses decorator pattern (pure render functions)
- Props are explicit (`trade`, `current-price`, `on-*` handlers)
- Sub-components are composable

**`app.cljs`**:
- Clean separation of header/footer as pure functions
- State management centralized in `use-callback` handlers

### Opportunities for Improvement

1. **`trading_dashboard.cljs`**: ChartWidget has inline state management
   - Extract pure render, pass data as props

2. **`chart.cljs`**: May have direct DOM manipulation
   - Consider wrapping in decorator pattern

3. **System-level**: No page config pattern yet
   - Could benefit from data-driven page structure

---

## Future Enhancements

### Component Analytics
With UI as data, we can analyze:
- Which components are used across pages
- Dependency graphs between components
- Shared vs. page-specific components

### Visual Editor
Data-driven UI enables:
- Drag-and-drop page builder
- Live preview of config changes
- Non-developer page customization

### Serialization
Config-based systems allow:
- Save/load UI layouts
- Server-side rendering from config
- A/B testing via config variants

---

## Summary

| Pattern | When to Use | Testability | Reusability |
|---------|-------------|-------------|-------------|
| Pure Function | Leaf components, display | Excellent | Excellent |
| Inline Subscriptions | Quick prototypes | Poor | Poor |
| Decorator | Most components | Good | Good |
| DSL/Helper | Component libraries | Good | Excellent |
| Direct State | Never | Poor | Poor |
| Parameterized State | Always | Excellent | Excellent |
| Direct Linking | Simple cases | OK | Poor |
| Component Injection | Extensible systems | Good | Excellent |
| Implicit System | Quick prototypes | Poor | Poor |
| Explicit Config | Production apps | Good | Excellent |

**Key Takeaway**: Push state management to higher-order components. Keep render functions pure. Define system structure as data.

---

## References

- Video: [Bradford Cross - Building Modular re-frame Applications](https://www.youtube.com/watch?v=b_uum_iYShE)
- [Fulcro Developer's Guide](https://book.fulcrologic.com/)
- [UIx Documentation](https://github.com/pitch-io/uix)
- Project Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
