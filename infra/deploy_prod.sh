#!/bin/bash

set -e

WDIR=$(dirname "$0")

API_CLIENT_ID=$1
API_CLIENT_SECRET=$2
VERSION=$3
if [ -z "$API_CLIENT_ID" ] || [ -z "$API_CLIENT_SECRET" ] || [ -z "$VERSION" ]; then
  echo "Usage: $0 <API_CLIENT_ID> <API_CLIENT_SECRET> <VERSION>"
  exit 1
fi

if kubectl get secret data-credentials -n corewar-prod >/dev/null 2>&1; then
  POSTGRES_PASSWORD=$(kubectl get secret data-credentials -n corewar-prod -o jsonpath="{.data.postgres-password}" | base64 --decode)
  REDIS_PASSWORD=$(kubectl get secret data-credentials -n corewar-prod -o jsonpath="{.data.redis-password}" | base64 --decode)
  JWT_SECRET=$(kubectl get secret data-credentials -n corewar-prod -o jsonpath="{.data.jwt-secret}" | base64 --decode)
else 
  echo "Secret data-credentials not found in namespace corewar-prod"
  exit 1
fi

cp ${WDIR}/../apps/back-app/envValues/.env.prod /tmp/back-app.env
sed -i "s/{{API_CLIENT_ID}}/${API_CLIENT_ID}/g" /tmp/back-app.env
sed -i "s/{{API_CLIENT_SECRET}}/${API_CLIENT_SECRET}/g" /tmp/back-app.env
sed -i "s/{{POSTGRES_PASSWORD}}/${POSTGRES_PASSWORD}/g" /tmp/back-app.env
sed -i "s/{{REDIS_PASSWORD}}/${REDIS_PASSWORD}/g" /tmp/back-app.env
sed -i "s/{{JWT_SECRET}}/${JWT_SECRET}/g" /tmp/back-app.env
kubectl create configmap back-app-config --from-env-file=/tmp/back-app.env -n corewar-prod --dry-run=client -o yaml | kubectl apply -f -

cp ${WDIR}/../apps/exec-app/envValues/.env.prod /tmp/exec-app.env
sed -i "s/{{REDIS_PASSWORD}}/${REDIS_PASSWORD}/g" /tmp/exec-app.env
kubectl create configmap exec-app-config --from-env-file=/tmp/exec-app.env -n corewar-prod --dry-run=client -o yaml | kubectl apply -f -

MANIFESTS=(01-migration.yaml 02-exec.yaml 03-back.yaml 04-front.yaml)
declare -A DEPLOYMENTS
DEPLOYMENTS["02-exec.yaml"]="exec-app"
DEPLOYMENTS["03-back.yaml"]="back-app"
DEPLOYMENTS["04-front.yaml"]="front-app"

kubectl delete job db-migration -n corewar-prod --ignore-not-found

for manifest in "${MANIFESTS[@]}"; do
  cp ${WDIR}/manifests/prod/${manifest} /tmp/${manifest}
  sed -i "s/{{VERSION}}/${VERSION}/g" /tmp/${manifest}
  echo "Applying manifest ${manifest}..."
  kubectl apply -f /tmp/${manifest} -n corewar-prod --validate=false

  if [[ "$manifest" == "01-migration.yaml" ]]; then
    kubectl wait -n corewar-prod --for=condition=complete job/db-migration --timeout=300s
    POD=$(kubectl get pod -n corewar-prod -l job-name=db-migration -o jsonpath='{.items[0].metadata.name}')
    echo ====== Migration job logs ======
    kubectl logs $POD -n corewar-prod
    echo ================================
  fi

  if [[ -n "${DEPLOYMENTS[$manifest]}" ]]; then
    for deploy in ${DEPLOYMENTS[$manifest]//,/ }; do
      echo "Waiting for deployment $deploy to be ready..."
      kubectl rollout status deployment/$deploy -n corewar-prod --timeout=180s
      echo "Deployment $deploy is ready."
    done
  fi
done
