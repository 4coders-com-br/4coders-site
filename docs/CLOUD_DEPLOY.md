# Cloud Deployment

## Architecture Overview

The Little Trader deployment spans:
- **Cloud Run** — stateless app service (auto-scaling)
- **Cloud SQL** — PostgreSQL for Datomic storage
- **GCP VMs** — Datomic transactor, FastStreaming worker, Pulsar
- **Cloud Artifact Registry** — Docker image repository
- **Cloud Storage** — Market data archive (GCS)

## GitHub Actions CI/CD Pipeline

The unified workflow (`.github/workflows/main.yml`) automates:

```
push/PR → test → lint → cljs-test → build ⤷
                                      → push-images (main only)
                                      → deploy-staging
                                      → deploy-production (manual)
```

### Pipeline Stages

| Stage | Trigger | Gate | Artifacts |
|-------|---------|------|-----------|
| **test** | Always | — | Test results |
| **lint** | Always | — | Lint report |
| **cljs-test** | Always | lint passes | — |
| **build** | Always | tests pass | uberjar, CLJS release |
| **push-images** | main branch only | build passes | GAR: app + fs-worker images |
| **deploy-staging** | main push | images pushed | Cloud Run staging endpoint |
| **deploy-production** | Manual dispatch | staging OK | Cloud Run production endpoint |

## Deployment to Staging

**Automatic** — merges to `main` automatically deploy to staging.

```
git push origin main
↓
GitHub Actions runs → builds images → pushes to GAR
↓
Deploys to Cloud Run staging
↓
Runs smoke tests
↓
Refreshes FS worker on VM
```

**Time:** ~15-20 minutes from push to live

**Monitoring:**
- https://github.com/4coders-com-br/little-trader/actions
- Cloud Run: `little-trader-staging` service
- Grafana: http://localhost:3001 (if you have VPC access)

## Deployment to Production

**Manual & Gated** — requires explicit trigger + approval.

### Step 1: Run Workflow Dispatch

```bash
gh workflow run main.yml -f environment=production
```

Or via GitHub UI:
1. Go to Actions tab
2. Select "CI → Deploy" workflow
3. Click "Run workflow"
4. Select "production" from dropdown

### Step 2: Approve in GitHub

GitHub will prompt for approval:
- Assigned to "production" environment
- Requires at least 1 approval from team lead
- Shows deployment conditions (staging must have passed)

### Step 3: Production Deployment

Once approved, Cloud Run deploy proceeds:
```
Authenticate to GCP
→ Deploy app image to little-trader service
→ Health check (30 retries over 5 minutes)
→ Success: live at https://little-trader.run.app
```

**Time:** ~10 minutes total

## Secrets & Credentials

All secrets are stored in GitHub. Required for deployment:

| Secret | Example | Used By |
|--------|---------|---------|
| `GCP_PROJECT_ID` | little-trader | GCP auth |
| `GCP_REGION` | us-central1 | Cloud Run region |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | projects/.../providers/github | OAuth |
| `GCP_SA_EMAIL` | github-actions@little-trader.iam... | Service account |
| `DATOMIC_URI_STAGING` | datomic:sql://... | Staging app |
| `DATOMIC_URI_PRODUCTION` | datomic:sql://... | Production app |
| `PULSAR_SERVICE_URL_STAGING` | pulsar://35.193.217.34:6650 | Staging market |
| `PULSAR_SERVICE_URL_PRODUCTION` | pulsar://... | Production market |
| `DERIBIT_CLIENT_ID` | — | Options market data |
| `DERIBIT_PRIVATE_KEY` | — | Options market data |
| `JWT_SECRET` | random-secure-string | Auth tokens |
| `BLOB_ENDPOINT` | https://storage.googleapis.com | GCS |
| `BLOB_BUCKET` | lt-fast-streaming-staging | Archive |
| Others | — | See GitHub Secrets tab |

### Configuring Secrets

```bash
# Set individual secret
gh secret set DATOMIC_URI_STAGING --body "datomic:sql://..."

# List all secrets
gh secret list

# For Workload Identity Federation, follow:
# https://github.com/google-github-actions/auth
```

## Infrastructure Files

Three docker-compose files handle cloud infrastructure:

### 1. `docker-compose.yml` (main)
**Local dev** — used with profiles
```bash
docker compose --profile dev up
docker compose --profile dev --profile market up
docker compose -f docker-compose.yml -f docker-compose.cloud.yml up  # cloud-backed
```

