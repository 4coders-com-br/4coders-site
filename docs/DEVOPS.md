# Little Trader - DevOps & Infrastructure

**Cloud-Native, Production-Grade Deployment**

> **Live Staging**: https://little-trader-staging-x4miahfzia-uc.a.run.app

## Table of Contents
1. [Cloud Run Deployment (Current)](#cloud-run-deployment-current)
2. [CI/CD Pipeline](#cicd-pipeline)
3. [SRE Operations](#sre-operations)
4. [Remote REPL Access](#remote-repl-access)
5. [Local Development](#local-development)
6. [Infrastructure as Code](#infrastructure-as-code)
7. [Kubernetes Deployment (Future)](#kubernetes-deployment-future)
8. [Monitoring & Observability](#monitoring--observability)
9. [Security & Secrets](#security--secrets)
10. [MCP-Enabled Staging](#mcp-enabled-staging)

---

## Cloud Run Deployment (Current)

The application is currently deployed to **Google Cloud Run** using a fully automated CI/CD pipeline.

### Live Environment

| Environment | URL | Status |
|-------------|-----|--------|
| **Staging** | https://little-trader-staging-x4miahfzia-uc.a.run.app | ✅ Live |
| Production | (Pending first deployment) | 🔜 Ready |

### Quick Commands

```bash
# Check health
curl https://little-trader-staging-x4miahfzia-uc.a.run.app/health

# View logs
gcloud run services logs read little-trader-staging --region=us-central1

# Deploy manually via CLI
gh workflow run "Deploy to Cloud Run" -f environment=staging

# Watch deployment
gh run watch $(gh run list --workflow="Deploy to Cloud Run" --limit 1 --json databaseId -q '.[0].databaseId')
```

### Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    GOOGLE CLOUD RUN                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌────────────────┐ │
│  │ GitHub Actions  │───▶│ Artifact        │───▶│ Cloud Run      │ │
│  │ - Test          │    │ Registry        │    │ - Staging      │ │
│  │ - Build         │    │ - Docker Images │    │ - Production   │ │
│  │ - Push          │    └─────────────────┘    └────────────────┘ │
│  └─────────────────┘                                  │            │
│         │                                             ▼            │
│         │                                    ┌────────────────┐    │
│         │                                    │ Datomic (mem)  │    │
│         ▼                                    │ In-memory DB   │    │
│  ┌─────────────────┐                        └────────────────┘    │
│  │ Workload        │                                               │
│  │ Identity Fed.   │  ◀── No long-lived keys, OIDC-based auth     │
│  └─────────────────┘                                               │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Cost (Development)

| Resource | Estimated Cost |
|----------|----------------|
| Cloud Run (scale to zero) | $0-5/month |
| Artifact Registry | ~$0.10/GB |
| Networking | ~$0.12/GB |
| **Total** | **< $10/month** |

### Setup Documentation

For complete setup instructions, see: **[docs/CLOUD_RUN_SETUP.md](./docs/CLOUD_RUN_SETUP.md)**

## CI/CD Pipeline

### GitHub Actions Workflow

The project uses a multi-stage CI/CD pipeline defined in `.github/workflows/cloud-run.yml`:

```
┌─────────────┐     ┌──────────┐     ┌─────────────┐     ┌───────────┐
│  Push to    │────▶│  Tests   │────▶│   Build &   │────▶│  Deploy   │
│   main      │     │  (Java)  │     │ Push Image  │     │  Staging  │
└─────────────┘     └──────────┘     └─────────────┘     └───────────┘
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │  Artifact   │
                                    │  Registry   │
                                    └─────────────┘
```

### Workflow Triggers

| Trigger | Action |
|---------|--------|
| Push to `main` | Auto-deploy to staging |
| Manual dispatch | Deploy to staging or production |
| Pull Request | Run tests only |

### Pipeline Stages

1. **Test**: Runs Clojure tests with Java 21
2. **Build & Push**: Multi-stage Docker build, push to Artifact Registry
3. **Deploy Staging**: Automatic deployment on push to main
4. **Deploy Production**: Manual trigger with environment approval

### GitHub CLI Commands

```bash
# List recent workflow runs
gh run list --workflow="Deploy to Cloud Run" --limit 5

# Trigger staging deployment
gh workflow run "Deploy to Cloud Run" -f environment=staging

# Trigger production deployment (requires approval)
gh workflow run "Deploy to Cloud Run" -f environment=production

# Watch a deployment in progress
gh run watch <run-id>

# View failed step logs
gh run view <run-id> --log-failed

# Check configured secrets
gh secret list
```

---

## SRE Operations

For comprehensive Site Reliability Engineering operations including monitoring, incident response, log analysis, and performance tuning, see the dedicated guide:

**[docs/SRE_OPERATIONS.md](./docs/SRE_OPERATIONS.md)**

### Quick SRE Commands

```bash
# Health check
curl -s https://little-trader-staging-x4miahfzia-uc.a.run.app/health | jq

# View recent logs
gcloud run services logs read little-trader-staging --region=us-central1 --limit=50

# Tail logs (real-time)
gcloud run services logs tail little-trader-staging --region=us-central1

# Check for errors
gcloud run services logs read little-trader-staging \
  --region=us-central1 \
  --filter="severity>=ERROR" \
  --limit=20

# View service status
gcloud run services describe little-trader-staging \
  --region=us-central1 \
  --format="table(status.conditions.type,status.conditions.status)"

# List recent revisions
gcloud run revisions list \
  --service=little-trader-staging \
  --region=us-central1 \
  --limit=5
```

---

## Remote REPL Access

The application supports an optional nREPL server for remote REPL access to running production code. This is useful for debugging, live inspection, and hot code reloading.

### Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `NREPL_ENABLED` | `false` | Set to `true` to enable nREPL |
| `NREPL_PORT` | `7888` | Port for nREPL server |

### Cloud Run Limitation

**Important**: Cloud Run only exposes one port (8080 for HTTP). The nREPL port is not directly accessible from the internet.

### Local Docker Access

```bash
# Run container locally with nREPL enabled
docker run -p 8080:8080 -p 7888:7888 \
  -e NREPL_ENABLED=true \
  -e NREPL_PORT=7888 \
  us-central1-docker.pkg.dev/$(gcloud config get project)/little-trader/little-trader:latest

# Connect to nREPL
clj -Sdeps '{:deps {nrepl/nrepl {:mvn/version "1.1.0"}}}' \
  -M -m nrepl.cmdline --connect --host localhost --port 7888
```

### REPL Session Examples

```clojure
;; Check system status
(require '[mount.core :as mount])
(mount/running-states)

;; Query database
(require '[datomic.api :as d])
(require '[com.little-trader.components.database :as db])
(d/q '[:find ?e :where [?e :account/id _]] (d/db @db/conn))

;; Hot reload code
(require 'com.little-trader.domain.signals :reload)

;; Check configuration
(System/getenv "DATOMIC_URI")
```

### Security Warning

nREPL provides full code execution access. Only enable in:
- Local development
- Secure VPC environments
- With proper authentication

See **[docs/SRE_OPERATIONS.md](./docs/SRE_OPERATIONS.md)** for production access patterns.

### Required Secrets

| Secret | Description |
|--------|-------------|
| `GCP_PROJECT_ID` | Google Cloud project ID |
| `GCP_REGION` | Deployment region (e.g., `us-central1`) |
| `GCP_SA_EMAIL` | Service account email |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Workload Identity provider path |

---

## Local Development

### Quick Start

```bash
# Install dependencies
npm install
clojure -P

# Start development (frontend + backend)
npx shadow-cljs watch app &
clojure -M:run

# Run tests
clojure -M:test

# Build for production
npx shadow-cljs release app
clojure -T:build uber
```

### Docker Local Build

```bash
# Build locally
docker build -t little-trader:local .

# Run locally
docker run -p 8080:8080 little-trader:local

# Test health
curl http://localhost:8080/health
```

---

## Infrastructure as Code

### 1. Terraform Configuration

**`infrastructure/main.tf`**:
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
  }

  backend "s3" {
    bucket         = "renko-trader-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "renko-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "renko-trader"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# EKS Cluster
resource "aws_eks_cluster" "renko" {
  name            = "renko-${var.environment}"
  role_arn        = aws_iam_role.eks_cluster.arn
  version         = "1.28"

  vpc_config {
    subnet_ids = aws_subnet.private[*].id
    security_groups = [aws_security_group.eks.id]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]
}

# RDS Database
resource "aws_rds_cluster" "datomic" {
  cluster_identifier      = "renko-datomic-${var.environment}"
  engine                  = "aurora-postgresql"
  engine_version          = "15.3"
  database_name           = "datomic"
  master_username         = "admin"
  master_password         = random_password.db_password.result
  backup_retention_period = 30
  skip_final_snapshot     = false
  final_snapshot_identifier = "renko-datomic-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  serverlessv2_scaling_configuration {
    max_capacity = 2.0
    min_capacity = 0.5
  }
}

# ElastiCache for Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "renko-redis-${var.environment}"
  engine               = "redis"
  node_type           = "cache.r7g.large"
  num_cache_nodes      = 3
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  automatic_failover_enabled = true
}

# MSK (Managed Streaming for Kafka)
resource "aws_msk_cluster" "kafka" {
  cluster_name           = "renko-kafka-${var.environment}"
  kafka_version          = "3.4.0"
  number_of_broker_nodes = 3

  broker_node_group_info {
    instance_type   = "kafka.m5.large"
    ebs_volume_size = 100
  }

  encryption_info {
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
    encryption_at_rest {
      enabled = true
    }
  }

  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = true
        log_group = aws_cloudwatch_log_group.kafka.name
      }
    }
  }

  tags = {
    Name = "renko-kafka"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/eks/renko-${var.environment}"
  retention_in_days = 30
}
```

**`infrastructure/variables.tf`**:
```hcl
variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  enum        = ["dev", "staging", "prod"]
}

variable "app_version" {
  description = "Application version"
  type        = string
}

variable "replica_count" {
  description = "Number of app replicas"
  type        = number
  default     = 3
}
```

---

## Local Development

### Docker Compose Setup

**`docker-compose.yml`**:
```yaml
version: '3.8'

services:
  datomic:
    image: datomic:latest
    ports:
      - "4334:4334"
    environment:
      DATOMIC_OPTS: "-Xmx2g"
    volumes:
      - datomic_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4334/"]
      interval: 30s
      timeout: 10s
      retries: 5

  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_SYNC_LIMIT: 2
      ZOOKEEPER_INIT_LIMIT: 5
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
      - "29092:29092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://kafka:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true'
    healthcheck:
      test: ["CMD", "kafka-broker-api-versions.sh", "--bootstrap-server", "localhost:9092"]
      interval: 30s
      timeout: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
      GF_INSTALL_PLUGINS: "grafana-clock-panel,grafana-simple-json-datasource"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - prometheus

  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"  # Frontend
      - "8080:8080"  # API
    environment:
      DATOMIC_URI: "datomic:sql://localhost/renko?jdbc:postgresql://localhost:5432/datomic"
      KAFKA_BROKERS: "kafka:29092"
      REDIS_URL: "redis://redis:6379"
      ENV: "development"
      LOG_LEVEL: "debug"
    depends_on:
      datomic:
        condition: service_healthy
      kafka:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - .:/app
    command: lein run

volumes:
  datomic_data:
  prometheus_data:
  grafana_data:

networks:
  default:
    name: renko-network
```

### Development Setup Script

**`setup-dev.sh`**:
```bash
#!/bin/bash
set -e

echo "🚀 Setting up Renko Trader Development Environment"

# Check prerequisites
command -v docker &> /dev/null || { echo "❌ Docker not found"; exit 1; }
command -v docker-compose &> /dev/null || { echo "❌ Docker Compose not found"; exit 1; }
command -v lein &> /dev/null || { echo "⚠️  Leiningen not found - installing...";
  curl -O https://raw.githubusercontent.com/technomancy/leiningen/stable/bin/lein
  chmod +x lein
  sudo mv lein /usr/local/bin/
}

echo "📦 Creating .env file..."
cp .env.example .env

echo "🐳 Starting Docker services..."
docker-compose up -d

echo "⏳ Waiting for services..."
sleep 10

echo "📚 Creating Datomic schema..."
clojure -X:db:init

echo "🔄 Creating Kafka topics..."
docker exec kafka kafka-topics \
  --create \
  --topic ohlcv-data \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1 \
  --if-not-exists

echo "✅ Development environment ready!"
echo ""
echo "📊 Dashboards:"
echo "  - Grafana: http://localhost:3000 (admin/admin)"
echo "  - Prometheus: http://localhost:9090"
echo "  - App: http://localhost:3000"
echo ""
echo "🔗 Services:"
echo "  - Kafka: localhost:9092"
echo "  - Redis: localhost:6379"
echo "  - Datomic: localhost:4334"
echo ""
echo "Run 'lein run' to start the application"
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

**`.github/workflows/test.yml`**:
```yaml
name: Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      kafka:
        image: confluentinc/cp-kafka:7.4.0
        ports:
          - 9092:9092
        options: >-
          --health-cmd "kafka-broker-api-versions --bootstrap-server localhost:9092"

    steps:
      - uses: actions/checkout@v3

      - name: Set up Clojure
        uses: DeLaGuardo/setup-clojure@master
        with:
          cli: '1.11.1.1413'
          bb: '0.8.158'

      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: |
            ~/.m2/repository
            ~/.clojure
          key: ${{ runner.os }}-clojure-${{ hashFiles('deps.edn') }}
          restore-keys: |
            ${{ runner.os }}-clojure-

      - name: Run linter
        run: clojure -M:lint

      - name: Run unit tests
        run: clojure -M:test

      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          KAFKA_BROKERS: localhost:9092
        run: clojure -M:test:integration

      - name: Generate coverage report
        run: clojure -M:cloverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/codecov.json

      - name: Build Docker image
        if: github.event_name == 'push'
        run: docker build -t renko-trader:${{ github.sha }} .

      - name: Login to Docker Hub
        if: github.event_name == 'push'
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Push Docker image
        if: github.event_name == 'push'
        run: |
          docker tag renko-trader:${{ github.sha }} renko-trader:latest
          docker push renko-trader:${{ github.sha }}
          docker push renko-trader:latest
```

**`.github/workflows/deploy.yml`**:
```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: ${{ github.event.inputs.environment || 'staging' }}

    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions
          aws-region: us-east-1

      - name: Login to Amazon ECR
        run: aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com

      - name: Build and push Docker image
        run: |
          docker build -t renko-trader:${{ github.sha }} .
          docker tag renko-trader:${{ github.sha }} ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/renko-trader:${{ github.sha }}
          docker push ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/renko-trader:${{ github.sha }}

      - name: Update Kubernetes deployment
        env:
          KUBE_CONFIG: ${{ secrets.KUBE_CONFIG }}
        run: |
          echo $KUBE_CONFIG | base64 -d > kubeconfig
          kubectl set image deployment/renko-trader \
            renko-trader=${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/renko-trader:${{ github.sha }} \
            --kubeconfig=kubeconfig \
            --namespace=${{ github.event.inputs.environment || 'staging' }}

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/renko-trader \
            --kubeconfig=kubeconfig \
            --namespace=${{ github.event.inputs.environment || 'staging' }} \
            --timeout=5m

      - name: Health check
        run: |
          kubectl run health-check \
            --image=curlimages/curl \
            --rm -i \
            --kubeconfig=kubeconfig \
            --namespace=${{ github.event.inputs.environment || 'staging' }} \
            --restart=Never \
            -- curl -f http://renko-trader:8080/health
```

---

## Kubernetes Deployment

### Helm Chart Structure

**`helm/renko-trader/Chart.yaml`**:
```yaml
apiVersion: v2
name: renko-trader
description: A Helm chart for Renko Trading System
type: application
version: 1.0.0
appVersion: "1.0.0"
keywords:
  - trading
  - renko
  - clojure
maintainers:
  - name: 4Coders
    email: dev@4coders.com.br
```

**`helm/renko-trader/values.yaml`**:
```yaml
replicaCount: 3

image:
  repository: renko-trader
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: LoadBalancer
  port: 80
  targetPort: 8080

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: trading.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: renko-tls
      hosts:
        - trading.example.com

resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 2
    memory: 4Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5

persistence:
  enabled: true
  storageClassName: ebs-sc
  size: 50Gi

datomic:
  uri: "datomic:sql://datomic-service/renko"
  transactorUri: "datomic:sql://datomic-transactor/renko"

kafka:
  brokers: "kafka-broker-0:9092,kafka-broker-1:9092,kafka-broker-2:9092"
  topics:
    ohlcv: ohlcv-data
    signals: signals
    trades: trades

redis:
  uri: "redis://redis-master:6379"
```

### Kubernetes Manifests

**`k8s/deployment.yaml`**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: renko-trader
  labels:
    app: renko-trader
spec:
  replicas: 3
  selector:
    matchLabels:
      app: renko-trader
  template:
    metadata:
      labels:
        app: renko-trader
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: renko-trader
      containers:
      - name: renko-trader
        image: renko-trader:latest
        imagePullPolicy: IfNotPresent
        ports:
        - name: http
          containerPort: 8080
          protocol: TCP
        - name: metrics
          containerPort: 9090
          protocol: TCP
        env:
        - name: DATOMIC_URI
          valueFrom:
            configMapKeyRef:
              name: renko-config
              key: datomic.uri
        - name: KAFKA_BROKERS
          valueFrom:
            configMapKeyRef:
              name: renko-config
              key: kafka.brokers
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: renko-secrets
              key: redis-url
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: renko-secrets
              key: api-key
        - name: LOG_LEVEL
          value: "info"
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2
            memory: 4Gi
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
        readinessProbe:
          httpGet:
            path: /ready
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
        volumeMounts:
        - name: config
          mountPath: /etc/renko
          readOnly: true
      volumes:
      - name: config
        configMap:
          name: renko-config
```

**`k8s/service.yaml`**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: renko-trader
  labels:
    app: renko-trader
spec:
  type: LoadBalancer
  ports:
  - name: http
    port: 80
    targetPort: 8080
    protocol: TCP
  - name: metrics
    port: 9090
    targetPort: 9090
    protocol: TCP
  selector:
    app: renko-trader
```

---

## Monitoring & Observability

### Prometheus Configuration

**`monitoring/prometheus.yml`**:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'renko-trader'

scrape_configs:
  - job_name: 'renko-app'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/metrics'

  - job_name: 'kubernetes-apiservers'
    kubernetes_sd_configs:
      - role: endpoints
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token

  - job_name: 'kafka'
    static_configs:
      - targets: ['localhost:9092']

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']

rule_files:
  - '/etc/prometheus/rules/*.yml'
```

**`monitoring/prometheus/rules/alerts.yml`**:
```yaml
groups:
  - name: renko-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(app_errors_total[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: LowSignalDetection
        expr: rate(signals_total[1h]) < 1
        for: 30m
        annotations:
          summary: "Signal detection rate too low"

      - alert: TradeExecutionFailure
        expr: rate(trades_failed_total[5m]) > 0.1
        for: 5m
        annotations:
          summary: "High trade failure rate"

      - alert: KafkaLag
        expr: kafka_lag_max > 1000
        for: 10m
        annotations:
          summary: "Kafka consumer lag too high"

      - alert: DatabaseConnectionErrors
        expr: rate(db_connection_errors_total[5m]) > 0.01
        for: 5m
        annotations:
          summary: "Database connection errors detected"
```

### Structured Logging

**`src/com/little_trader/util/logging.clj`**:
```clojure
(ns com.little-trader.util.logging
  (:require [taoensso.timbre :as timbre]
            [cheshire.core :as json]))

(timbre/set-config! {
  :level :info
  :output-fn (fn [data]
    (let [{:keys [level ?msg_ ?err timestamp_]} data
          msg-str (force ?msg_)
          log-entry {
            :timestamp timestamp_
            :level (name level)
            :message msg-str
            :error (when ?err
                    {:message (.getMessage ^Exception ?err)
                     :type (-> ?err type .getSimpleName)
                     :stacktrace (.getStackTrace ^Exception ?err)})
          }]
      (json/generate-string log-entry)))
  :appenders {
    :println (timbre/println-appender {})
    :spit (timbre/spit-appender {:filename "logs/renko.log"})
  }
})

(defn log-trade [trade]
  (timbre/info "Trade executed"
    {:trade-id (:id trade)
     :entry-price (:entry-price trade)
     :side (:side trade)
     :amount (:entry-amount trade)}))

(defn log-signal [signal]
  (timbre/info "Signal detected"
    {:signal-type (:type signal)
     :action (:action signal)
     :side (:side signal)
     :timestamp (System/currentTimeMillis)}))

(defn log-error [error context]
  (timbre/error "Error occurred"
    {:error-type (-> error type .getSimpleName)
     :message (.getMessage error)
     :context context}))
```

---

## Security & Secrets

### Kubernetes Secrets

**`k8s/secrets.yaml`** (template - don't commit secrets):
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: renko-secrets
type: Opaque
stringData:
  api-key: "your-api-key-here"
  api-secret: "your-api-secret-here"
  redis-url: "redis://password@redis-master:6379"
  db-password: "secure-password-here"
```

### Secret Rotation

**`.github/workflows/rotate-secrets.yml`**:
```yaml
name: Rotate Secrets

on:
  schedule:
    - cron: '0 0 1 * *'  # First day of every month
  workflow_dispatch:

jobs:
  rotate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Rotate API credentials
        env:
          AWS_ACCOUNT_ID: ${{ secrets.AWS_ACCOUNT_ID }}
        run: |
          aws secretsmanager rotate-secret \
            --secret-id renko/api-key \
            --rotation-rules AutomaticallyAfterDays=30

      - name: Rotate database password
        run: |
          aws rds modify-db-cluster \
            --db-cluster-identifier renko-datomic \
            --master-user-password $(openssl rand -base64 32) \
            --apply-immediately
```

---

## Disaster Recovery

### Backup Strategy

**`monitoring/backup-policy.yaml`**:
```yaml
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: renko-daily-backup
  namespace: velero
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  template:
    ttl: "720h"  # 30 days
    includedNamespaces:
    - renko-prod
    storageLocation: aws-s3
    volumeSnapshotLocation: aws-ebs
    defaultVolumesToRestic: true
```

### Recovery Time Objective (RTO) & Recovery Point Objective (RPO)

- **RTO**: 1 hour (restore from backup, DNS update)
- **RPO**: 1 hour (backups every hour, transaction logs)

---

## Summary

This DevOps infrastructure provides:
- ✅ Infrastructure-as-Code with Terraform
- ✅ Containerized application with Docker
- ✅ Automated CI/CD with GitHub Actions
- ✅ Production deployment on Kubernetes
- ✅ Comprehensive monitoring with Prometheus/Grafana
- ✅ Structured logging in JSON format
- ✅ Secrets management and rotation
- ✅ Disaster recovery with backups
- ✅ High availability with auto-scaling
- ✅ Security best practices

---

## MCP-Enabled Staging

### Overview

The staging environment is enhanced with Model Context Protocol (MCP) support, enabling Claude Code and Claude Desktop to connect directly to a running nREPL for AI-assisted development.

### Key Components

```
┌─────────────────────────────────────────────────────┐
│                 STAGING ENVIRONMENT                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────┐    ┌─────────────────┐         │
│  │ App Pod         │    │ nREPL Service   │         │
│  │ - HTTP :8080    │◀──▶│ - Port 7888     │         │
│  │ - nREPL :7888   │    │ - ClusterIP     │         │
│  │ - Hot Reload    │    └─────────────────┘         │
│  └─────────────────┘                                 │
│                                                      │
│  ┌─────────────────┐    ┌─────────────────┐         │
│  │ ArgoCD          │    │ File Sync       │         │
│  │ - GitOps Sync   │    │ - Code Changes  │         │
│  │ - Auto Deploy   │    │ - Hot Reload    │         │
│  └─────────────────┘    └─────────────────┘         │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Quick Start

```bash
# 1. Connect to staging
kubectl -n staging port-forward svc/nrepl 7888:7888 &

# 2. Test connection
echo "(+ 1 2 3)" | nc localhost 7888

# 3. Start Claude Code with MCP
claude  # Hooks auto-configured for Clojure
```

### MCP Tools Available

| Tool | Description | Usage |
|------|-------------|-------|
| `clj-paren-repair` | Auto-fix Clojure syntax | Pre/Post edit hooks |
| `clj-nrepl-eval` | Evaluate code in staging | Direct REPL access |
| `clojure-mcp` | Full MCP server | Claude Desktop |

### GitOps Integration

Staging deployments are managed via ArgoCD:

```yaml
# argocd/staging-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: little-trader-staging
spec:
  source:
    repoURL: https://github.com/4coders-com-br/little-trader.git
    path: k8s/staging
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

### Security

- **VPN Required**: nREPL only accessible via VPN
- **RBAC**: Kubernetes role-based access control
- **Audit Logging**: All REPL evaluations logged
- **No Production Access**: Staging isolated from production

### Documentation

For complete setup and configuration details, see:
- **[CLOUD_MCP_STAGING.md](./CLOUD_MCP_STAGING.md)** - Full architecture guide
- **[MCP_DEVELOPMENT.md](./MCP_DEVELOPMENT.md)** - MCP development patterns
