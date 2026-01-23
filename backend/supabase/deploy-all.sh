#!/bin/bash

# Deploy all Supabase Edge Functions at once
# Usage: ./deploy-all.sh

set -e  # Exit on error

echo "🚀 Deploying all Supabase Edge Functions..."

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# List of functions to deploy
FUNCTIONS=(
  "shazam-detect"
  "youtube-search"
  "identify-song"
)

# Deploy each function
for func in "${FUNCTIONS[@]}"; do
  if [ -d "functions/$func" ]; then
    echo ""
    echo "📦 Deploying $func..."
    supabase functions deploy "$func" || {
      echo "❌ Failed to deploy $func"
      exit 1
    }
    echo "✅ Successfully deployed $func"
  else
    echo "⚠️  Function $func not found, skipping..."
  fi
done

echo ""
echo "🎉 All functions deployed successfully!"
echo ""
echo "📋 Deployed functions:"
supabase functions list
