# Cloud Staging Environment with MCP Integration

**Claude Code + REPL-Driven Cloud Development**

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Cloud Staging Infrastructure](#cloud-staging-infrastructure)
4. [MCP Integration Strategy](#mcp-integration-strategy)
5. [Implementation Plan](#implementation-plan)
6. [MCP Interactions Analysis](#mcp-interactions-analysis)
7. [Security Considerations](#security-considerations)
8. [CI/CD Integration](#cicd-integration)
9. [Early Adoption Techniques](#early-adoption-techniques)
10. [Local Development Setup](#local-development-setup)
11. [Troubleshooting Guide](#troubleshooting-guide)

---

## Executive Summary

This document outlines the architecture for a **cloud staging environment** that enables:

- **Claude Code MCP Connection**: Direct connection to a running Clojure nREPL in the cloud
- **Seamless CI/CD**: GitOps-driven deployments with ArgoCD
- **REPL-Driven Development**: Hot-reload capabilities in a cloud-native environment
- **Claude Desktop Support**: Local connection for interactive development
- **Vanguard Dev Stack**: Cutting-edge tools combining MCP, LLM, and Cloud technologies

### Key Benefits

| Benefit | Description |
|---------|-------------|
| **Live REPL Access** | Claude Code evaluates code directly in running staging environment |
| **Zero Local Setup** | Develop against cloud resources without local configuration |
| **Consistent Environment** | Same infrastructure as production |
| **AI-Assisted Development** | MCP provides context and tools for Claude |
| **Instant Feedback** | Hot-reload without rebuilding containers |

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEVELOPER WORKSTATION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Claude Code    │  │  Claude Desktop │  │  IDE (Emacs/    │              │
│  │  CLI            │  │  App            │  │  VSCode/IDEA)   │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                        │
│           └────────────────────┼────────────────────┘                        │
│                                │                                             │
│                    ┌───────────▼───────────┐                                 │
│                    │   MCP Client Layer    │                                 │
│                    │   (stdio transport)   │                                 │
│                    └───────────┬───────────┘                                 │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   clojure-mcp Server    │
                    │   (Local MCP Process)   │
                    │   - nREPL Client        │
                    │   - File Tools          │
                    │   - Syntax Repair       │
                    └────────────┬────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │ SSH Tunnel / VPN    │
           │                     │ Port Forward        │
           │                     │                     │
┌──────────▼─────────────────────▼─────────────────────▼───────────────────────┐
│                         KUBERNETES CLUSTER (EKS/GKE)                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                     STAGING NAMESPACE                                    │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                          │ │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐ │ │
│  │  │ little-trader Pod   │  │ nREPL Service       │  │ MCP Gateway Pod  │ │ │
│  │  │ ┌─────────────────┐ │  │                     │  │ (Optional)       │ │ │
│  │  │ │ App Container   │ │  │ Port: 7888          │  │                  │ │ │
│  │  │ │ - HTTP :8080    │ │  │ Type: ClusterIP     │  │ - Auth Proxy     │ │ │
│  │  │ │ - nREPL :7888   │◀┼──┤ Selector:           │  │ - Rate Limiting  │ │ │
│  │  │ │ - WebSocket     │ │  │   app: little-trader│  │ - Audit Logging  │ │ │
│  │  │ └─────────────────┘ │  └─────────────────────┘  └──────────────────┘ │ │
│  │  │                     │                                                 │ │
│  │  │  Volumes:           │  ┌─────────────────────┐                        │ │
│  │  │  - /app/src (RWX)   │  │ ConfigMap           │                        │ │
│  │  │  - /app/.m2 (cache) │  │ - nrepl-config.edn  │                        │ │
│  │  │  - /app/resources   │  │ - mcp-tools.edn     │                        │ │
│  │  └─────────────────────┘  └─────────────────────┘                        │ │
│  │                                                                          │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                     SUPPORTING SERVICES                              │ │ │
│  │  ├─────────────────────────────────────────────────────────────────────┤ │ │
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐ │ │ │
│  │  │  │ Datomic   │  │ Kafka     │  │ Redis     │  │ File Sync Service │ │ │ │
│  │  │  │ (Dev Mode)│  │ (Staging) │  │ (Cache)   │  │ (Code Sync)       │ │ │ │
│  │  │  └───────────┘  └───────────┘  └───────────┘  └───────────────────┘ │ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                     GITOPS / CI-CD                                       │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌─────────────────────────────┐  │ │
│  │  │ ArgoCD        │  │ GitHub Actions│  │ Container Registry (ECR)    │  │ │
│  │  │ - Auto Sync   │  │ - Build/Test  │  │ - Image Storage             │  │ │
│  │  │ - Rollback    │  │ - Push Images │  │ - Vulnerability Scan        │  │ │
│  │  └───────────────┘  └───────────────┘  └─────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **clojure-mcp** | Local MCP server connecting Claude to remote nREPL |
| **nREPL Service** | Exposes REPL inside staging pod for remote evaluation |
| **File Sync** | Syncs code changes bidirectionally (local ↔ cloud) |
| **MCP Gateway** | Optional auth proxy for secure external access |
| **ArgoCD** | GitOps controller for continuous deployment |

---

## Cloud Staging Infrastructure

### Kubernetes Configuration

#### Staging Deployment with nREPL

**`k8s/staging/deployment.yaml`**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: little-trader-staging
  namespace: staging
  labels:
    app: little-trader
    environment: staging
    mcp-enabled: "true"
spec:
  replicas: 1  # Single replica for REPL state consistency
  strategy:
    type: Recreate  # Avoid multiple REPL instances
  selector:
    matchLabels:
      app: little-trader
      environment: staging
  template:
    metadata:
      labels:
        app: little-trader
        environment: staging
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
    spec:
      serviceAccountName: little-trader-staging
      containers:
      - name: little-trader
        image: ghcr.io/4coders-com-br/little-trader:staging
        imagePullPolicy: Always
        ports:
        - name: http
          containerPort: 8080
          protocol: TCP
        - name: nrepl
          containerPort: 7888
          protocol: TCP
        - name: shadow-cljs
          containerPort: 9630
          protocol: TCP
        env:
        - name: ENVIRONMENT
          value: "staging"
        - name: NREPL_ENABLED
          value: "true"
        - name: NREPL_PORT
          value: "7888"
        - name: NREPL_HOST
          value: "0.0.0.0"
        - name: DATOMIC_URI
          valueFrom:
            secretKeyRef:
              name: little-trader-secrets
              key: datomic-uri
        - name: LOG_LEVEL
          value: "debug"
        - name: HOT_RELOAD
          value: "true"
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2
            memory: 4Gi
        volumeMounts:
        - name: source-code
          mountPath: /app/src
        - name: maven-cache
          mountPath: /root/.m2
        - name: nrepl-config
          mountPath: /app/nrepl-config
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: source-code
        persistentVolumeClaim:
          claimName: staging-source-pvc
      - name: maven-cache
        persistentVolumeClaim:
          claimName: maven-cache-pvc
      - name: nrepl-config
        configMap:
          name: nrepl-config
```

#### nREPL Service Configuration

**`k8s/staging/nrepl-service.yaml`**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: nrepl
  namespace: staging
  labels:
    app: little-trader
    component: nrepl
  annotations:
    description: "nREPL service for MCP/Claude Code connection"
spec:
  type: ClusterIP
  ports:
  - name: nrepl
    port: 7888
    targetPort: 7888
    protocol: TCP
  selector:
    app: little-trader
    environment: staging
---
apiVersion: v1
kind: Service
metadata:
  name: nrepl-external
  namespace: staging
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-internal: "true"
spec:
  type: LoadBalancer
  ports:
  - name: nrepl
    port: 7888
    targetPort: 7888
  selector:
    app: little-trader
    environment: staging
```

#### nREPL ConfigMap

**`k8s/staging/nrepl-configmap.yaml`**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nrepl-config
  namespace: staging
data:
  nrepl.edn: |
    {:port 7888
     :bind "0.0.0.0"
     :middleware [cider.nrepl/cider-middleware]
     :handler cider.nrepl/cider-nrepl-handler
     :transport nrepl.transport/bencode}

  dev-init.clj: |
    (ns user
      (:require [mount.core :as mount]
                [com.little-trader.main :as main]
                [clojure.tools.namespace.repl :as tn]))

    (defn start! []
      (mount/start))

    (defn stop! []
      (mount/stop))

    (defn reset! []
      (stop!)
      (tn/refresh :after 'user/start!))

    (println ">>> Staging REPL ready. Use (start!) to begin.")
```

### Terraform Infrastructure

**`infrastructure/staging/main.tf`**:
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

module "eks_staging" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "little-trader-staging"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_private_access = true
  cluster_endpoint_public_access  = true

  eks_managed_node_groups = {
    staging = {
      min_size     = 1
      max_size     = 3
      desired_size = 2
      instance_types = ["t3.large"]
      capacity_type  = "SPOT"

      labels = {
        environment = "staging"
        mcp-enabled = "true"
      }
    }
  }

  tags = {
    Environment = "staging"
    MCP         = "enabled"
  }
}

resource "aws_security_group" "nrepl" {
  name        = "nrepl-staging"
  description = "Allow nREPL connections from VPN"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 7888
    to_port     = 7888
    protocol    = "tcp"
    cidr_blocks = ["10.100.0.0/16"]
    description = "nREPL from VPN"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

---

## MCP Integration Strategy

### Option 1: clojure-mcp (Full Features) - Recommended for Claude Desktop

**Best for**: Claude Desktop users who want full MCP server capabilities

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude Desktop │────▶│  clojure-mcp    │────▶│  Cloud nREPL    │
│  (Local)        │     │  (Local Server) │     │  (K8s Pod)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Installation**:

1. Add to `~/.clojure/deps.edn`:
```clojure
{:aliases
 {:mcp {:deps {org.slf4j/slf4j-nop {:mvn/version "2.0.16"}
               com.bhauman/clojure-mcp {:git/url "https://github.com/bhauman/clojure-mcp.git"
                                        :git/tag "v0.1.12"
                                        :git/sha "79b9d5a"}}
        :exec-fn clojure-mcp.main/start-mcp-server
        :exec-args {:port 7888}}}}
```

2. Configure Claude Desktop:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "clojure-little-trader": {
      "command": "/bin/bash",
      "args": [
        "-c",
        "kubectl -n staging port-forward svc/nrepl 7888:7888 & sleep 2 && clojure -X:mcp :port 7888"
      ],
      "env": {
        "KUBECONFIG": "${HOME}/.kube/config"
      }
    }
  }
}
```

### Option 2: clojure-mcp-light - Recommended for Claude Code CLI

**Best for**: Claude Code CLI users who want minimal overhead with hook-based integration

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude Code    │────▶│  Claude Hooks   │────▶│  Cloud nREPL    │
│  (Terminal)     │     │  + clj-nrepl-   │     │  (K8s Pod)      │
│                 │     │    eval         │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Installation**:

```bash
# Install via bbin (Babashka package manager)
bbin install https://github.com/bhauman/clojure-mcp-light.git --tag v0.2.0

bbin install https://github.com/bhauman/clojure-mcp-light.git --tag v0.2.0 \
  --as clj-nrepl-eval --main-opts '["-m" "clojure-mcp-light.nrepl-eval"]'
```

**Configure Claude Code** (`~/.claude/settings.json`):
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "clj-paren-repair-claude-hook --cljfmt"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "clj-paren-repair-claude-hook --cljfmt"
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "clj-paren-repair-claude-hook --cljfmt"
          }
        ]
      }
    ]
  }
}
```

### Option 3: Direct Cloud MCP Server (Advanced)

**Best for**: Team-wide shared MCP access with enterprise security

**`k8s/staging/mcp-server.yaml`**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-server
  namespace: staging
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mcp-server
  template:
    metadata:
      labels:
        app: mcp-server
    spec:
      containers:
      - name: mcp-server
        image: ghcr.io/4coders-com-br/little-trader-mcp:latest
        ports:
        - containerPort: 5000
        env:
        - name: NREPL_HOST
          value: "nrepl.staging.svc.cluster.local"
        - name: NREPL_PORT
          value: "7888"
        - name: MCP_AUTH_ENABLED
          value: "true"
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mcp-server
  namespace: staging
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - mcp.staging.little-trader.dev
    secretName: mcp-tls
  rules:
  - host: mcp.staging.little-trader.dev
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: mcp-server
            port:
              number: 5000
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

| Task | Priority | Description |
|------|----------|-------------|
| Create staging K8s namespace | High | `kubectl create namespace staging` |
| Deploy nREPL-enabled staging pod | High | Apply deployment manifests |
| Configure VPN/bastion access | High | Secure network path to cluster |
| Set up port-forwarding scripts | Medium | Helper scripts for developers |
| Test basic nREPL connectivity | High | Verify REPL responds |

**Validation Checklist**:
- [ ] `kubectl -n staging get pods` shows running pod
- [ ] `kubectl -n staging port-forward svc/nrepl 7888:7888` works
- [ ] `echo "(+ 1 2 3)" | nc localhost 7888` returns `6`

### Phase 2: MCP Integration (Week 2)

| Task | Priority | Description |
|------|----------|-------------|
| Install clojure-mcp locally | High | Add to deps.edn |
| Configure Claude Desktop | High | MCP server configuration |
| Install clojure-mcp-light | Medium | For Claude Code users |
| Configure Claude Code hooks | Medium | Pre/Post tool hooks |
| Create connection automation | Medium | Scripts for easy startup |
| Test code evaluation | High | End-to-end MCP flow |

**Validation Checklist**:
- [ ] Claude Desktop shows "clojure-little-trader" MCP server
- [ ] `clj-paren-repair-claude-hook` fixes syntax errors
- [ ] Claude can evaluate Clojure code in staging

### Phase 3: CI/CD Integration (Week 3)

| Task | Priority | Description |
|------|----------|-------------|
| Set up ArgoCD | High | Install and configure ArgoCD |
| Configure GitOps workflow | High | App of Apps pattern |
| Implement auto-sync | Medium | Automatic deployment on push |
| Add staging pipeline triggers | Medium | GitHub Actions integration |
| Configure rollback procedures | Medium | One-click rollback |

**Validation Checklist**:
- [ ] ArgoCD UI accessible
- [ ] Push to main triggers staging deploy
- [ ] Rollback restores previous version

### Phase 4: Hot Reload & DevX (Week 4)

| Task | Priority | Description |
|------|----------|-------------|
| Implement file sync | High | Local changes → cloud |
| Configure tools.namespace | High | REPL refresh workflow |
| Set up shadow-cljs in staging | Medium | Frontend hot reload |
| Test hot reload workflow | High | End-to-end verification |
| Document developer workflow | Medium | Onboarding guide |

**Validation Checklist**:
- [ ] Code change locally → `(reset!)` → changes live in staging
- [ ] shadow-cljs watch works in staging
- [ ] Developer can iterate without container restart

### Phase 5: Security Hardening (Week 5)

| Task | Priority | Description |
|------|----------|-------------|
| Implement MCP authentication | High | OAuth2/API keys |
| Add audit logging | High | All REPL evals logged |
| Configure rate limiting | Medium | Prevent abuse |
| Security review | High | Penetration testing |
| Document security model | Medium | Compliance docs |

### Phase 6: Team Rollout (Week 6)

| Task | Priority | Description |
|------|----------|-------------|
| Team training sessions | High | Hands-on workshops |
| Create onboarding docs | High | Step-by-step guides |
| Set up team access | High | RBAC configuration |
| Gather feedback | Medium | Iterate on workflow |
| Production readiness review | High | Go/no-go decision |

---

## MCP Interactions Analysis

### Interaction Types and Assessment

#### 1. Code Evaluation in Cloud REPL

```clojure
;; Claude evaluates code in staging
(d/q '[:find (pull ?e [*])
       :where [?e :trade/status :open]]
     @db/conn)
```

| Aspect | Assessment |
|--------|------------|
| **Pros** | Real data, real environment, immediate feedback |
| **Cons** | Network latency (50-200ms), shared state risks |
| **Risk Level** | Low (read operations) to High (mutations) |
| **Mitigation** | Read-only default, approval for mutations |

#### 2. Hot Code Reload

```clojure
;; Claude modifies code, triggers reload
(require 'com.little-trader.domain.signals :reload)
;; or full refresh
(clojure.tools.namespace.repl/refresh)
```

| Aspect | Assessment |
|--------|------------|
| **Pros** | Instant feedback, no container rebuild |
| **Cons** | State can become stale, memory accumulation |
| **Risk Level** | Medium |
| **Mitigation** | Regular pod restarts, state monitoring |

#### 3. Integration Testing

```clojure
;; Claude runs tests against staging
(kaocha.repl/run :integration)
```

| Aspect | Assessment |
|--------|------------|
| **Pros** | Tests against real infrastructure |
| **Cons** | Slower, can affect shared resources |
| **Risk Level** | Medium |
| **Mitigation** | Isolated test namespaces, cleanup hooks |

#### 4. Database Operations

```clojure
;; Queries (safe)
(d/q '[:find ?e :where [?e :trade/id _]] db)

;; Mutations (dangerous)
(d/transact conn [{:trade/id "new" :trade/status :open}])
```

| Aspect | Assessment |
|--------|------------|
| **Pros** | Real data access, time-travel debugging |
| **Cons** | Data corruption risk, PII exposure |
| **Risk Level** | High for mutations |
| **Mitigation** | Read-only by default, transaction approval |

### Comprehensive Pros/Cons Matrix

| Interaction | Latency | Risk | Value | Complexity | Recommendation |
|-------------|---------|------|-------|------------|----------------|
| Code Evaluation | Medium | Low | High | Low | Enable by default |
| Hot Reload | Low | Medium | Very High | Medium | Enable with monitoring |
| Integration Tests | High | Medium | High | Low | Enable with isolation |
| DB Queries | Medium | Low | Very High | Low | Enable by default |
| DB Mutations | Medium | Very High | High | Medium | Require approval |
| Performance Profiling | High | Low | Very High | Medium | Enable on demand |
| Log Analysis | Low | None | Medium | Low | Enable by default |
| Metrics Queries | Low | None | Medium | Low | Enable by default |

### Risk Mitigation Strategies

| Risk | Strategy | Implementation |
|------|----------|----------------|
| Data corruption | Read-only REPL by default | nREPL middleware |
| Resource exhaustion | Rate limiting | Nginx/Kong gateway |
| State inconsistency | Automatic pod restart | K8s CronJob |
| Security exposure | VPN + RBAC | AWS Client VPN |
| Accidental production access | Visual indicators | REPL prompt coloring |

---

## Security Considerations

### Access Control Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Network (VPN)                                      │
│  ├── Certificate-based authentication                        │
│  ├── IP whitelisting                                         │
│  └── TLS encryption                                          │
│                                                              │
│  Layer 2: Kubernetes RBAC                                    │
│  ├── Namespace isolation                                     │
│  ├── Port-forward permissions                                │
│  └── Pod exec restrictions                                   │
│                                                              │
│  Layer 3: nREPL Security                                     │
│  ├── Internal binding only                                   │
│  ├── Session timeouts                                        │
│  └── Operation whitelisting                                  │
│                                                              │
│  Layer 4: Audit & Monitoring                                 │
│  ├── All evaluations logged                                  │
│  ├── Anomaly detection                                       │
│  └── Alert on suspicious patterns                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### RBAC Configuration

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: mcp-developer
  namespace: staging
rules:
- apiGroups: [""]
  resources: ["pods/portforward"]
  verbs: ["create"]
- apiGroups: [""]
  resources: ["pods", "services"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods/exec"]
  verbs: ["create"]
  resourceNames: ["little-trader-staging-*"]
```

### Audit Logging

```clojure
(ns com.little-trader.nrepl.audit
  (:require [taoensso.timbre :as log]
            [cheshire.core :as json]))

(defn wrap-audit-logging [handler]
  (fn [{:keys [op code session] :as msg}]
    (when (= op "eval")
      (log/info
        (json/generate-string
          {:event "nrepl-eval"
           :timestamp (System/currentTimeMillis)
           :session session
           :code-preview (subs code 0 (min 100 (count code)))
           :user (System/getenv "NREPL_USER")})))
    (handler msg)))
```

---

## CI/CD Integration

### GitOps with ArgoCD

**`argocd/staging-app.yaml`**:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: little-trader-staging
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/4coders-com-br/little-trader.git
    targetRevision: main
    path: k8s/staging
  destination:
    server: https://kubernetes.default.svc
    namespace: staging
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

### GitHub Actions Integration

**`.github/workflows/staging-deploy.yaml`**:
```yaml
name: Deploy to Staging

on:
  push:
    branches: [main, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Setup Clojure
      uses: DeLaGuardo/setup-clojure@master
      with:
        cli: latest

    - name: Run tests
      run: clj -M:test

    - name: Build Docker image
      run: |
        docker build \
          --build-arg NREPL_ENABLED=true \
          -t ghcr.io/4coders-com-br/little-trader:staging \
          .

    - name: Push to GHCR
      run: |
        echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
        docker push ghcr.io/4coders-com-br/little-trader:staging

    - name: Trigger ArgoCD Sync
      run: |
        curl -X POST \
          -H "Authorization: Bearer ${{ secrets.ARGOCD_TOKEN }}" \
          https://argocd.little-trader.dev/api/v1/applications/little-trader-staging/sync
```

---

## Early Adoption Techniques

### 1. AI-Native Development Patterns

```clojure
;; Annotate functions for AI assistance
(defn ^{:ai/generate-tests true
        :ai/complexity :high}
  calculate-trailing-stop
  "Calculate dynamic trailing stop based on profit levels.
   AI should generate comprehensive edge case tests."
  [entry-price current-price profit-ranges]
  ;; Implementation
  )
```

### 2. DevContainer with MCP Support

**`.devcontainer/devcontainer.json`**:
```json
{
  "name": "Little Trader Dev",
  "image": "ghcr.io/4coders-com-br/little-trader-devcontainer:latest",
  "features": {
    "ghcr.io/devcontainers/features/kubectl-helm-minikube:1": {}
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "betterthantomorrow.calva",
        "anthropic.claude-code"
      ]
    }
  },
  "forwardPorts": [7888, 8080, 3000],
  "postCreateCommand": "bbin install https://github.com/bhauman/clojure-mcp-light.git --tag v0.2.0"
}
```

### 3. AI-Assisted Code Review

```yaml
# .github/workflows/ai-review.yaml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: AI Review
      env:
        ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      run: |
        claude-code review --context "Clojure trading system"
```

### 4. Observability Integration

```yaml
# Prometheus rules for MCP monitoring
groups:
- name: mcp-usage
  rules:
  - alert: HighREPLUsage
    expr: rate(nrepl_evaluations_total[5m]) > 100
    labels:
      severity: warning
    annotations:
      summary: "High REPL usage detected"
```

### 5. Cloud IDE Integration (Gitpod/Codespaces)

**`.gitpod.yml`**:
```yaml
tasks:
  - name: Setup
    init: |
      brew install clojure babashka
      bbin install https://github.com/bhauman/clojure-mcp-light.git --tag v0.2.0
    command: |
      kubectl -n staging port-forward svc/nrepl 7888:7888 &
      clj -M:dev

ports:
  - port: 7888
    onOpen: ignore
  - port: 8080
    onOpen: open-preview
```

---

## Local Development Setup

### Quick Start Guide

```bash
# 1. Install prerequisites
brew install clojure babashka kubectl

# 2. Install clojure-mcp-light
bbin install https://github.com/bhauman/clojure-mcp-light.git --tag v0.2.0
bbin install https://github.com/bhauman/clojure-mcp-light.git --tag v0.2.0 \
  --as clj-nrepl-eval --main-opts '["-m" "clojure-mcp-light.nrepl-eval"]'

# 3. Configure kubectl for staging
aws eks update-kubeconfig --name little-trader-staging --region us-east-1

# 4. Test connection
kubectl -n staging get pods

# 5. Start port forward
kubectl -n staging port-forward svc/nrepl 7888:7888 &

# 6. Test REPL connection
echo "(+ 1 2 3)" | nc localhost 7888

# 7. Start Claude Code
cd /path/to/little-trader
claude
```

### IDE Integration

#### Emacs/CIDER

```elisp
;; .dir-locals.el
((clojure-mode
  (cider-preferred-build-tool . clojure-cli)
  (cider-clojure-cli-aliases . ":dev")
  (cider-connect-host . "localhost")
  (cider-connect-port . 7888)))
```

#### VSCode/Calva

```json
{
  "calva.replConnectSequences": [
    {
      "name": "Cloud Staging",
      "projectType": "deps.edn",
      "connectHost": "localhost",
      "connectPort": 7888
    }
  ]
}
```

---

## Troubleshooting Guide

### Common Issues

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| "Connection refused" | Port forward not running | `kubectl -n staging port-forward svc/nrepl 7888:7888` |
| "nREPL not responding" | Pod not ready | Check pod status: `kubectl -n staging get pods` |
| "Permission denied" | RBAC issue | Verify kubectl context and permissions |
| "Network timeout" | VPN disconnected | Reconnect to VPN |
| "Namespace not found" | Code not loaded | Run `(require 'namespace :reload)` |
| "Stale state" | Old definitions cached | Run `(user/reset!)` |

### Debug Commands

```bash
# Check pod status
kubectl -n staging get pods -l app=little-trader

# View pod logs
kubectl -n staging logs -f deployment/little-trader-staging

# Test nREPL port
kubectl -n staging exec -it deployment/little-trader-staging -- nc -zv localhost 7888

# Interactive shell
kubectl -n staging exec -it deployment/little-trader-staging -- /bin/bash

# Test REPL eval
echo '(+ 1 2)' | nc localhost 7888
```

---

## Summary

This architecture provides:

| Capability | Implementation |
|------------|----------------|
| Cloud-Native REPL | nREPL exposed via K8s service |
| Claude Code Integration | clojure-mcp-light + hooks |
| Claude Desktop Support | clojure-mcp full server |
| GitOps CI/CD | ArgoCD auto-sync |
| Security | VPN + RBAC + Audit |
| Hot Reload | tools.namespace refresh |

### Key References

- [clojure-mcp](https://github.com/bhauman/clojure-mcp) - Full MCP server
- [clojure-mcp-light](https://github.com/bhauman/clojure-mcp-light) - Minimal Claude Code tools
- [Model Context Protocol](https://docs.claude.com/en/docs/mcp) - Official MCP docs
- [ArgoCD](https://argo-cd.readthedocs.io/) - GitOps CD
- [DevSpace](https://www.devspace.sh/) - K8s dev tool
