# SRE Operations Guide - Cloud Run

**Site Reliability Engineering Daily Operations for Little Trader**

> **Live Staging**: https://little-trader-staging-x4miahfzia-uc.a.run.app

## Table of Contents

1. [Cloud Run Architecture](#cloud-run-architecture)
2. [Daily Operations Checklist](#daily-operations-checklist)
3. [Monitoring & Alerting](#monitoring--alerting)
4. [Log Analysis](#log-analysis)
5. [Incident Response](#incident-response)
6. [Performance Tuning](#performance-tuning)
7. [Remote REPL Access (nREPL)](#remote-repl-access-nrepl)
8. [Cost Management](#cost-management)
9. [Common Issues & Solutions](#common-issues--solutions)
10. [CLI Toolbox](#cli-toolbox)

---

## Cloud Run Architecture

### How Cloud Run Works

```
                    Internet
                       │
                       ▼
              ┌────────────────┐
              │   Cloud Load   │
              │   Balancer     │
              │  (HTTPS/SSL)   │
              └───────┬────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │Instance │   │Instance │   │Instance │
   │   #1    │   │   #2    │   │   #3    │
   │ :8080   │   │ :8080   │   │ :8080   │
   │(:7888)  │   │(:7888)  │   │(:7888)  │
   └─────────┘   └─────────┘   └─────────┘
       │             │             │
       └─────────────┼─────────────┘
                     │
              ┌──────┴──────┐
              │   Datomic   │
              │  (in-mem)   │
              └─────────────┘
```

### Key Characteristics

| Feature | Staging | Production |
|---------|---------|------------|
| **Min Instances** | 0 (scale to zero) | 1 (always warm) |
| **Max Instances** | 2 | 10 |
| **Memory** | 512Mi | 1Gi |
| **CPU** | 1 vCPU | 1 vCPU |
| **Timeout** | 300s | 300s |
| **Concurrency** | 80 requests/instance | 80 requests/instance |
| **CPU Throttling** | Yes | No |

### Instance Lifecycle

1. **Cold Start**: New instance created when traffic arrives
2. **Warm**: Instance handling requests (billed per 100ms)
3. **Idle**: Waiting for requests (not billed with CPU throttling)
4. **Terminated**: Scaled down after idle period

**Cold Start Time**: ~5-15 seconds (JVM startup + app initialization)

---

## Daily Operations Checklist

### Morning Checks

```bash
# 1. Check service health
curl -s https://little-trader-staging-x4miahfzia-uc.a.run.app/health | jq

# 2. Check service status
gcloud run services describe little-trader-staging \
  --region=us-central1 \
  --format="table(status.conditions.type,status.conditions.status)"

# 3. Check recent errors (last hour)
gcloud run services logs read little-trader-staging \
  --region=us-central1 \
  --limit=100 \
  --filter="severity>=ERROR"

# 4. Check recent deployments
gcloud run revisions list \
  --service=little-trader-staging \
  --region=us-central1 \
  --limit=5

# 5. Check GitHub Actions status
gh run list --workflow="Deploy to Cloud Run" --limit=5
```

### Weekly Checks

```bash
# 1. Review all revisions (cleanup old ones)
gcloud run revisions list \
  --service=little-trader-staging \
  --region=us-central1

# 2. Check cost report
gcloud billing accounts list

# 3. Review artifact registry images
gcloud artifacts docker images list \
  us-central1-docker.pkg.dev/$(gcloud config get project)/little-trader \
  --include-tags

# 4. Cleanup old images (keep last 10)
# Manual review before cleanup
```

---

## Monitoring & Alerting

### Built-in Cloud Run Metrics

Access via [Cloud Console](https://console.cloud.google.com/run) or CLI:

```bash
# Request latency (p50, p95, p99)
gcloud monitoring metrics list \
  --filter="resource.type=cloud_run_revision"

# View in Cloud Console
open "https://console.cloud.google.com/run/detail/us-central1/little-trader-staging/metrics"
```

### Key Metrics to Monitor

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| **Request Latency p99** | < 1s | 1-3s | > 3s |
| **Error Rate** | < 0.1% | 0.1-1% | > 1% |
| **Instance Count** | 0-2 | 3-5 | > 5 |
| **Memory Usage** | < 70% | 70-90% | > 90% |
| **CPU Usage** | < 70% | 70-90% | > 90% |
| **Cold Starts/hour** | < 10 | 10-50 | > 50 |

### Setting Up Alerts

```bash
# Create alerting policy for high error rate
gcloud monitoring policies create \
  --display-name="Little Trader - High Error Rate" \
  --condition-display-name="Error rate > 1%" \
  --condition-filter='resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_count" AND metric.labels.response_code_class="5xx"' \
  --notification-channels="projects/$(gcloud config get project)/notificationChannels/YOUR_CHANNEL_ID"
```

### Quick Dashboard

```bash
# Open Cloud Run dashboard
open "https://console.cloud.google.com/run?project=$(gcloud config get project)"

# Open Cloud Logging
open "https://console.cloud.google.com/logs/query?project=$(gcloud config get project)"

# Open Cloud Monitoring
open "https://console.cloud.google.com/monitoring?project=$(gcloud config get project)"
```

---

## Log Analysis

### Log Query Examples

```bash
# All logs (last 50)
gcloud run services logs read little-trader-staging \
  --region=us-central1 \
  --limit=50

# Follow logs in real-time
gcloud run services logs tail little-trader-staging \
  --region=us-central1

# Filter by severity
gcloud run services logs read little-trader-staging \
  --region=us-central1 \
  --filter="severity>=WARNING"

# Filter by time range (last 2 hours)
gcloud run services logs read little-trader-staging \
  --region=us-central1 \
  --filter="timestamp>=\"$(date -u -v-2H '+%Y-%m-%dT%H:%M:%SZ')\""

# Search for specific text
gcloud run services logs read little-trader-staging \
  --region=us-central1 \
  --filter="textPayload:\"ERROR\""
```

### Log Explorer (Advanced)

```bash
# Open Cloud Logging with pre-filtered query
open "https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_run_revision%22%0Aresource.labels.service_name%3D%22little-trader-staging%22;project=$(gcloud config get project)"
```

### Common Log Patterns

| Pattern | Meaning | Action |
|---------|---------|--------|
| `Starting HTTP server` | Instance cold start | Normal |
| `Shutdown signal received` | Instance terminating | Normal |
| `WARN` | Non-critical issue | Monitor |
| `ERROR` + stack trace | Application error | Investigate |
| `OOM` | Out of memory | Increase memory |
| `Connection refused` | DB/external service down | Check dependencies |

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| **P1 - Critical** | Service down | 15 min | /health returns 5xx |
| **P2 - Major** | Degraded performance | 1 hour | High latency (>3s p99) |
| **P3 - Minor** | Non-critical issue | 4 hours | Occasional errors |
| **P4 - Low** | Cosmetic/minor | Next business day | UI glitch |

### P1 Incident Playbook

```bash
# 1. VERIFY THE INCIDENT
curl -s https://little-trader-staging-x4miahfzia-uc.a.run.app/health

# 2. CHECK SERVICE STATUS
gcloud run services describe little-trader-staging \
  --region=us-central1 \
  --format="value(status.conditions[0].status)"

# 3. CHECK RECENT LOGS FOR ERRORS
gcloud run services logs read little-trader-staging \
  --region=us-central1 \
  --limit=100 \
  --filter="severity>=ERROR"

# 4. CHECK RECENT DEPLOYMENTS (was something just deployed?)
gcloud run revisions list \
  --service=little-trader-staging \
  --region=us-central1 \
  --limit=3

# 5. ROLLBACK IF NEEDED (to previous revision)
PREVIOUS_REVISION=$(gcloud run revisions list \
  --service=little-trader-staging \
  --region=us-central1 \
  --limit=2 \
  --format="value(metadata.name)" | tail -1)

gcloud run services update-traffic little-trader-staging \
  --region=us-central1 \
  --to-revisions=$PREVIOUS_REVISION=100

# 6. FORCE NEW INSTANCE (if current instances are bad)
gcloud run services update little-trader-staging \
  --region=us-central1 \
  --clear-env-vars=FORCE_RESTART

# Then set it again with current timestamp to force redeploy
gcloud run services update little-trader-staging \
  --region=us-central1 \
  --set-env-vars=FORCE_RESTART=$(date +%s)
```

### Rollback Procedure

```bash
# List recent revisions
gcloud run revisions list \
  --service=little-trader-staging \
  --region=us-central1 \
  --limit=5

# Rollback to specific revision
gcloud run services update-traffic little-trader-staging \
  --region=us-central1 \
  --to-revisions=little-trader-staging-00042-abc=100

# Or use GitHub Actions to redeploy a previous commit
gh workflow run "Deploy to Cloud Run" -f environment=staging
```

---

## Performance Tuning

### JVM Tuning

Current settings (in Dockerfile):
```bash
ENV JVM_OPTS="-Xmx512m -Xms256m"
```

Recommendations by memory allocation:

| Memory | JVM_OPTS |
|--------|----------|
| 512Mi | `-Xmx384m -Xms256m` |
| 1Gi | `-Xmx768m -Xms512m` |
| 2Gi | `-Xmx1536m -Xms1024m` |

### Cold Start Optimization

```bash
# Enable startup CPU boost (already configured)
gcloud run services update little-trader-staging \
  --region=us-central1 \
  --cpu-boost

# Increase min instances for production
gcloud run services update little-trader \
  --region=us-central1 \
  --min-instances=1
```

### Request Timeout

```bash
# Increase timeout for long-running requests
gcloud run services update little-trader-staging \
  --region=us-central1 \
  --timeout=600  # 10 minutes max
```

---

## Remote REPL Access (nREPL)

### Important: Cloud Run Limitations

**Cloud Run only exposes one port** (the HTTP port 8080). The nREPL port (7888) is NOT directly accessible from the internet.

To access nREPL in production, you need one of these approaches:

### Option 1: Local Docker with nREPL (Recommended for Debugging)

```bash
# Run locally with nREPL enabled
docker run -p 8080:8080 -p 7888:7888 \
  -e NREPL_ENABLED=true \
  -e NREPL_PORT=7888 \
  us-central1-docker.pkg.dev/PROJECT_ID/little-trader/little-trader:latest

# Connect to local nREPL
clj -Sdeps '{:deps {nrepl/nrepl {:mvn/version "1.1.0"}}}' \
  -M -m nrepl.cmdline --connect --host localhost --port 7888
```

### Option 2: Cloud Run with VPC + Cloud IAP (Production)

For production nREPL access, deploy a dedicated debugging service:

```bash
# Deploy a separate nREPL-enabled service (internal only)
gcloud run deploy little-trader-debug \
  --image=us-central1-docker.pkg.dev/PROJECT_ID/little-trader/little-trader:latest \
  --region=us-central1 \
  --no-allow-unauthenticated \
  --ingress=internal \
  --vpc-connector=your-vpc-connector \
  --set-env-vars=NREPL_ENABLED=true,NREPL_PORT=7888

# Then access via:
# 1. VPN to your VPC
# 2. Port-forward through a bastion host
# 3. Use Cloud IAP TCP forwarding
```

### Option 3: HTTP REPL Endpoint (Simple but Less Powerful)

You could add an authenticated HTTP endpoint that evaluates Clojure code:

```clojure
;; Example (requires authentication!)
(defn repl-handler [request]
  (let [code (-> request :body slurp)
        result (eval (read-string code))]
    {:status 200
     :body (pr-str result)}))
```

**Security Warning**: Only implement this with strong authentication!

### Connecting to nREPL (When Available)

```bash
# Using Clojure CLI
clj -Sdeps '{:deps {nrepl/nrepl {:mvn/version "1.1.0"}}}' \
  -M -m nrepl.cmdline --connect --host localhost --port 7888

# Using Leiningen
lein repl :connect localhost:7888

# Using Calva (VS Code)
# 1. Open Command Palette (Cmd+Shift+P)
# 2. Select "Calva: Connect to a Running REPL Server"
# 3. Select "Generic" project type
# 4. Enter: localhost:7888
```

### REPL Session Examples

```clojure
;; Check system status
(require '[mount.core :as mount])
(mount/running-states)

;; Inspect database
(require '[com.little-trader.components.database :as db])
(d/q '[:find ?e :where [?e :account/id _]] (d/db @db/conn))

;; Test signal detection
(require '[com.little-trader.domain.signals :as signals])
(signals/detect-signal test-bricks config false)

;; Hot reload code
(require 'com.little-trader.domain.renko :reload)

;; Check configuration
(System/getenv "DATOMIC_URI")
```

---

## Cost Management

### Understanding Cloud Run Billing

| Resource | Rate | Notes |
|----------|------|-------|
| **vCPU** | $0.00002400/vCPU-second | Only when processing requests (with CPU throttling) |
| **Memory** | $0.00000250/GiB-second | Always billed when instance exists |
| **Requests** | $0.40/million | First 2 million free |
| **Networking** | $0.12/GB (egress) | Ingress is free |

### Monthly Cost Estimate

**Staging (scale to zero)**:
- 10,000 requests/day × 30 days = 300k requests
- Average request duration: 200ms
- Cost: ~$1-5/month

**Production (min instances = 1)**:
- 1 instance × 720 hours × 512Mi = ~$5-10/month (idle)
- Plus request costs

### Cost Optimization Tips

```bash
# 1. Enable CPU throttling (staging)
gcloud run services update little-trader-staging \
  --region=us-central1 \
  --cpu-throttling

# 2. Set aggressive scaling down
gcloud run services update little-trader-staging \
  --region=us-central1 \
  --min-instances=0

# 3. Reduce memory if possible
gcloud run services update little-trader-staging \
  --region=us-central1 \
  --memory=256Mi

# 4. Check current billing
gcloud billing accounts list
```

### Cleanup Old Revisions

```bash
# List all revisions
gcloud run revisions list \
  --service=little-trader-staging \
  --region=us-central1

# Delete old revision (be careful!)
gcloud run revisions delete little-trader-staging-00001-abc \
  --region=us-central1 \
  --quiet
```

---

## Common Issues & Solutions

### Issue: Cold Start Taking Too Long

**Symptoms**: First request after idle period takes 10+ seconds

**Solutions**:
```bash
# 1. Enable startup CPU boost
gcloud run services update little-trader-staging \
  --region=us-central1 \
  --cpu-boost

# 2. Increase min instances
gcloud run services update little-trader-staging \
  --region=us-central1 \
  --min-instances=1

# 3. Optimize JVM startup (add to Dockerfile)
# -XX:+TieredCompilation -XX:TieredStopAtLevel=1
```

### Issue: Out of Memory (OOM)

**Symptoms**: Container killed, logs show OOM

**Solutions**:
```bash
# 1. Increase memory
gcloud run services update little-trader-staging \
  --region=us-central1 \
  --memory=1Gi

# 2. Adjust JVM heap (in Dockerfile)
ENV JVM_OPTS="-Xmx768m -Xms512m"
```

### Issue: Request Timeout

**Symptoms**: 504 Gateway Timeout

**Solutions**:
```bash
# 1. Increase timeout
gcloud run services update little-trader-staging \
  --region=us-central1 \
  --timeout=600

# 2. Check for slow queries/operations in logs
gcloud run services logs read little-trader-staging \
  --region=us-central1 \
  --filter="textPayload:\"duration\""
```

### Issue: CORS Errors

**Symptoms**: Browser console shows CORS errors

**Solutions**:
- Check that CORS middleware is configured correctly
- Verify `Access-Control-Allow-Origin` header is set
- For Cloud Run, ensure `--allow-unauthenticated` is set

### Issue: Static Files Not Loading

**Symptoms**: JS/CSS files return 404

**Check**:
```bash
# Verify files exist in the image
docker run --rm -it \
  us-central1-docker.pkg.dev/PROJECT_ID/little-trader/little-trader:latest \
  ls -la /app/resources/public/js/compiled/
```

---

## CLI Toolbox

### Essential Commands

```bash
# ═══════════════════════════════════════════════════════════════
# SERVICE MANAGEMENT
# ═══════════════════════════════════════════════════════════════

# View service details
gcloud run services describe little-trader-staging --region=us-central1

# List all services
gcloud run services list --region=us-central1

# Update environment variable
gcloud run services update little-trader-staging \
  --region=us-central1 \
  --set-env-vars=LOG_LEVEL=debug

# Scale to zero (force)
gcloud run services update little-trader-staging \
  --region=us-central1 \
  --min-instances=0 --max-instances=0

# ═══════════════════════════════════════════════════════════════
# DEPLOYMENTS
# ═══════════════════════════════════════════════════════════════

# Trigger deployment via GitHub
gh workflow run "Deploy to Cloud Run" -f environment=staging

# Watch deployment
gh run watch $(gh run list --workflow="Deploy to Cloud Run" --limit 1 --json databaseId -q '.[0].databaseId')

# List recent deployments
gh run list --workflow="Deploy to Cloud Run" --limit=10

# View failed logs
gh run view <run-id> --log-failed

# ═══════════════════════════════════════════════════════════════
# LOGS
# ═══════════════════════════════════════════════════════════════

# Tail logs (real-time)
gcloud run services logs tail little-trader-staging --region=us-central1

# Recent errors
gcloud run services logs read little-trader-staging \
  --region=us-central1 \
  --limit=50 \
  --filter="severity>=ERROR"

# ═══════════════════════════════════════════════════════════════
# HEALTH CHECKS
# ═══════════════════════════════════════════════════════════════

# Quick health check
curl -s https://little-trader-staging-x4miahfzia-uc.a.run.app/health | jq

# Check with timing
curl -w "Total: %{time_total}s\n" -s https://little-trader-staging-x4miahfzia-uc.a.run.app/health

# ═══════════════════════════════════════════════════════════════
# DEBUGGING
# ═══════════════════════════════════════════════════════════════

# Run container locally
docker run -p 8080:8080 -p 7888:7888 \
  -e NREPL_ENABLED=true \
  us-central1-docker.pkg.dev/$(gcloud config get project)/little-trader/little-trader:latest

# Pull latest image
gcloud auth configure-docker us-central1-docker.pkg.dev
docker pull us-central1-docker.pkg.dev/$(gcloud config get project)/little-trader/little-trader:latest
```

### Aliases for ~/.bashrc or ~/.zshrc

```bash
# Little Trader SRE aliases
alias lt-health='curl -s https://little-trader-staging-x4miahfzia-uc.a.run.app/health | jq'
alias lt-logs='gcloud run services logs read little-trader-staging --region=us-central1 --limit=50'
alias lt-tail='gcloud run services logs tail little-trader-staging --region=us-central1'
alias lt-errors='gcloud run services logs read little-trader-staging --region=us-central1 --filter="severity>=ERROR" --limit=20'
alias lt-status='gcloud run services describe little-trader-staging --region=us-central1 --format="table(status.conditions.type,status.conditions.status)"'
alias lt-deploy='gh workflow run "Deploy to Cloud Run" -f environment=staging'
alias lt-revisions='gcloud run revisions list --service=little-trader-staging --region=us-central1 --limit=5'
```

---

## Quick Reference Card

```
╔════════════════════════════════════════════════════════════════╗
║                 LITTLE TRADER - SRE QUICK REFERENCE             ║
╠════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  STAGING URL:  https://little-trader-staging-x4miahfzia-uc.a.run.app
║  HEALTH:       /health                                           ║
║  EQL API:      /api/eql                                          ║
║  REST API:     /api                                              ║
║                                                                  ║
║  ─────────────────────────────────────────────────────────────── ║
║  COMMON COMMANDS                                                 ║
║  ─────────────────────────────────────────────────────────────── ║
║                                                                  ║
║  Health Check:     curl .../health | jq                          ║
║  View Logs:        gcloud run services logs read ... --limit=50  ║
║  Tail Logs:        gcloud run services logs tail ...             ║
║  Deploy:           gh workflow run "Deploy to Cloud Run"         ║
║  Rollback:         gcloud run services update-traffic ...        ║
║                                                                  ║
║  ─────────────────────────────────────────────────────────────── ║
║  INCIDENT RESPONSE                                               ║
║  ─────────────────────────────────────────────────────────────── ║
║                                                                  ║
║  1. Verify:   curl .../health                                    ║
║  2. Logs:     gcloud run services logs read --filter="ERROR"     ║
║  3. Rollback: gcloud run services update-traffic --to-revisions  ║
║  4. Notify:   Post in #incidents Slack channel                   ║
║                                                                  ║
╚════════════════════════════════════════════════════════════════╝
```
