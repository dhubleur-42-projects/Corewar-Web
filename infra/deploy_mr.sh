#!/bin/bash

set -e

WDIR=$(dirname "$0")

MR_ID=$1
API_CLIENT_ID=$2
API_CLIENT_SECRET=$3
BASE64_ENCODED_CERT=$4
BASE64_ENCODED_KEY=$5
COMMIT_SHA=$6
if [ -z "$MR_ID" ] || [ -z "$API_CLIENT_ID" ] || [ -z "$API_CLIENT_SECRET" ] || [ -z "$BASE64_ENCODED_CERT" ] || [ -z "$BASE64_ENCODED_KEY" ] || [ -z "$COMMIT_SHA" ]; then
  echo "Usage: $0 <MR_ID> <API_CLIENT_ID> <API_CLIENT_SECRET> <BASE64_ENCODED_CERT> <BASE64_ENCODED_KEY> <COMMIT_SHA>"
  exit 1
fi

kubectl create namespace corewar-mr-${MR_ID} --insecure-skip-tls-verify --dry-run=client -o yaml | kubectl apply --insecure-skip-tls-verify -f -

POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr '/+=' '_-' | cut -c1-32)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr '/+=' '_-' | cut -c1-32)
JWT_SECRET=$(openssl rand -base64 32 | tr '/+=' '_-' | cut -c1-32)

if kubectl get secret data-credentials -n corewar-mr-${MR_ID} --insecure-skip-tls-verify >/dev/null 2>&1; then
  POSTGRES_PASSWORD=$(kubectl get secret data-credentials -n corewar-mr-${MR_ID} --insecure-skip-tls-verify -o jsonpath="{.data.postgres-password}" | base64 --decode)
  REDIS_PASSWORD=$(kubectl get secret data-credentials -n corewar-mr-${MR_ID} --insecure-skip-tls-verify -o jsonpath="{.data.redis-password}" | base64 --decode)
  JWT_SECRET=$(kubectl get secret data-credentials -n corewar-mr-${MR_ID} --insecure-skip-tls-verify -o jsonpath="{.data.jwt-secret}" | base64 --decode)
else 
  kubectl create secret generic data-credentials \
    --from-literal=postgres-password=$POSTGRES_PASSWORD \
    --from-literal=redis-password=$REDIS_PASSWORD \
    --from-literal=jwt-secret=$JWT_SECRET \
    -n corewar-mr-${MR_ID} --insecure-skip-tls-verify
fi

cp ${WDIR}/../apps/back-app/envValues/.env.mr /tmp/back-app.env
sed -i "s/{{API_CLIENT_ID}}/${API_CLIENT_ID}/g" /tmp/back-app.env
sed -i "s/{{API_CLIENT_SECRET}}/${API_CLIENT_SECRET}/g" /tmp/back-app.env
sed -i "s/{{MR_ID}}/${MR_ID}/g" /tmp/back-app.env
sed -i "s/{{POSTGRES_PASSWORD}}/${POSTGRES_PASSWORD}/g" /tmp/back-app.env
sed -i "s/{{REDIS_PASSWORD}}/${REDIS_PASSWORD}/g" /tmp/back-app.env
sed -i "s/{{JWT_SECRET}}/${JWT_SECRET}/g" /tmp/back-app.env
kubectl create configmap back-app-config --from-env-file=/tmp/back-app.env -n corewar-mr-${MR_ID} --insecure-skip-tls-verify --dry-run=client -o yaml | kubectl apply --insecure-skip-tls-verify -f -

cp ${WDIR}/manifests/mr.yaml /tmp/mr.yaml
sed -i "s/{{MR_ID}}/${MR_ID}/g" /tmp/mr.yaml
sed -i "s/{{REDIS_PASSWORD}}/${REDIS_PASSWORD}/g" /tmp/mr.yaml
sed -i "s/{{BASE64_ENCODED_CERT}}/${BASE64_ENCODED_CERT}/g" /tmp/mr.yaml
sed -i "s/{{BASE64_ENCODED_KEY}}/${BASE64_ENCODED_KEY}/g" /tmp/mr.yaml
sed -i "s/{{COMMIT_SHA}}/${COMMIT_SHA}/g" /tmp/mr.yaml

kubectl apply -f /tmp/mr.yaml -n corewar-mr-${MR_ID} --insecure-skip-tls-verify --validate=false