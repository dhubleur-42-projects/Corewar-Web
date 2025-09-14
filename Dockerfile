FROM node:23-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM base AS build

RUN apk add --no-cache openssl libc6-compat

COPY . /app

WORKDIR /app/apps/front-app
ARG VITE_API_URL
RUN echo "VITE_API_URL=$VITE_API_URL" > .env

WORKDIR /app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run -r build

RUN pnpm deploy --filter=back-app --prod /prod/back-app
RUN pnpm deploy --filter=front-app --prod /prod/front-app

FROM base AS back-app

RUN apk add --no-cache openssl libc6-compat

RUN adduser -D app

COPY --from=build --chown=app:app /prod/back-app /app
WORKDIR /app

USER app

EXPOSE 3000
CMD [ "sh", "-c", "pnpm run migrate:deploy && pnpm start" ]

FROM nginx:1.27-alpine AS front-app

COPY --from=build --chown=app:app /prod/front-app/dist /usr/share/nginx/html
COPY ./apps/front-app/conf/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]