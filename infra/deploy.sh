#!/bin/bash
# AURA Studio — Cloud Run Deployment Script
# Usage: ./infra/deploy.sh

set -e

PROJECT_ID="aura-studio-hack"
REGION="us-central1"
REPO="aura-studio-repo"
BACKEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/aura-backend:latest"

echo "=== AURA Studio Deployment ==="

# 1. Build and push backend Docker image
echo "Building backend image..."
cd backend
gcloud builds submit --tag "$BACKEND_IMAGE" --project "$PROJECT_ID"

# 2. Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy aura-backend \
  --image "$BACKEND_IMAGE" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GCS_BUCKET=aura-studio-hack-assets,GCP_REGION=${REGION}" \
  --service-account "aura-studio-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo "=== Deployment Complete ==="
BACKEND_URL=$(gcloud run services describe aura-backend --region "$REGION" --project "$PROJECT_ID" --format='value(status.url)')
echo "Backend URL: $BACKEND_URL"
