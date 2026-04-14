# Cloud Run CI/CD Setup Guide

This guide walks you through setting up automated CI/CD deployment to Google Cloud Run for the Little Trader application.

## Why Cloud Run?

Cloud Run is the ideal choice for this project because:

| Feature | Benefit |
|---------|---------|
| **Scale to Zero** | Pay nothing when not in use |
| **Automatic HTTPS** | Free SSL certificates |
| **Global Deployment** | Deploy anywhere in the world |
| **Simple Pricing** | Pay per request (~$0.00001 per request) |
| **No Cluster Management** | Fully managed, no Kubernetes expertise needed |
| **Fast Cold Starts** | JVM optimized with startup CPU boost |
| **Container Native** | Uses existing Dockerfile |

### Cost Estimate (Development)

For a development environment with minimal traffic:
- **Compute**: ~$0-5/month (scales to zero)
- **Artifact Registry**: ~$0.10/GB stored
- **Networking**: ~$0.12/GB egress
- **Total**: **< $10/month** for typical dev usage

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed ([Install Guide](https://cloud.google.com/sdk/docs/install))
3. **GitHub Repository** (the Little Trader repo)
4. **Admin access** to GCP project

## Quick Setup (5 minutes)

### Option 1: Automated Setup Script

```bash
# Clone the repo (if not already)
cd little-trader

# Set your configuration
export GCP_PROJECT_ID="your-gcp-project-id"
export GITHUB_REPO="4coders-com-br/little-trader"
export GCP_REGION="us-central1"  # or your preferred region

# Run the setup script
./cloud-run/setup.sh
```

The script will:
1. Enable required GCP APIs
2. Create Artifact Registry repository
3. Create service account with deployment permissions
4. Configure Workload Identity Federation for GitHub Actions
5. Output the secrets to add to GitHub

### Option 2: Manual Setup

If you prefer manual setup or need to customize, follow these steps:

#### Step 1: Enable APIs

```bash
gcloud config set project YOUR_PROJECT_ID

gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    iam.googleapis.com \
    iamcredentials.googleapis.com
```

#### Step 2: Create Artifact Registry

```bash
gcloud artifacts repositories create little-trader \
    --repository-format=docker \
    --location=us-central1 \
    --description="Little Trader Docker images"
```

#### Step 3: Create Service Account

```bash
# Create service account
gcloud iam service-accounts create github-actions-deployer \
    --display-name="GitHub Actions Deployer"

# Grant roles
SA_EMAIL="github-actions-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/iam.serviceAccountUser"
```

#### Step 4: Setup Workload Identity Federation

```bash
# Create identity pool
gcloud iam workload-identity-pools create github-actions-pool \
    --location="global" \
    --display-name="GitHub Actions Pool"

# Create OIDC provider
gcloud iam workload-identity-pools providers create-oidc github-provider \
    --location="global" \
    --workload-identity-pool="github-actions-pool" \
    --display-name="GitHub Provider" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
    --attribute-condition="assertion.repository=='4coders-com-br/little-trader'"

# Allow GitHub to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding "${SA_EMAIL}" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/4coders-com-br/little-trader"
```

## GitHub Secrets Configuration

After running the setup (automated or manual), add these secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|-------------|-------|
| `GCP_PROJECT_ID` | Your GCP project ID (e.g., `my-project-123`) |
| `GCP_REGION` | Deployment region (e.g., `us-central1`) |
| `GCP_SA_EMAIL` | Service account email (e.g., `github-actions-deployer@project.iam.gserviceaccount.com`) |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full provider path (see setup script output) |
| `DATOMIC_URI_STAGING` | Datomic URI for staging Cloud Run service |
| `DATOMIC_URI_PRODUCTION` | Datomic URI for production Cloud Run service |
| `PULSAR_SERVICE_URL_STAGING` | Pulsar broker URL for staging (e.g., `pulsar://10.10.0.10:6650`) |
| `PULSAR_SERVICE_URL_PRODUCTION` | Pulsar broker URL for production (if different) |
| `DERIBIT_CLIENT_ID` | Deribit API client id (testnet/prod as desired) |
| `DERIBIT_PRIVATE_KEY` | Deribit private key/token |

## Deployment Flow

```
┌─────────────┐     ┌──────────┐     ┌─────────────┐     ┌───────────┐
│  Push to    │────▶│  Tests   │────▶│   Build &   │────▶│  Deploy   │
│   main      │     │  & Lint  │     │ Push Image  │     │ Cloud Run │
└─────────────┘     └──────────┘     └─────────────┘     └───────────┘
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │  Artifact   │
                                    │  Registry   │
                                    └─────────────┘
```

### Automatic Deployments

- **Push to `main`**: Automatically deploys to staging
- **Manual dispatch**: Can deploy to staging or production

### Manual Deployment

#### Option 1: GitHub UI

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Cloud Run** workflow
3. Click **Run workflow**
4. Choose environment (staging/production)

#### Option 2: GitHub CLI

```bash
# Deploy to staging
gh workflow run "Deploy to Cloud Run" --repo 4coders-com-br/little-trader -f environment=staging

# Deploy to production (requires approval)
gh workflow run "Deploy to Cloud Run" --repo 4coders-com-br/little-trader -f environment=production

# Watch the deployment
gh run watch $(gh run list --workflow="Deploy to Cloud Run" --limit 1 --json databaseId -q '.[0].databaseId')

# Check workflow runs
gh run list --workflow="Deploy to Cloud Run" --limit 5
```

#### Useful CLI Commands

```bash
# View workflow logs
gh run view <run-id> --log

# View failed step logs
gh run view <run-id> --log-failed

# List all secrets (verify configuration)
gh secret list --repo 4coders-com-br/little-trader
```

## Cloud Run Service URLs

After deployment, your services will be available at:

- **Staging**: https://little-trader-staging-x4miahfzia-uc.a.run.app
- **Production**: `https://little-trader-HASH-REGION.a.run.app` (after first production deployment)

### Quick Health Check

```bash
curl https://little-trader-staging-x4miahfzia-uc.a.run.app/health
# Returns: {"status":"ok","timestamp":...}
```

## Monitoring & Logs

### View Logs

```bash
# Staging logs
gcloud run services logs read little-trader-staging --region=us-central1

# Follow logs in real-time
gcloud run services logs tail little-trader-staging --region=us-central1
```

### View in Console

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Select your service
3. View metrics, logs, revisions, and traffic

## Custom Domain (Optional)

To use a custom domain:

```bash
# Map a custom domain
gcloud run domain-mappings create \
    --service=little-trader \
    --domain=trading.yourdomain.com \
    --region=us-central1
```

Then update your DNS with the provided records.

## Troubleshooting

### Build Fails

**Issue**: Docker build fails
```bash
# Test build locally
docker build -t little-trader:test .
docker run -p 8080:8080 little-trader:test
```

### Authentication Fails

**Issue**: `PERMISSION_DENIED` errors
```bash
# Verify service account permissions
gcloud projects get-iam-policy YOUR_PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:github-actions-deployer"

# Verify Workload Identity setup
gcloud iam workload-identity-pools providers describe github-provider \
    --location="global" \
    --workload-identity-pool="github-actions-pool"
```

### Deployment Fails

**Issue**: Cloud Run deployment fails
```bash
# Check recent deployments
gcloud run revisions list --service=little-trader-staging --region=us-central1

# Check revision logs
gcloud run revisions logs read REVISION_NAME --region=us-central1
```

### Cold Start Performance

**Issue**: Slow cold starts

The JVM needs time to warm up. Solutions:
1. **Enable startup CPU boost** (already configured)
2. **Increase min-instances** to 1 for production
3. **Use GraalVM native image** (advanced)

## Cost Optimization

### Development
- `min-instances: 0` (scale to zero)
- `cpu-throttling: true` (only use CPU during requests)
- Low memory (512Mi)

### Production
- `min-instances: 1` (faster response times)
- Higher memory (1Gi) for better performance
- Consider committed use discounts

## Security Best Practices

1. **Workload Identity Federation**: No long-lived service account keys
2. **Least Privilege**: Service account only has necessary permissions
3. **Private Services**: For internal services, remove `--allow-unauthenticated`
4. **Secret Manager**: Use Secret Manager for sensitive config (future enhancement)

## Region Selection

Choose a region based on your needs:

| Region | Location | Latency to Brazil |
|--------|----------|-------------------|
| `southamerica-east1` | São Paulo | ~20ms |
| `us-east1` | South Carolina | ~120ms |
| `us-central1` | Iowa | ~150ms |
| `europe-west1` | Belgium | ~200ms |

For development, `us-central1` is cost-effective. For production serving Brazilian users, consider `southamerica-east1`.

## Next Steps

1. Run the setup script
2. Add secrets to GitHub
3. Push to `main` branch
4. Watch the deployment in GitHub Actions
5. Access your staging URL
6. (Optional) Configure custom domain
7. (Optional) Set up production environment with approval gates

---

## Files Reference

| File | Purpose |
|------|---------|
| `.github/workflows/cloud-run.yml` | GitHub Actions deployment workflow |
| `cloud-run/setup.sh` | GCP infrastructure setup script |
| `cloud-run/service-staging.yaml` | Cloud Run service configuration (reference) |
| `Dockerfile` | Multi-stage container build |
