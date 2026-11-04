#!/bin/bash

# Generate static files for hosting
# This script builds the frontend and copies necessary files to dist directory

set -e  # Exit on any error


if [[ $DEBUG_FLAG == "1" ]]; then
    echo "Debug mode enabled"
    set -x  # Print commands as they are executed
fi

echo "📦 Installing dependencies..."
npm install

echo "🏗️  Building frontend..."
rm -Rf dist
npm run build

# Add some versioning information (git hash)
echo "{
    \"git_version\": \"$(git rev-parse HEAD)\",
    \"build_time\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
}" > dist/version.json

echo "✅ Static files generated successfully in dist/ directory"
echo "🚀 You can now serve the static files using server.sh"
