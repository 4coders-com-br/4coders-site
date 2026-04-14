# C4 Architecture: UIx + Fulcro RAD Hybrid

This document describes the architectural integration of UIx (modern React) with Fulcro RAD for the Little Trader application.

## Navigation

- [Embedded Course and Manual](/Users/victorinacio/4coders/little-trader/docs/EMBEDDED_COURSE_AND_MANUAL.md)
- [Architecture Visual Guide](/Users/victorinacio/4coders/little-trader/docs/ARCHITECTURE_VISUAL_GUIDE.md)
- [News and Data Crawlers](/Users/victorinacio/4coders/little-trader/docs/NEWS_AND_DATA_CRAWLERS.md)

## Scope

This diagram set focuses on the current MVP slice:

- Fulcro RAD UI and in-app learning surfaces
- Pathom/EQL and backend routing
- Datomic, Pulsar, and exchange integrations
- Developer augmentation through REPL and MCP

## Container Diagram

```mermaid
C4Container
    title Container Diagram: UIx + Fulcro RAD Hybrid Architecture

    Person(user, "Trader", "Uses the trading application")

    Container_Boundary(frontend, "Frontend Application") {
        Container(uix_app, "UIx Application", "ClojureScript/React 18", "Real-time visualization: charts, trade panels, WebSocket state")
        Container(fulcro_app, "Fulcro RAD Application", "ClojureScript/Fulcro", "CRUD operations: forms, reports, routing, normalized state")
        Container(shared_state, "Shared State Layer", "Atoms + Fulcro DB", "Coordinates state between UIx and Fulcro")
    }

    Container_Boundary(backend, "Backend Services") {
        Container(http_server, "HTTP Server", "Clojure/Ring", "Serves API and static assets")
        Container(ws_server, "WebSocket Server", "Clojure/Sente", "Real-time market data streaming")
        Container(pathom, "Pathom3 Processor", "Clojure/Pathom3", "EQL query resolution with RAD plugins")
    }

    Container_Boundary(data, "Data Layer") {
        Container(rad_model, "RAD Attributes", "CLJC", "Attribute-based domain model definitions")
        ContainerDb(datomic, "Datomic", "Database", "Persistent entity storage with time-travel")
    }

    Rel(user, uix_app, "Views real-time data")
    Rel(user, fulcro_app, "Manages entities via CRUD")
    Rel(uix_app, shared_state, "Reads/writes")
    Rel(fulcro_app, shared_state, "Reads/writes")
    Rel(uix_app, ws_server, "Subscribes to market data", "WebSocket")
    Rel(fulcro_app, http_server, "Sends EQL mutations/queries", "HTTP/Transit")
    Rel(http_server, pathom, "Processes")
    Rel(ws_server, pathom, "Resolves queries")
    Rel(pathom, rad_model, "Uses attribute definitions")
    Rel(pathom, datomic, "Reads/writes entities")
```

## MVP Container Diagram

```mermaid
C4Container
    title Little Trader MVP Container Diagram

    Person(trader, "Trader / Developer", "Learns, inspects, and operates the system")

    Container_Boundary(app, "Little Trader App") {
        Container(ui, "Dashboard + Learn Studio", "ClojureScript/Fulcro", "Trading UI, embedded course, REPL, copilot")
        Container(api, "HTTP + Pathom API", "Clojure/Ring", "Auth, EQL, chat, REPL evaluation")
        Container(services, "Trading Services", "Clojure", "Deribit, MT5, Pulsar, rules, projections")
    }

    Container_Boundary(data, "Data and Infra") {
        ContainerDb(datomic, "Datomic", "Database", "Source of truth for entities and strategy state")
        Container(pulsar, "Pulsar", "Stream bus", "Raw ticks and projected bars")
        Container(external, "External Sources", "APIs and feeds", "Exchange, news, and crawler inputs")
    }

    Rel(trader, ui, "Uses")
    Rel(ui, api, "Reads and transacts")
    Rel(ui, services, "Observes runtime state")
    Rel(api, services, "Invokes domain logic")
    Rel(services, datomic, "Reads and writes")
    Rel(services, pulsar, "Consumes and publishes")
    Rel(services, external, "Fetches data from")
```

## Component Diagram: Frontend Integration

```mermaid
C4Component
    title Component Diagram: UIx + Fulcro Integration

    Container_Boundary(frontend, "Frontend Application") {
        
        Component_Ext(react_root, "React 18 Root", "Entry point for UIx rendering")
        Component_Ext(fulcro_root, "Fulcro Root", "Entry point for RAD components")
        
        Container_Boundary(uix_layer, "UIx Rendering Layer") {
            Component(uix_app, "app.cljs", "Main UIx component with header/footer")
            Component(uix_chart, "chart.cljs", "Real-time chart visualization")
            Component(uix_panel, "trade-panel.cljs", "Trade execution UI")
        }
        
        Container_Boundary(fulcro_layer, "Fulcro RAD Layer") {
            Component(rad_router, "MainRouter", "Dynamic routing for RAD views")
            Component(rad_forms, "RAD Forms", "account/trade/strategy forms")
            Component(rad_reports, "RAD Reports", "balance reports, listings")
        }
        
        Container_Boundary(state_layer, "State Management") {
            Component(uix_state, "state.cljs", "Atoms for real-time data (bars, bricks, signals)")
            Component(fulcro_db, "Fulcro App DB", "Normalized entity graph")
            Component(ws_client, "WebSocket Client", "Market data subscription")
        }
    }

    Rel(react_root, uix_app, "Renders")
    Rel(fulcro_root, rad_router, "Renders")
    Rel(uix_app, uix_chart, "Contains")
    Rel(uix_app, uix_panel, "Contains")
    Rel(rad_router, rad_forms, "Routes to")
    Rel(rad_router, rad_reports, "Routes to")
    Rel(uix_chart, uix_state, "Subscribes to bars/bricks")
    Rel(uix_panel, uix_state, "Reads/writes trades")
    Rel(rad_forms, fulcro_db, "Transacts entities")
    Rel(rad_reports, fulcro_db, "Queries entities")
    Rel(ws_client, uix_state, "Pushes market data")
```

