# ---- Base image with pnpm ----
FROM node:23-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

# ---- Dependencies builder ----
# ---- Dependencies builder ----
FROM base AS deps
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/back-app/package.json apps/back-app/
COPY apps/front-app/package.json apps/front-app/
COPY libs/server-common/package.json libs/server-common/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ---- Builder ----
FROM deps AS build
WORKDIR /app

COPY . .

# Variables de build pour le front
ARG MR_ID
ARG ENVIRONMENT
WORKDIR /app/apps/front-app
COPY ./apps/front-app/envValues/.env.${ENVIRONMENT} .env
RUN sed -i "s/{{MR_ID}}/${MR_ID}/g" .env

WORKDIR /app

# Build apps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm run -r build

# Déployer uniquement les deps de prod et les artefacts utiles
RUN pnpm deploy --filter=back-app --prod /prod/back-app
RUN pnpm deploy --filter=front-app --prod /prod/front-app

# ---- Runtime for back-app ----
FROM node:23-alpine AS back-app
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat \
  && adduser -D app

COPY --from=build --chown=app:app /prod/back-app ./

USER app
EXPOSE 3000

# Commande par défaut : serveur
CMD ["npm", "start"]

# ---- Runtime for migrations ----
FROM back-app AS migrate
# Ici, même image que back-app mais CMD différent
CMD ["npm", "run", "migrate:deploy"]

# ---- Runtime for front-app ----
FROM nginx:1.27-alpine AS front-app

COPY --from=build /prod/front-app/dist /usr/share/nginx/html
COPY ./apps/front-app/conf/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]