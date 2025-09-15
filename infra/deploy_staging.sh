#!/bin/bash

set -e

WDIR=$(dirname "$0")

API_CLIENT_ID=$1
API_CLIENT_SECRET=$2
COMMIT_SHA=$3
if [ -z "$API_CLIENT_ID" ] || [ -z "$API_CLIENT_SECRET" ] || [ -z "$COMMIT_SHA" ]; then
  echo "Usage: $0 <API_CLIENT_ID> <API_CLIENT_SECRET> <COMMIT_SHA>"
  exit 1
fi

if kubectl get secret data-credentials -n corewar-staging --insecure-skip-tls-verify >/dev/null 2>&1; then
  POSTGRES_PASSWORD=$(kubectl get secret data-credentials -n corewar-staging --insecure-skip-tls-verify -o jsonpath="{.data.postgres-password}" | base64 --decode)
  REDIS_PASSWORD=$(kubectl get secret data-credentials -n corewar-staging --insecure-skip-tls-verify -o jsonpath="{.data.redis-password}" | base64 --decode)
  JWT_SECRET=$(kubectl get secret data-credentials -n corewar-staging --insecure-skip-tls-verify -o jsonpath="{.data.jwt-secret}" | base64 --decode)
else 
  echo "Secret data-credentials not found in namespace corewar-staging"
  exit 1
fi

cp ${WDIR}/../apps/back-app/envValues/.env.staging /tmp/back-app.env
sed -i "s/{{API_CLIENT_ID}}/${API_CLIENT_ID}/g" /tmp/back-app.env
sed -i "s/{{API_CLIENT_SECRET}}/${API_CLIENT_SECRET}/g" /tmp/back-app.env
sed -i "s/{{POSTGRES_PASSWORD}}/${POSTGRES_PASSWORD}/g" /tmp/back-app.env
sed -i "s/{{REDIS_PASSWORD}}/${REDIS_PASSWORD}/g" /tmp/back-app.env
sed -i "s/{{JWT_SECRET}}/${JWT_SECRET}/g" /tmp/back-app.env

kubectl create configmap back-app-config --from-env-file=/tmp/back-app.env -n corewar-staging --insecure-skip-tls-verify --dry-run=client -o yaml | kubectl apply --insecure-skip-tls-verify -f -

cp ${WDIR}/manifests/staging.yaml /tmp/staging.yaml
sed -i "s/{{COMMIT_SHA}}/${COMMIT_SHA}/g" /tmp/staging.yaml

kubectl apply -f /tmp/staging.yaml -n corewar-staging --insecure-skip-tls-verify --validate=false