#!/bin/bash

set -e

WDIR=$(dirname "$0")

MR_ID=$1
API_CLIENT_ID=$2
API_CLIENT_SECRET=$3
BASE64_ENCODED_CERT=$4
BASE64_ENCODED_KEY=$5
COMMIT_SHA=$6
DOCKER_USERNAME=$7
DOCKER_PASSWORD=$8
if [ -z "$MR_ID" ] || [ -z "$API_CLIENT_ID" ] || [ -z "$API_CLIENT_SECRET" ] || [ -z "$BASE64_ENCODED_CERT" ] || [ -z "$BASE64_ENCODED_KEY" ] || [ -z "$COMMIT_SHA" ] || [ -z "$DOCKER_USERNAME" ] || [ -z "$DOCKER_PASSWORD" ]; then
  echo "Usage: $0 <MR_ID> <API_CLIENT_ID> <API_CLIENT_SECRET> <BASE64_ENCODED_CERT> <BASE64_ENCODED_KEY> <COMMIT_SHA> <DOCKER_USERNAME> <DOCKER_PASSWORD>"
  exit 1
fi

kubectl create namespace corewar-mr-${MR_ID} --insecure-skip-tls-verify --dry-run=client -o yaml | kubectl apply --insecure-skip-tls-verify -f -

kubectl -n corewar-mr-${MR_ID} create secret docker-registry ozyria-registry-secret \
  --docker-server=registry.ozyria.fr \
  --docker-username=${DOCKER_USERNAME} \
  --docker-password=${DOCKER_PASSWORD} \
  --insecure-skip-tls-verify --dry-run=client -o yaml | kubectl apply --insecure-skip-tls-verify -f -

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

cp ${WDIR}/../apps/exec-app/envValues/.env.mr /tmp/exec-app.env
sed -i "s/{{MR_ID}}/${MR_ID}/g" /tmp/exec-app.env
sed -i "s/{{REDIS_PASSWORD}}/${REDIS_PASSWORD}/g" /tmp/exec-app.env
kubectl create configmap exec-app-config --from-env-file=/tmp/exec-app.env -n corewar-mr-${MR_ID} --insecure-skip-tls-verify --dry-run=client -o yaml | kubectl apply --insecure-skip-tls-verify -f -

MANIFESTS=(01-utils.yaml 02-migration.yaml 03-exec.yaml 04-back.yaml 05-front.yaml 06-ingress.yaml)
declare -A DEPLOYMENTS
DEPLOYMENTS["01-utils.yaml"]="postgres,redis"
DEPLOYMENTS["03-exec.yaml"]="exec-app"
DEPLOYMENTS["04-back.yaml"]="back-app"
DEPLOYMENTS["05-front.yaml"]="front-app"

for manifest in "${MANIFESTS[@]}"; do
  cp ${WDIR}/manifests/mr/${manifest} /tmp/${manifest}
  sed -i "s/{{MR_ID}}/${MR_ID}/g" /tmp/${manifest}
  sed -i "s/{{REDIS_PASSWORD}}/${REDIS_PASSWORD}/g" /tmp/${manifest}
  sed -i "s/{{BASE64_ENCODED_CERT}}/${BASE64_ENCODED_CERT}/g" /tmp/${manifest}
  sed -i "s/{{BASE64_ENCODED_KEY}}/${BASE64_ENCODED_KEY}/g" /tmp/${manifest}
  sed -i "s/{{COMMIT_SHA}}/${COMMIT_SHA}/g" /tmp/${manifest}
  echo "Applying manifest ${manifest}..."
  kubectl apply -f /tmp/${manifest} -n corewar-mr-${MR_ID} --insecure-skip-tls-verify --validate=false

  if [[ "$manifest" == "02-migration.yaml" ]]; then
    kubectl wait -n corewar-mr-${MR_ID} --for=condition=complete job/db-migration --timeout=300s --insecure-skip-tls-verify
    POD=$(kubectl get pod -n corewar-mr-${MR_ID} -l job-name=db-migration -o jsonpath='{.items[0].metadata.name}' --insecure-skip-tls-verify)
    echo ====== Migration job logs ======
    kubectl logs $POD -n corewar-mr-${MR_ID} --insecure-skip-tls-verify
    echo ================================
    kubectl delete job db-migration -n corewar-mr-${MR_ID} --insecure-skip-tls-verify
  fi

  if [[ -n "${DEPLOYMENTS[$manifest]}" ]]; then
    for deploy in ${DEPLOYMENTS[$manifest]//,/ }; do
      kubectl rollout status deployment/$deploy -n corewar-mr-${MR_ID} --insecure-skip-tls-verify --timeout=180s
    done
  fi
done