## Component Diagram: Backend Processing

```mermaid
C4Component
    title Component Diagram: Pathom3 + RAD + Datomic

    Container_Boundary(backend, "Backend Services") {
        
        Container_Boundary(server_layer, "Server Layer") {
            Component(ring_handler, "Ring Handler", "HTTP request routing")
            Component(sente_ws, "Sente WebSocket", "Bidirectional comms")
            Component(middleware, "RAD Middleware", "Auth, parsing, response")
        }
        
        Container_Boundary(pathom_layer, "Pathom3 Processing") {
            Component(parser, "RAD Parser", "EQL processor with plugins")
            Component(rad_plugin, "RAD Attribute Plugin", "Auto-resolvers from attributes")
            Component(datomic_plugin, "RAD Datomic Plugin", "Save/delete middleware")
            Component(resolvers, "Custom Resolvers", "Domain-specific queries")
        }
        
        Container_Boundary(model_layer, "Domain Model") {
            Component(attributes, "RAD Attributes", "Identity, scalar, ref attributes")
            Component(validators, "Validators", "Attribute validation rules")
        }
        
        Container_Boundary(data_layer, "Data Layer") {
            Component(db_component, "Database Component", "Datomic connection management")
            Component(schema, "Datomic Schema", "Generated from RAD attributes")
        }
    }

    ContainerDb(datomic, "Datomic", "Entity storage")

    Rel(ring_handler, middleware, "Pipes through")
    Rel(sente_ws, middleware, "Pipes through")
    Rel(middleware, parser, "Invokes")
    Rel(parser, rad_plugin, "Uses")
    Rel(parser, datomic_plugin, "Uses")
    Rel(parser, resolvers, "Dispatches to")
    Rel(rad_plugin, attributes, "Reads")
    Rel(resolvers, attributes, "References")
    Rel(datomic_plugin, db_component, "Transacts via")
    Rel(db_component, datomic, "Connects to")
    Rel(schema, datomic, "Installed in")
    Rel(attributes, schema, "Generates")
```

## Data Flow Diagram

```mermaid
flowchart TB
    subgraph Frontend["Frontend Application"]
        subgraph UIx["UIx Layer (Real-time)"]
            Chart[Chart Component]
            Panel[Trade Panel]
            State[(Atoms State)]
        end
        
        subgraph Fulcro["Fulcro RAD Layer (CRUD)"]
            Forms[RAD Forms]
            Reports[RAD Reports]
            FDB[(Fulcro DB)]
        end
        
        WS[WebSocket Client]
    end
    
    subgraph Backend["Backend Services"]
        HTTP[HTTP Server]
        WSS[WebSocket Server]
        
        subgraph Pathom["Pathom3 Processor"]
            RAD[RAD Plugins]
            Resolvers[Resolvers]
        end
    end
    
    subgraph Data["Data Layer"]
        Model[RAD Attributes]
        Datomic[(Datomic)]
    end
    
    Chart --> State
    Panel --> State
    WS --> State
    
    Forms --> FDB
    Reports --> FDB
    
    FDB -->|EQL Mutations| HTTP
    HTTP --> Pathom
    
    WSS -->|Market Data| WS
    WSS --> Pathom
    
    Pathom --> Model
    Pathom --> Datomic
    
    RAD --> Model
    Resolvers --> Datomic
```

## Key Integration Points

1. **Dual Entry Points**: Both UIx (`app.cljs`) and Fulcro (`client.cljs`) have separate React roots
2. **State Isolation**: UIx uses atoms for real-time data; Fulcro uses normalized DB for entities
3. **Shared Backend**: Both frontends communicate through the same Pathom3 processor
4. **Attribute-Centric**: RAD attributes define schema, validation, and auto-resolvers
5. **Real-time vs CRUD**: UIx handles streaming data; Fulcro handles entity management

## Developer Augmentation View

```mermaid
flowchart LR
    Dev["Developer"] --> Editor["Editor / REPL"]
    Dev --> MCP["MCP Bridge"]
    MCP --> Backend["Clojure REPL"]
    MCP --> Frontend["ClojureScript REPL"]
    Editor --> App["Running App"]
    App --> Docs["Manual + Course + Architecture"]
    Docs --> Dev
```

The augmentation loop is intentional:

- The app teaches the system.
- The REPL verifies assumptions.
- MCP gives the assistant structured access.
- Docs explain the trust boundaries and workflow.
