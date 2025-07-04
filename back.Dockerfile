FROM node:23 as builder

RUN npm install -g pnpm

COPY back-app /app

WORKDIR /app

RUN pnpm install
RUN pnpm run build

FROM node:23 as runtime

RUN adduser --uid 999 appuser

RUN mkdir -p /app
COPY --from=builder --chown=appuser:appuser /app/dist /app/dist
COPY --from=builder --chown=appuser:appuser /app/node_modules /app/node_modules
COPY back-app/.env /app/.env

WORKDIR /app

USER appuser

EXPOSE 3000
ENTRYPOINT ["node", "dist/server.js"]
