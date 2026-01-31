#!/bin/bash
# Deploy song-to-bolly-beat recognize server to Google Cloud Run (Techtank GCP).
# Run from the backend directory. Requires gcloud and a project where you have
# Service Usage Admin + Cloud Run Admin (e.g. org admin or project owner).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PROJECT_ID="${GCP_PROJECT_ID:-certifyos-production-platform}"
REGION="${GCP_REGION:-us-central1}"

echo "Deploying recognize server to Cloud Run"
echo "  Project: $PROJECT_ID"
echo "  Region:  $REGION"
echo ""

gcloud config set project "$PROJECT_ID"

echo "Enabling required APIs (one-time)..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

echo ""
echo "Building and deploying (this may take a few minutes)..."
gcloud run deploy recognize \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --no-invoker-iam-check \
  --platform managed

echo ""
echo "Done. Use the Service URL above as VITE_RECOGNIZE_API_URL in frontend/.env (no trailing slash)."
