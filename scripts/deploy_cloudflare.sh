#!/bin/bash

# exit on error
set -e

DEBUG_FLAG="${DEBUG_FLAG:-false}"
FORCE_DEPLOY=false

for arg in "$@"; do
    if [[ "$arg" == "--force" ]]; then
        FORCE_DEPLOY=true
    fi
done

if [[ $DEBUG_FLAG == true ]]; then
    echo "Debug flag enabled"
    set -x
fi

# Configuration
# parse metadata.json and extract name key
PROJECT_NAME=measureimage
DIST_DIR="dist"
PROJECT_DIR="$(pwd)"


# Check if cloudflare_project.flag exists, if not, create the project
if [ ! -f "cloudflare_project.flag" ]; then
    echo "Creating Cloudflare Pages project: $PROJECT_NAME..."
    npx --yes wrangler pages project create "$PROJECT_NAME" --production-branch main
    touch cloudflare_project.flag
fi

# check if directory is a git repository and commit changes if there are any
if [ -d ".git" ]; then
    # Detect diff with git command
    # exclude dist and download_count.txt directory
    CHANGES_LIST="$(git  status --short -- . ':(exclude)dist' ':(exclude)download_count.txt')"
    if [[ -z "$CHANGES_LIST" ]]; then
        if [[ "$FORCE_DEPLOY" != true ]]; then
            echo "No changes detected, skipping deployment..."
            exit 0
        else
            echo "No changes detected, but --force set. Skipping commit and forcing deployment."
        fi
    else
        echo "Changes detected:"
        echo "$CHANGES_LIST"
        # Commit changes
        git add .

        # Parse changes list to get file names
        # M components/MarkdownRenderer.tsx > MarkdownRenderer.tsx
        # M utils/chunking.ts > chunking.ts
        CHANGED_FILES=$(echo "$CHANGES_LIST" | grep -v "Changes detected:" |  awk '{print $2}' | xargs -n1 basename | tr '\n' ' ')
        git commit -m "Deploy to Cloudflare Pages. Number: $(cat download_count.txt) Files: $CHANGED_FILES"
        echo "Changes committed, proceeding with deployment"
    fi
else
    echo "Directory is not a git repository, skipping commit. Consider initializing a git repository and committing changes."
fi

# Deploy to Cloudflare Pages
if [ -d "$DIST_DIR" ]; then
    echo "Deploying $DIST_DIR to Cloudflare Pages project: $PROJECT_NAME..."
    npx --yes wrangler pages deploy "$DIST_DIR" --project-name "$PROJECT_NAME"
else
    echo "Error: Directory '$DIST_DIR' not found. Please run generate_static.sh first."
    exit 1
fi