### 2. `docker-compose.infra.yml`
**GCP VM: datomic-transactor** — runs PostgreSQL + Datomic transactor
```bash
docker-compose infra.yml up -d
```

### 3. `docker-compose.worker.yml`
**GCP VM: fs-worker-staging** — runs Pulsar + FastStreaming worker
```bash
docker-compose worker.yml up -d
```

## VM Management

### Datomic Transactor VM

```bash
# SSH into transactor VM
gcloud compute ssh datomic-transactor \
  --zone=us-central1-a

# View logs
docker compose logs -f transactor

# Restart transactor
docker compose restart transactor

# Check database
docker compose exec postgres psql -U datomic -c "SELECT * FROM datomic_kvs LIMIT 1;"
```

### FastStreaming Worker VM

```bash
# SSH into worker VM
gcloud compute ssh fs-worker-staging \
  --zone=us-central1-a

# View logs
docker compose -f docker-compose.worker.yml logs -f fs-worker

# Restart worker
docker compose -f docker-compose.worker.yml restart fs-worker

# Check topics
docker compose -f docker-compose.worker.yml exec pulsar \
  bin/pulsar-admin topics list persistent://public/default
```

## FS Worker Refresh

The CI pipeline automatically refreshes the FS worker when deploying:

```bash
# Manual refresh (if needed)
gcloud compute ssh fs-worker-staging \
  --zone=us-central1-a \
  --command="cd ~/little-trader && \
    docker pull us-central1-docker.pkg.dev/little-trader/little-trader/fs-worker:latest && \
    docker compose -f docker-compose.worker.yml down && \
    docker compose -f docker-compose.worker.yml up -d"
```

## Rollback

### Cloud Run Traffic Splitting

To rollback without redeploying:

```bash
# View revisions
gcloud run revisions list --service=little-trader-staging

# Rollback to previous revision
gcloud run services update-traffic little-trader-staging \
  --to-revisions PREVIOUS_REVISION=100

# Gradual rollout (if deploying new version)
gcloud run services update-traffic little-trader-staging \
  --to-revisions LATEST=90,PREVIOUS=10  # 90% new, 10% old
```

## Monitoring

### Cloud Run

```bash
# View logs
gcloud run logs read little-trader-staging --limit 100

# View metrics
gcloud monitoring metrics-descriptors list \
  --filter='metric.type:run.googleapis.com/*'

# Check service status
gcloud run services describe little-trader-staging --region=us-central1
```

### Cloud SQL

```bash
# Connect to database
gcloud sql connect little-trader-postgres \
  --user=datomic

# Query storage usage
SELECT pg_size_pretty(pg_database_size('datomic'));
```

### Grafana (if VPC access available)

- Staging: http://grafana-staging:3001
- Production: http://grafana-prod:3001
- Dashboards for: CPU, memory, request latency, error rates

## Troubleshooting Deployments

### Deployment Failed: Image Push Failed

```
Error: Failed to push image to GAR
→ Check Docker credentials: gcloud auth configure-docker
→ Check GCP project ID matches in GitHub Secrets
→ Check Cloud Artifact Registry exists: gcloud artifacts repositories list
```

### Deployment Failed: Cloud Run Deploy Timed Out

```
Error: Deployment timed out
→ Check VPC connector is up: gcloud compute networks vpc-access connectors list
→ Check Cloud SQL instance is accessible
→ Check Datomic VM is healthy
```

### Health Check Failed

```
Error: Health check failed after 30 retries
→ Check app is starting: gcloud run logs read little-trader --limit 50
→ Check DATOMIC_URI is correct and database is accessible
→ Check JWT_SECRET is set
```

### FS Worker Not Refreshing

```
Error: FS worker still running old image
→ Check VM has internet access for docker pull
→ Check docker-compose.worker.yml syntax: docker compose -f docker-compose.worker.yml config
→ SSH to VM and check: docker ps | grep fs-worker
```

## Useful Commands

```bash
# Check all services are deployed
gcloud run services list --region=us-central1

# Check Cloud SQL is running
gcloud sql instances list

# Check VMs are running
gcloud compute instances list

# View recent deployments
gcloud run operations list --filter="metadata.@type:*DeployServiceRequest"

# Stream logs in real-time
gcloud run logs read little-trader --limit 200 --follow
```

## References

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Workload Identity Federation](https://cloud.google.com/docs/authentication/workload-identity-federation)
- [Cloud SQL Proxy](https://cloud.google.com/sql/docs/postgres/cloud-sql-proxy)
- [VPC Connector Guide](https://cloud.google.com/vpc/docs/serverless-vpc-access)
