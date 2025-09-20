# Exec app

This app is the one responsible for executing corewar executables. It is not mandatory to run it to have a functional local development environment, but it is recommended to have a complete setup.

Please read the [back-app README](../back-app/README.md) before setting up this app, as it shares many similarities.

## Data

This app uses a Redis server

You can reuse the Redis server from the local development environment.

## Env variables

Copy the `./envValues/.env.local` file to `./.env` and replace:
-   `{{REDIS_PASSWORD}}` with the password for the Redis server (make sure it matches the one in the `./localdev/.env`)

You can also configure other variables if you need to:

-   `LOGGER_KEY` The name used to identify the app in the logs, usually the name of the app (e.g. `back-app`)
-   `JWT_ISSUER` The app's url
-	`AUTHORIZED_ISSUERS` A comma-separated list of authorized issuers for the JWT tokens
-   `REDIS_HOST` The host for the Redis server, usually `localhost`
-   `REDIS_PASSWORD` The password for the Redis server
-   `PORT` The port on which the app will run, default is `3000`
-   `LOGGER_LEVEL` The logging level for the app, default is `INFO` (can be `DEBUG`, `INFO`, `WARN`, `ERROR`, in development mode, `DEBUG` is recommended)
-   `IS_PROD` Set to `true` if the app is running in production mode, default is `false`
-   `PRIVATE_KEY_VALIDITY` Time in ms for which the private key of the JWKS will be valid, default is `86400000` (1 day)
-   `REDIS_PORT` The port for the Redis server, default is `6379`
-	`REDIS_PREFIX` The prefix for the Redis keys, default is `back-app`
-	`CORS_URLS` A comma-separated list of URLs allowed to access the app (for CORS), e.g. `http://localhost:3000,http://localhost:3001`

## Development

Use `pnpm dev` to start the development server. The app will be available at `http://localhost:3001` (or the port you set in the `.env` file)

## Build

Use `pnpm build` to build the app. The built files will be available in the `dist` folder

## Run

Use `pnpm start` to run the app in production mode (you need to build the app first). The app will be available at `http://localhost:3001` (or the port you set in the `.env` file)