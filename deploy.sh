#!/bin/bash


echo "WARNING: committing things staged in the repo"

# detect pending git changes and require -c/--commit flag to continue
COMMIT=false
for arg in "$@"; do
  case "$arg" in
    -c|--commit) COMMIT=true ;;
  esac
done

if [ -n "$(git status --porcelain)" ] && [ "$COMMIT" = false ]; then
  echo "ERROR: repo has pending changes. Re-run with -c/--commit to deploy including them:"
  git status --short
  exit 1
fi

bash scripts/generate_static.sh
bash scripts/deploy_cloudflare.sh --force
