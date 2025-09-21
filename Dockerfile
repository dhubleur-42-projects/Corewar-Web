FROM node:23-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM base AS deps
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/back-app/package.json apps/back-app/
COPY apps/front-app/package.json apps/front-app/
COPY apps/exec-app/package.json apps/exec-app/
COPY libs/server-common/package.json libs/server-common/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /app

COPY . .

ARG MR_ID
ARG ENVIRONMENT
WORKDIR /app/apps/front-app
COPY ./apps/front-app/envValues/.env.${ENVIRONMENT} .env
RUN sed -i "s/{{MR_ID}}/${MR_ID}/g" .env

WORKDIR /app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm run -r build

RUN pnpm deploy --filter=back-app --prod /prod/back-app
RUN pnpm deploy --filter=exec-app --prod /prod/exec-app
RUN pnpm deploy --filter=front-app --prod /prod/front-app

FROM node:23-alpine AS back-app
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat \
  && adduser -D app

COPY --from=build --chown=app:app /prod/back-app ./

USER app
EXPOSE 3000

CMD ["npm", "start"]

FROM back-app AS migrate-job

CMD ["npm", "run", "migrate:deploy"]

FROM node:23-alpine AS exec-app
WORKDIR /app

RUN adduser -D app

COPY --from=build --chown=app:app /prod/exec-app ./

USER app
EXPOSE 3000

CMD ["npm", "start"]

FROM nginx:1.27-alpine AS front-app

COPY --from=build /prod/front-app/dist /usr/share/nginx/html
COPY ./apps/front-app/conf/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]