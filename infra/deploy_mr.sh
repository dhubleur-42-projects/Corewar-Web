#!/bin/bash

set -xe

WDIR=$(dirname "$0")

MR_ID=$1
API_CLIENT_ID=$2
API_CLIENT_SECRET=$3
CRT_FILE=$4
KEY_FILE=$5
if [ -z "$MR_ID" ] || [ -z "$API_CLIENT_ID" ] || [ -z "$API_CLIENT_SECRET" ] || [ -z "$CRT_FILE" ] || [ -z "$KEY_FILE" ]; then
  echo "Usage: $0 <MR_ID> <API_CLIENT_ID> <API_CLIENT_SECRET> <CRT_FILE> <KEY_FILE>"
  exit 1
fi

POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr '/+=' '_-' | cut -c1-32)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr '/+=' '_-' | cut -c1-32)
JWT_SECRET=$(openssl rand -base64 32 | tr '/+=' '_-' | cut -c1-32)

cp ${WDIR}/../apps/back-app/envValues/.env.mr /tmp/back-app.env
sed -i "s/{{API_CLIENT_ID}}/${API_CLIENT_ID}/g" /tmp/back-app.env
sed -i "s/{{API_CLIENT_SECRET}}/${API_CLIENT_SECRET}/g" /tmp/back-app.env
sed -i "s/{{MR_ID}}/${MR_ID}/g" /tmp/back-app.env
sed -i "s/{{POSTGRES_PASSWORD}}/${POSTGRES_PASSWORD}/g" /tmp/back-app.env
sed -i "s/{{REDIS_PASSWORD}}/${REDIS_PASSWORD}/g" /tmp/back-app.env
sed -i "s/{{JWT_SECRET}}/${JWT_SECRET}/g" /tmp/back-app.env

kubectl create namespace corewar-mr-${MR_ID} || true
kubectl create configmap back-app-config --from-env-file=/tmp/back-app.env -n corewar-mr-${MR_ID} || true

POSTGRES_PASSWORD_BASE64=$(echo -n $POSTGRES_PASSWORD | base64)
REDIS_PASSWORD_BASE64=$(echo -n $REDIS_PASSWORD | base64)
BASE64_ENCODED_CERT=$(cat $CRT_FILE | base64 | tr -d '\n')
BASE64_ENCODED_KEY=$(cat $KEY_FILE | base64 | tr -d '\n')

cp ${WDIR}/manifests/mr.yaml /tmp/mr.yaml
sed -i "s/{{MR_ID}}/${MR_ID}/g" /tmp/mr.yaml
sed -i "s/{{POSTGRES_PASSWORD_BASE64}}/${POSTGRES_PASSWORD_BASE64}/g" /tmp/mr.yaml
sed -i "s/{{REDIS_PASSWORD_BASE64}}/${REDIS_PASSWORD_BASE64}/g" /tmp/mr.yaml
sed -i "s/{{REDIS_PASSWORD}}/${REDIS_PASSWORD}/g" /tmp/mr.yaml
sed -i "s/{{BASE64_ENCODED_CERT}}/${BASE64_ENCODED_CERT}/g" /tmp/mr.yaml
sed -i "s/{{BASE64_ENCODED_KEY}}/${BASE64_ENCODED_KEY}/g" /tmp/mr.yaml

kubectl apply -f /tmp/mr.yaml -n corewar-mr-${MR_ID}