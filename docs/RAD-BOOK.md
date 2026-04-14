# RAD-BOOK.md - Fulcro & RAD Learning Guide with Little Trader

**A comprehensive curriculum mapping the Fulcro Developer's Guide and RAD Developer's Guide to the little-trader codebase**

> This document serves as a master plan for N agentic sessions, each covering specific chapters from the Fulcro books with hands-on examples from the little-trader trading system.

---

## Table of Contents

1. [Overview](#overview)
2. [Book Structures](#book-structures)
3. [Agentic Session Plan](#agentic-session-plan)
4. [Session Details](#session-details)
5. [Completion Checklist](#completion-checklist)
6. [Course Curriculum](#course-curriculum)

---

## Overview

### Purpose

This guide transforms the theoretical knowledge from two Fulcro books into practical, hands-on learning using the little-trader codebase:

| Book | Focus | little-trader Application |
|------|-------|---------------------------|
| **Fulcro Developer's Guide** | Core Fulcro concepts, components, state management | UI components, state, mutations |
| **Fulcro RAD Developer's Guide** | Rapid Application Development patterns | Forms, Reports, Attributes, Database adapters |

### Learning Approach

Each session follows this pattern:
1. **Read** - Study the book chapter concepts
2. **Explore** - Find related code in little-trader
3. **Implement** - Add or modify features applying the concepts
4. **Document** - Update this guide with examples
5. **Verify** - Run tests and validate changes

### Source Materials

- **Fulcro Developer's Guide**: https://book.fulcrologic.com/
- **Fulcro RAD Developer's Guide**: https://book.fulcrologic.com/RAD.html
- **GitHub Sources**:
  - https://github.com/fulcrologic/fulcro-developer-guide
  - https://github.com/fulcrologic/fulcro-rad

---

## Book Structures

### Fulcro Developer's Guide - 38 Chapters

| # | Chapter | Key Concepts | little-trader Mapping |
|---|---------|--------------|----------------------|
| 1 | About This Book | Namespaces, Best Practices | `CLAUDE.md`, project structure |
| 2 | React Versions | React integration | `ui/app.cljs` UIx setup |
| 3 | Fulcro From 10,000 Feet | EQL, Client DB, Mutations | Architecture overview |
| 4 | Core Concepts | Immutable data, Pure rendering, Idents | `ui/state.cljs` |
| 5 | Getting Started | Project setup, defsc, Initial state | Full walkthrough |
| 6 | Core API | Normalization, Denormalization | `ui/mutations.cljs` |
| 7 | Components and Rendering | defsc, Factories, Props, Hooks | `ui/*.cljs` components |
| 8 | EQL — Query Language | Properties, Joins, Mutations | `components/resolvers.clj` |
| 9 | Initial Application State | Initial state composition | App initialization |
| 10 | Normalization | Client DB structure | State management |
| 11 | Full Stack Operation | Remote integration | EQL API layer |
| 12 | Mutations | defmutation, Remote mutations | `ui/mutations.cljs` |
| 13 | Loads | data-fetch, Targeting | Data loading patterns |
| 14 | Client Networking | HTTP Remote, Middleware | `server/core.clj` |
| 15 | Error Handling | Load errors, Global handlers | Error management |
| 16 | Building a Server | Pathom, Ring middleware | `components/parser.clj` |
| 17 | Custom Type Support | Transit, Custom readers | Transit encoding |
| 18 | UI State Machines | UISM, Event handling | Trading workflow |
| 19 | Fulcro Raw | Hooks, Raw applications | UIx integration |
| 20 | Dynamic Queries | Query modification | Dynamic reports |
| 21 | Dynamic Router | Routing targets, Route segments | Navigation |
| 22 | Legacy UI Routers | Router history | (Reference only) |
| 23 | Forms Overview | Form concepts | RAD forms |
| 24 | Form State Support | Validation, Submit | Form handling |
| 25 | Batched Reads | Request batching | Performance |
| 26 | Synchronous Operation | Testing sync mode | Testing |
| 27 | Security | CSRF, Authentication | Security patterns |
| 28 | Workspaces | Development tools | Dev workflow |
| 29 | Code Splitting | Modules, Lazy loading | Build optimization |
| 30 | Performance | Optimization techniques | Performance tuning |
| 31 | Production Debug | Debug helpers | Debugging |
| 32 | Testing | Specifications, Mocking | `test/` directory |
| 33 | Server-side Rendering | SSR setup | (Future feature) |
| 34 | Logging | Logging helpers | Logging setup |
| 35 | Advanced Internals | Transaction system | Deep dive |
| 36 | Demos | Autocomplete, Pagination | Real examples |
| 37 | React Native | Mobile development | (Reference only) |
| 38 | Fulcro and GraphQL | GraphQL integration | (Reference only) |

### Fulcro RAD Developer's Guide - 6 Main Chapters

| # | Chapter | Key Concepts | little-trader Mapping |
|---|---------|--------------|----------------------|
| 1 | Introduction | Core ideals, Attribute-centric design | Architecture philosophy |
| 2 | Attributes | defattr, Types, References | `model/*.cljc` |
| 3 | Server Setup | Config, Middleware, Pathom | `components/*.clj` |
| 4 | Client Setup | App initialization | `ui/client.cljs` |
| 5 | Database Adapters | Datomic, Resolvers | `components/database.clj` |
| 6 | Rendering Plugins | Forms, Reports, Validation | `ui/*_forms.cljc`, `ui/*_reports.cljc` |

---

## Agentic Session Plan

### Session Overview

| Session | Chapters Covered | Duration | Focus Area |
|---------|-----------------|----------|------------|
| **Session 1** | FDG 1-5 | Long | Foundations & Getting Started |
| **Session 2** | FDG 6-8 | Long | Core API & EQL |
| **Session 3** | FDG 9-11 | Medium | State & Full-Stack |
| **Session 4** | FDG 12-13 | Long | Mutations & Loads |
| **Session 5** | FDG 14-16 | Long | Networking & Server |
| **Session 6** | FDG 17-19 | Medium | Custom Types & Raw Mode |
| **Session 7** | FDG 20-22 | Long | Routing |
| **Session 8** | FDG 23-24 | Long | Forms |
| **Session 9** | FDG 25-28 | Medium | Performance & Security |
| **Session 10** | FDG 29-32 | Long | Code Splitting & Testing |
| **Session 11** | FDG 33-38 | Medium | Advanced Topics |
| **Session 12** | RAD 1-2 | Long | RAD Introduction & Attributes |
| **Session 13** | RAD 3-4 | Long | RAD Server & Client Setup |
| **Session 14** | RAD 5 | Long | Database Adapters |
| **Session 15** | RAD 6 (Forms) | Long | RAD Forms Deep Dive |
| **Session 16** | RAD 6 (Reports) | Long | RAD Reports Deep Dive |

**Total: 16 Sessions**

---

## Session Details

### Session 1: Foundations & Getting Started (FDG Ch 1-5) - COMPLETED

#### Objectives
- [x] Understand Fulcro architecture and philosophy
- [x] Set up development environment
- [x] Create first component with defsc
- [x] Understand initial state composition

#### Implementation Summary

**Learn Studio** - An integrated learning environment was created with three main components:

1. **Course Content** (`ui/learn.cljs`) - Interactive lessons covering:
   - Chapter 1: About This Book - Namespaces and project structure
   - Chapter 2: React Integration - UIx vs defsc patterns
   - Chapter 3: Fulcro From 10,000 Feet - EQL, Client DB, Mutations
   - Chapter 4: Core Concepts - Immutable data, Pure rendering, Idents
   - Chapter 5: Getting Started - Project setup, defsc, Initial state

2. **REPL Interface** (`ui/repl.cljs`) - Interactive code evaluation:
   - Multi-line code input with history navigation
   - Quick snippet buttons for common operations
   - Result display with pretty printing
   - Error handling

3. **AI Chat Assistant** (`ui/chat.cljs`) - System-aware LLM interface:
   - Understands little-trader architecture
   - Answers questions about Fulcro/RAD
   - Provides code suggestions
   - Supports Claude and OpenAI APIs

**Server-Side Support** (`server/learn_api.clj`):
- `/api/repl/eval` - Sandboxed code evaluation endpoint
- `/api/chat` - LLM chat endpoint with mock fallback

#### little-trader Code Mapping

| Concept | File | Example |
|---------|------|---------|
| Project Structure | `deps.edn`, `shadow-cljs.edn` | Build configuration |
| Namespace Conventions | `src/com/little_trader/` | Package organization |
| Basic Components | `ui/app.cljs` | Root app component |
| UIx Components | `ui/chart.cljs` | Chart component |
| State Initialization | `ui/state.cljs` | `app-state` atom |
| **Learn Studio** | `ui/learn_studio.cljs` | Integrated learning UI |
| **REPL Component** | `ui/repl.cljs` | Code evaluation |
| **Chat Component** | `ui/chat.cljs` | AI assistant |
| **Learn API** | `server/learn_api.clj` | Backend support |
| **Learn Styles** | `css/learn.css` | Component styling |

#### Tasks

```markdown
## Session 1 Tasks - COMPLETED

### Task 1.1: Document Project Structure
- [x] Create diagram of project namespace hierarchy
- [x] Map Fulcro conventions to little-trader structure
- [x] Document deps.edn dependencies

### Task 1.2: Analyze Root Component
- [x] Document `ui/app.cljs` component tree
- [x] Explain UIx vs defsc patterns
- [x] Show props flow from parent to children

### Task 1.3: Initial State Deep Dive
- [x] Document `ui/state.cljs` structure
- [x] Show how state is composed
- [x] Add example of extending initial state

### Task 1.4: Create Learning Component
- [x] Add new `ui/learn_studio.cljs` (integrated learning environment)
- [x] Implement example components from book
- [x] Add to router for demonstration

### Task 1.5: Add REPL Interface (NEW)
- [x] Create `ui/repl.cljs` component
- [x] Add server-side eval endpoint
- [x] Implement history and snippets

### Task 1.6: Add AI Chat Assistant (NEW)
- [x] Create `ui/chat.cljs` component
- [x] Add server-side LLM integration
- [x] Implement system-aware prompting

### Completion Criteria
- [x] All code examples compile
- [x] Documentation added to RAD-BOOK.md
- [x] Tutorial component renders correctly
- [x] REPL evaluation working
- [x] Chat interface functional
```

#### Course Day 1: Fulcro Fundamentals

**Morning (Theory)**
- What is Fulcro? Why use it?
- The normalized database model
- EQL query language basics
- Component tree structure

**Afternoon (Practice)**
- Explore little-trader project structure
- Run the development server
- Modify `ui/app.cljs` header
- Add a new UI component

**Exercises**
1. Add a "System Status" component showing app state
2. Modify the header to show current trading mode
3. Create a simple counter component using local state

---

### Session 2: Core API & EQL (FDG Ch 6-8)

#### Objectives
- [ ] Master denormalization and normalization
- [ ] Understand defsc macro internals
- [ ] Write complex EQL queries
- [ ] Use joins and unions

#### little-trader Code Mapping

| Concept | File | Example |
|---------|------|---------|
| defsc Components | `ui/account_forms.cljc` | AccountForm component |
| Component Factories | `ui/trade_forms.cljc` | TradeList factory |
| EQL Queries | `components/resolvers.clj` | Pathom resolvers |
| Joins | Trade → Account | Reference resolution |

#### Tasks

```markdown
## Session 2 Tasks

### Task 2.1: Document defsc Patterns
- [ ] Analyze all defsc-form components
- [ ] Document query structure patterns
- [ ] Show ident generation strategies

### Task 2.2: EQL Query Examples
- [ ] Document resolver input/output
- [ ] Create query complexity examples
- [ ] Show nested join patterns

### Task 2.3: Add Complex Query
- [ ] Implement trade-with-account-and-strategy resolver
- [ ] Show multi-level joins
- [ ] Add to documentation

### Completion Criteria
- [ ] New resolver working in REPL
- [ ] Documentation with query diagrams
- [ ] Examples added to tutorial namespace
```

#### Course Day 2: Queries and Components

**Morning (Theory)**
- The EQL specification
- Property vs Join vs Union queries
- How Fulcro denormalizes data for rendering
- The component registry

**Afternoon (Practice)**
- Read `components/resolvers.clj`
- Add a new resolver with nested joins
- Query data from REPL
- Render query results in UI

**Exercises**
1. Write a resolver that returns trades with account info
2. Create a component that displays strategy with all trades
3. Implement a union query for different signal types

---

### Session 3: State & Full-Stack (FDG Ch 9-11)

#### Objectives
- [ ] Master initial state patterns
- [ ] Understand normalization internals
- [ ] Implement full-stack data flow
- [ ] Handle server interactions

#### little-trader Code Mapping

| Concept | File | Example |
|---------|------|---------|
| Initial State | `ui/state.cljs` | `app-state` initialization |
| Normalization | Model attributes | Identity attributes |
| Server Integration | `server/core.clj` | EQL endpoint |
| Data Flow | `ui/mutations.cljs` | `transact-eql!` |

#### Tasks

```markdown
## Session 3 Tasks

### Task 3.1: Document State Flow
- [ ] Create state flow diagram
- [ ] Document normalization process
- [ ] Show merge behavior

### Task 3.2: Implement State Inspector
- [ ] Add debug component showing normalized state
- [ ] Visualize ident references
- [ ] Show denormalization in action

### Task 3.3: Full-Stack Example
- [ ] Document complete request/response cycle
- [ ] Add timing/logging instrumentation
- [ ] Create sequence diagrams

### Completion Criteria
- [ ] State inspector component working
- [ ] Full-stack flow documented
- [ ] Diagrams added to documentation
```

#### Course Day 3: State Management

**Morning (Theory)**
- Why normalized state matters
- Idents as graph database keys
- Merge strategies
- Remote integration model

**Afternoon (Practice)**
- Inspect little-trader state in browser
- Trace a mutation through the system
- Add state debugging tools
- Handle optimistic updates

**Exercises**
1. Add a state history viewer
2. Implement rollback on mutation failure
3. Create a mutation that updates multiple entities

---

### Session 4: Mutations & Loads (FDG Ch 12-13)

#### Objectives
- [ ] Master defmutation patterns
- [ ] Implement remote mutations
- [ ] Use load! effectively
- [ ] Handle load targeting

#### little-trader Code Mapping

| Concept | File | Example |
|---------|------|---------|
| Client Mutations | `ui/mutations.cljs` | `open-trade!` |
| Server Mutations | `components/resolvers.clj` | `pco/defmutation` |
| Load Patterns | `ui/mutations.cljs` | `load-trades!` |
| Targeting | Various | Replace vs append |

#### Tasks

```markdown
## Session 4 Tasks

### Task 4.1: Document Mutation Patterns
- [ ] Catalog all mutations in codebase
- [ ] Show action vs remote sections
- [ ] Document result-action patterns

### Task 4.2: Add New Mutation
- [ ] Implement "update-strategy" mutation
- [ ] Add validation on server
- [ ] Handle errors gracefully

### Task 4.3: Load Pattern Examples
- [ ] Document all load! calls
- [ ] Show targeting strategies
- [ ] Add load marker handling

### Task 4.4: Implement Paginated Load
- [ ] Add pagination to trade list
- [ ] Show incremental loading
- [ ] Handle loading states

### Completion Criteria
- [ ] New mutation working end-to-end
- [ ] Pagination implemented
- [ ] Documentation updated
```

#### Course Day 4: Mutations and Data Loading

**Morning (Theory)**
- Mutation lifecycle stages
- Optimistic vs pessimistic updates
- Load targeting strategies
- Error handling in loads

**Afternoon (Practice)**
- Trace `open-trade!` mutation
- Add new "update-account" mutation
- Implement load with targeting
- Add loading indicators

**Exercises**
1. Add mutation to update strategy parameters
2. Implement load with post-mutation
3. Create error recovery for failed mutations

---

### Session 5: Networking & Server (FDG Ch 14-16)

#### Objectives
- [ ] Understand HTTP remote configuration
- [ ] Master middleware chains
- [ ] Build Pathom parser
- [ ] Handle server errors

#### little-trader Code Mapping

| Concept | File | Example |
|---------|------|---------|
| HTTP Handler | `server/core.clj` | `eql-api-handler` |
| Middleware | `components/middleware.clj` | Request processing |
| Pathom Parser | `components/parser.clj` | `rad-pathom/new-processor` |
| Error Handling | Server responses | Error propagation |

#### Tasks

```markdown
## Session 5 Tasks

### Task 5.1: Document Server Architecture
- [ ] Create server component diagram
- [ ] Document middleware stack
- [ ] Show request flow

### Task 5.2: Enhance Middleware
- [ ] Add request logging
- [ ] Implement rate limiting
- [ ] Add metrics collection

### Task 5.3: Error Handling
- [ ] Document error response format
- [ ] Add global error handler
- [ ] Implement retry logic

### Completion Criteria
- [ ] Middleware enhancements working
- [ ] Error handling documented
- [ ] Server architecture diagrams complete
```

#### Course Day 5: Server Architecture

**Morning (Theory)**
- Ring middleware model
- Pathom 3 resolver composition
- Parser configuration
- Error propagation patterns

**Afternoon (Practice)**
- Read `server/core.clj` and trace requests
- Add custom middleware
- Configure Pathom parser
- Handle server errors in UI

**Exercises**
1. Add authentication middleware
2. Implement request caching
3. Create custom error response format

---

### Session 6: Custom Types & Raw Mode (FDG Ch 17-19)

#### Objectives
- [ ] Handle custom Transit types
- [ ] Understand Fulcro Raw mode
- [ ] Integrate with React hooks
- [ ] Use subscription patterns

#### little-trader Code Mapping

| Concept | File | Example |
|---------|------|---------|
| Transit Encoding | `server/core.clj` | Transit handlers |
| UIx Hooks | `ui/chart.cljs` | `use-ref`, `use-effect` |
| Raw Mode | `ui/state.cljs` | Atom-based state |
| Subscriptions | `ui/state.cljs` | `add-watch` |

#### Tasks

```markdown
## Session 6 Tasks

### Task 6.1: Custom Type Support
- [ ] Document Transit encoding
- [ ] Add custom type handler (e.g., BigDecimal)
- [ ] Handle dates properly

### Task 6.2: UIx Integration
- [ ] Document UIx hook patterns
- [ ] Show defsc vs UIx comparison
- [ ] Create hybrid component example

### Task 6.3: Subscription Pattern
- [ ] Document state watch pattern
- [ ] Add derived state computation
- [ ] Optimize re-renders

### Completion Criteria
- [ ] Custom type handlers working
- [ ] UIx patterns documented
- [ ] Subscription examples complete
```

#### Course Day 6: Custom Types and Modern React

**Morning (Theory)**
- Transit type system
- Fulcro Raw architecture
- React hooks compatibility
- Subscription patterns

**Afternoon (Practice)**
- Add custom Transit handler
- Convert defsc to UIx component
- Implement state subscriptions
- Create derived state hook

**Exercises**
1. Add Transit handler for Java BigDecimal
2. Create UIx component with Fulcro data
3. Implement computed state subscription

---

### Session 7: Routing (FDG Ch 20-22)

#### Objectives
- [ ] Master Dynamic Router
- [ ] Implement route segments
- [ ] Handle deferred routing
- [ ] Support code splitting

#### little-trader Code Mapping

| Concept | File | Example |
|---------|------|---------|
| Server Routes | `server/core.clj` | Reitit router |
| Navigation | (To implement) | Client routing |
| Route Targets | (To implement) | Page components |
| Deep Links | (To implement) | URL parameters |

#### Tasks

```markdown
## Session 7 Tasks

### Task 7.1: Add Client Router
- [ ] Implement dynamic router
- [ ] Define route targets
- [ ] Handle initial route

### Task 7.2: Route Segments
- [ ] Add parameterized routes
- [ ] Handle route changes
- [ ] Implement breadcrumbs

### Task 7.3: Deferred Routing
- [ ] Add route guards
- [ ] Handle loading states
- [ ] Implement prefetching

### Completion Criteria
- [ ] Client router working
- [ ] URL navigation functional
- [ ] Route guards implemented
```

#### Course Day 7: Navigation and Routing

**Morning (Theory)**
- Dynamic router architecture
- Route segments and parameters
- Deferred routing patterns
- HTML5 history integration

**Afternoon (Practice)**
- Add router to little-trader
- Create route target components
- Handle route parameters
- Implement navigation guards

**Exercises**
1. Add routes for accounts, trades, strategies
2. Implement route-based data loading
3. Create navigation breadcrumbs

---

### Session 8: Forms (FDG Ch 23-24)

#### Objectives
- [ ] Understand form state management
- [ ] Implement validation
- [ ] Handle form submission
- [ ] Support complex form patterns

#### little-trader Code Mapping

| Concept | File | Example |
|---------|------|---------|
| RAD Forms | `ui/account_forms.cljc` | `defsc-form` |
| Validation | Form attributes | Required fields |
| Submit | Form middleware | Save/delete |
| State | Form configuration | Dirty tracking |

#### Tasks

```markdown
## Session 8 Tasks

### Task 8.1: Document Form Patterns
- [ ] Analyze all forms in codebase
- [ ] Document field configurations
- [ ] Show validation patterns

### Task 8.2: Enhance Account Form
- [ ] Add complex validation
- [ ] Implement conditional fields
- [ ] Add field dependencies

### Task 8.3: Create New Form
- [ ] Implement "Signal Configuration" form
- [ ] Add nested subforms
- [ ] Handle form composition

### Completion Criteria
- [ ] Enhanced validation working
- [ ] New form implemented
- [ ] Documentation complete
```

#### Course Day 8: Form Development

**Morning (Theory)**
- Form state lifecycle
- Validation strategies
- Submit handling
- Dirty tracking and reset

**Afternoon (Practice)**
- Read existing form code
- Add validation rules
- Handle form errors
- Implement form reset

**Exercises**
1. Add email validation to account form
2. Create multi-step wizard form
3. Implement form with dynamic fields

---

### Session 9: Performance & Security (FDG Ch 25-28)

#### Objectives
- [ ] Optimize request batching
- [ ] Implement security measures
- [ ] Use development workspaces
- [ ] Profile performance

#### little-trader Code Mapping

| Concept | File | Example |
|---------|------|---------|
| Batching | (To implement) | Request optimization |
| CSRF | (To implement) | Security middleware |
| Workspaces | (To implement) | Dev environment |
| Performance | Various | Optimization patterns |

#### Tasks

```markdown
## Session 9 Tasks

### Task 9.1: Request Batching
- [ ] Analyze current request patterns
- [ ] Implement batching strategy
- [ ] Measure performance improvement

### Task 9.2: Security Implementation
- [ ] Add CSRF protection
- [ ] Implement authentication
- [ ] Add authorization checks

### Task 9.3: Development Tools
- [ ] Set up workspaces
- [ ] Add component cards
- [ ] Create test harnesses

### Completion Criteria
- [ ] Batching implemented
- [ ] Security middleware working
- [ ] Workspaces configured
```

#### Course Day 9: Performance and Security

**Morning (Theory)**
- Request batching strategies
- CSRF protection
- Authentication patterns
- Performance profiling

**Afternoon (Practice)**
- Implement request batching
- Add CSRF tokens
- Profile component rendering
- Optimize slow queries

**Exercises**
1. Reduce API calls with batching
2. Add JWT authentication
3. Profile and optimize slow components

---

### Session 10: Code Splitting & Testing (FDG Ch 29-32)

#### Objectives
- [ ] Implement code splitting
- [ ] Write comprehensive tests
- [ ] Use specification framework
- [ ] Implement mocking

#### little-trader Code Mapping

| Concept | File | Example |
|---------|------|---------|
| Modules | `shadow-cljs.edn` | Build config |
| Tests | `test/` | Test files |
| Specs | `domain/renko.clj` | Clojure specs |
| Mocks | (To implement) | Test doubles |

#### Tasks

```markdown
## Session 10 Tasks

### Task 10.1: Code Splitting
- [ ] Analyze bundle size
- [ ] Implement lazy modules
- [ ] Add route-based splitting

### Task 10.2: Test Coverage
- [ ] Document existing tests
- [ ] Add component tests
- [ ] Implement integration tests

### Task 10.3: Specification Testing
- [ ] Add property-based tests
- [ ] Implement generative testing
- [ ] Create test generators

### Completion Criteria
- [ ] Code splitting working
- [ ] Test coverage improved
- [ ] Property tests passing
```

#### Course Day 10: Testing and Optimization

**Morning (Theory)**
- Code splitting strategies
- Testing pyramid
- Property-based testing
- Mocking strategies

**Afternoon (Practice)**
- Analyze bundle sizes
- Write component tests
- Add property-based tests
- Implement test mocks

**Exercises**
1. Split trading dashboard into module
2. Write tests for signal detection
3. Add generative tests for brick generation

---

### Session 11: Advanced Topics (FDG Ch 33-38)

#### Objectives
- [ ] Understand SSR patterns
- [ ] Master logging configuration
- [ ] Learn internal algorithms
- [ ] Study advanced demos

#### little-trader Code Mapping

| Concept | File | Example |
|---------|------|---------|
| Logging | Various | Timbre logging |
| Internals | Transaction system | Advanced patterns |
| Demos | Domain examples | Real implementations |
| Advanced | Various | Complex patterns |

#### Tasks

```markdown
## Session 11 Tasks

### Task 11.1: Logging Enhancement
- [ ] Configure structured logging
- [ ] Add log correlation
- [ ] Implement log levels

### Task 11.2: Internal Deep Dive
- [ ] Document transaction system
- [ ] Analyze algorithms used
- [ ] Create internal diagrams

### Task 11.3: Demo Implementation
- [ ] Implement autocomplete
- [ ] Add pagination example
- [ ] Create cascading dropdowns

### Completion Criteria
- [ ] Logging configured
- [ ] Internals documented
- [ ] Demos implemented
```

#### Course Day 11: Advanced Fulcro

**Morning (Theory)**
- Server-side rendering
- Transaction system internals
- Time travel debugging
- Production patterns

**Afternoon (Practice)**
- Configure production logging
- Implement time travel
- Study transaction flow
- Build demo features

**Exercises**
1. Add symbol autocomplete
2. Implement trade pagination
3. Create signal type selector

---

### Session 12: RAD Introduction & Attributes (RAD Ch 1-2)

#### Objectives
- [ ] Master attribute-centric design
- [ ] Define all attribute types
- [ ] Understand identity attributes
- [ ] Create referential attributes

#### little-trader Code Mapping

| Concept | File | Example |
|---------|------|---------|
| Attribute Definition | `model/account.cljc` | `defattr` |
| Identity | `model/*.cljc` | `:ao/identity? true` |
| Types | Various | Data type mappings |
| References | `model/trade.cljc` | `:trade/account` ref |

#### Tasks

```markdown
## Session 12 Tasks

### Task 12.1: Document Attribute Model
- [ ] Catalog all attributes
- [ ] Create entity relationship diagram
- [ ] Document attribute options

### Task 12.2: Enhance Attribute Definitions
- [ ] Add computed attributes
- [ ] Implement derived fields
- [ ] Add documentation strings

### Task 12.3: Create New Entity
- [ ] Define "Alert" entity attributes
- [ ] Add references to trade/strategy
- [ ] Implement in model.cljc

### Completion Criteria
- [ ] All attributes documented
- [ ] New entity implemented
- [ ] ER diagram complete
```

#### Course Day 12: RAD Attributes

**Morning (Theory)**
- Attribute-centric design philosophy
- Attribute keys and options
- Identity vs scalar attributes
- Reference relationships

**Afternoon (Practice)**
- Read all `model/*.cljc` files
- Add new attributes
- Create new entity
- Generate schema from attributes

**Exercises**
1. Add "Risk Profile" entity with attributes
2. Create composite attribute
3. Implement enumerated values

---

### Session 13: RAD Server & Client Setup (RAD Ch 3-4)

#### Objectives
- [ ] Configure RAD server components
- [ ] Set up form middleware
- [ ] Initialize client application
- [ ] Connect frontend to backend

#### little-trader Code Mapping

| Concept | File | Example |
|---------|------|---------|
| Server Config | `config.clj` | Configuration |
| Form Middleware | `components/database.clj` | Save/delete |
| Parser Setup | `components/parser.clj` | RAD pathom |
| Client Init | `ui/client.cljs` | App initialization |

#### Tasks

```markdown
## Session 13 Tasks

### Task 13.1: Document Server Setup
- [ ] Document configuration files
- [ ] Show middleware chain
- [ ] Explain parser composition

### Task 13.2: Enhance Form Middleware
- [ ] Add validation middleware
- [ ] Implement audit logging
- [ ] Add transaction hooks

### Task 13.3: Client Configuration
- [ ] Document client setup
- [ ] Add error boundaries
- [ ] Implement reconnection logic

### Completion Criteria
- [ ] Server setup documented
- [ ] Middleware enhanced
- [ ] Client robust
```

#### Course Day 13: RAD Server and Client

**Morning (Theory)**
- RAD server architecture
- Form middleware patterns
- Pathom integration
- Client initialization

**Afternoon (Practice)**
- Configure server components
- Add form middleware
- Set up client app
- Connect UI to API

**Exercises**
1. Add validation middleware
2. Implement save audit logging
3. Configure client error handling

---

### Session 14: Database Adapters (RAD Ch 5)

#### Objectives
- [ ] Master Datomic adapter
- [ ] Generate resolvers from attributes
- [ ] Implement custom resolvers
- [ ] Handle database transactions

#### little-trader Code Mapping

| Concept | File | Example |
|---------|------|---------|
| Datomic Setup | `components/database.clj` | Connection |
| Schema Generation | `data/schema.clj` | `generate-schema` |
| Auto Resolvers | `components/parser.clj` | Generated resolvers |
| Custom Resolvers | `components/resolvers.clj` | Hand-written |

#### Tasks

```markdown
## Session 14 Tasks

### Task 14.1: Document Database Layer
- [ ] Document schema generation
- [ ] Show resolver composition
- [ ] Explain connection management

### Task 14.2: Enhance Schema
- [ ] Add schema migrations
- [ ] Implement schema validation
- [ ] Add documentation

### Task 14.3: Custom Resolver Patterns
- [ ] Document resolver patterns
- [ ] Add complex query resolver
- [ ] Implement batch resolver

### Completion Criteria
- [ ] Database layer documented
- [ ] Schema enhanced
- [ ] Resolvers optimized
```

#### Course Day 14: Database Adapters

**Morning (Theory)**
- Datomic adapter architecture
- Schema generation from attributes
- Resolver auto-generation
- Custom resolver patterns

**Afternoon (Practice)**
- Read database component code
- Add schema migration
- Create custom resolver
- Implement batch loading

**Exercises**
1. Add new entity schema
2. Create resolver with joins
3. Implement resolver caching

---

### Session 15: RAD Forms Deep Dive (RAD Ch 6 - Forms)

#### Objectives
- [ ] Master defsc-form patterns
- [ ] Implement form customization
- [ ] Handle file uploads
- [ ] Support dynamic forms

#### little-trader Code Mapping

| Concept | File | Example |
|---------|------|---------|
| defsc-form | `ui/account_forms.cljc` | AccountForm |
| Field Config | Various | `:fo/` options |
| Validation | Form attributes | Required, format |
| Upload | (To implement) | File handling |

#### Tasks

```markdown
## Session 15 Tasks

### Task 15.1: Document Form System
- [ ] Catalog all forms
- [ ] Document configuration options
- [ ] Show rendering customization

### Task 15.2: Enhance Existing Forms
- [ ] Add field-level validation
- [ ] Implement conditional fields
- [ ] Add form sections

### Task 15.3: Create Advanced Form
- [ ] Implement "Backtest Configuration" form
- [ ] Add date range pickers
- [ ] Handle complex validation

### Task 15.4: File Upload
- [ ] Add strategy import form
- [ ] Implement CSV upload
- [ ] Handle validation

### Completion Criteria
- [ ] Forms enhanced
- [ ] New form working
- [ ] Upload functional
```

#### Course Day 15: RAD Forms

**Morning (Theory)**
- defsc-form macro
- Field configuration options
- Form lifecycle
- Validation strategies

**Afternoon (Practice)**
- Analyze existing forms
- Add field validation
- Create complex form
- Implement file upload

**Exercises**
1. Add date validation to trade form
2. Create multi-section strategy form
3. Implement CSV import form

---

### Session 16: RAD Reports Deep Dive (RAD Ch 6 - Reports)

#### Objectives
- [ ] Master defsc-report patterns
- [ ] Implement column formatters
- [ ] Add filtering and sorting
- [ ] Create dashboard reports

#### little-trader Code Mapping

| Concept | File | Example |
|---------|------|---------|
| defsc-report | `ui/trade_forms.cljc` | TradeList |
| Columns | Various | `:ro/columns` |
| Formatters | `ui/balance_reports.cljc` | Currency, date |
| Filters | Reports | Status filter |

#### Tasks

```markdown
## Session 16 Tasks

### Task 16.1: Document Report System
- [ ] Catalog all reports
- [ ] Document column options
- [ ] Show customization patterns

### Task 16.2: Enhance Existing Reports
- [ ] Add column sorting
- [ ] Implement pagination
- [ ] Add export functionality

### Task 16.3: Create Dashboard Report
- [ ] Implement "Trading Dashboard" report
- [ ] Add charts integration
- [ ] Show real-time updates

### Task 16.4: Advanced Report Features
- [ ] Add row grouping
- [ ] Implement aggregations
- [ ] Create drill-down

### Completion Criteria
- [ ] Reports enhanced
- [ ] Dashboard implemented
- [ ] Advanced features working
```

#### Course Day 16: RAD Reports

**Morning (Theory)**
- defsc-report macro
- Column configuration
- Data formatting
- Filtering and sorting

**Afternoon (Practice)**
- Analyze existing reports
- Add sorting and filtering
- Create dashboard report
- Implement export

**Exercises**
1. Add sorting to trade list
2. Create performance metrics report
3. Implement CSV export

---

## Completion Checklist

### Phase 1: Fulcro Fundamentals (Sessions 1-6)
- [x] Session 1: Foundations complete (Learn Studio, REPL, Chat)
- [ ] Session 2: Core API complete
- [ ] Session 3: State complete
- [ ] Session 4: Mutations complete
- [ ] Session 5: Networking complete
- [ ] Session 6: Custom Types complete

### Phase 2: Fulcro Advanced (Sessions 7-11)
- [ ] Session 7: Routing complete
- [ ] Session 8: Forms complete
- [ ] Session 9: Security complete
- [ ] Session 10: Testing complete
- [ ] Session 11: Advanced complete

### Phase 3: RAD Deep Dive (Sessions 12-16)
- [ ] Session 12: Attributes complete
- [ ] Session 13: Setup complete
- [ ] Session 14: Database complete
- [ ] Session 15: Forms complete
- [ ] Session 16: Reports complete

### Final Integration
- [ ] All documentation updated
- [ ] All code examples working
- [ ] Test coverage adequate
- [ ] Production ready

---

## Course Curriculum

### Overview

This curriculum transforms the 16 sessions into a structured learning path:

| Week | Sessions | Focus |
|------|----------|-------|
| Week 1 | 1-3 | Fulcro Foundations |
| Week 2 | 4-6 | Data Flow |
| Week 3 | 7-8 | UI Patterns |
| Week 4 | 9-11 | Production Ready |
| Week 5 | 12-14 | RAD Core |
| Week 6 | 15-16 | RAD UI |

### Prerequisites

- Basic Clojure/ClojureScript knowledge
- Understanding of web development
- Familiarity with React concepts
- Command line comfort

### Learning Outcomes

By completing this curriculum, you will:

1. **Understand** Fulcro's normalized database model
2. **Build** full-stack applications with EQL
3. **Master** the RAD form and report system
4. **Implement** production-grade trading UIs
5. **Apply** best practices for testing and security

### Resources

- [Fulcro Developer's Guide](https://book.fulcrologic.com/)
- [Fulcro RAD Developer's Guide](https://book.fulcrologic.com/RAD.html)
- [little-trader Codebase](.)
- [Fulcro Community](https://fulcro-community.github.io/)

---

## Appendix: File Reference

### Model Files (RAD Attributes)
```
src/com/little_trader/model/
├── account.cljc       # Account entity: name, exchange, mode, balance
├── trade.cljc         # Trade entity: symbol, side, prices, P&L
├── strategy.cljc      # Strategy entity: renko config, signals
├── bar.cljc           # OHLCV bar data
├── brick.cljc         # Renko bricks
├── signal.cljc        # Trading signals
├── balance.cljc       # Balance snapshots
├── option.cljc        # Options contracts
└── model.cljc         # Aggregator: all-attributes
```

### UI Files (Components)
```
src/com/little_trader/ui/
├── app.cljs           # Root application, header, footer
├── chart.cljs         # TradingView chart integration
├── trade_panel.cljs   # Real-time trade management
├── state.cljs         # Client-side state atom
├── mutations.cljs     # EQL transaction layer
├── account_forms.cljc # Account form and list
├── trade_forms.cljc   # Trade form and list
├── strategy_forms.cljc# Strategy form and list
└── balance_reports.cljc# Balance and performance reports
```

### Server Files
```
src/com/little_trader/
├── main.clj           # Application entry point
├── config.clj         # Configuration management
├── server/
│   ├── core.clj       # Ring app, routes, handlers
│   └── ws.clj         # WebSocket handler
└── components/
    ├── database.clj   # Datomic connection
    ├── parser.clj     # Pathom3 parser
    ├── resolvers.clj  # Custom resolvers
    └── middleware.clj # HTTP middleware
```

### Domain Files (Pure Logic)
```
src/com/little_trader/domain/
├── renko.clj          # Brick generation
├── signals.clj        # Signal detection
├── trades.clj         # Trade lifecycle
├── risk.clj           # Risk management
├── options.clj        # Options pricing
└── options_signals.clj# Options signals
```

---

*Last updated: Session 1 completed (2025-12-08)*
*Next: Execute Session 2 - Core API & EQL*

### Session 1 Deliverables

| File | Description |
|------|-------------|
| `ui/learn.cljs` | Course content with chapters 1-5 |
| `ui/learn_studio.cljs` | Integrated learning environment |
| `ui/repl.cljs` | REPL code evaluation UI |
| `ui/chat.cljs` | AI Chat assistant UI |
| `server/learn_api.clj` | Server-side REPL & Chat handlers |
| `css/learn.css` | Styling for learning components |

**To access:** Navigate to "Learn" in the navigation menu
