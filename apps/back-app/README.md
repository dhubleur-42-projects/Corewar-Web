# Back app

## Data

This app uses a PostgreSQL database and a Redis server

You can edit this services' configuration by copying the `./localdev/.env.tpl` file to `./localdev/.env` and modifying the variables as needed (if you change ports, make sure to update the `docker-compose.yml` file accordingly)

You can run these services using Docker Compose. Make sure you have Docker and Docker Compose installed, then run the following commands:

```bash
docker compose -f ./localdev/docker-compose.yml up -d
```

This will start the PostgreSQL database and the Redis server in detached mode. The database will be available at `localhost:5432` and the Redis server at `localhost:6379` by default

## Env variables

Copy the `./envValues/.env.local` file to `./.env` and replace:

- `{{API_CLIENT_ID}}` and `{{API_CLIENT_SECRET}}` with your 42 API credentials (the app should have `http://localhost:8080` as redirect URI for development)
- `{{JWT_SECRET}}` with a random string
- `{{POSTGRES_XXX}}` with your PostgreSQL database credentials (make sure they match the ones in the `./localdev/.env`)
- `{{REDIS_PASSWORD}}` with the password for the Redis server (make sure it matches the one in the `./localdev/.env`)
- `{{UPLOAD_DIR}}` with an absolute path to a directory where the app will store uploaded files

You can also configure other variables if you need to:

- `LOGGER_KEY` The name used to identify the app in the logs, usually the name of the app (e.g. `back-app`)
- `API_CLIENT_ID` The client ID for the 42 API
- `API_CLIENT_SECRET` The client secret for the 42 API
- `JWT_SECRET` The secret used to sign JWT tokens that authenticate users on the API
- `SELF_URL` The app's url
- `AUTHORIZED_ISSUERS` A comma-separated list of authorized issuers for the JWT tokens
- `DATABASE_URL` The URL for the PostgreSQL database, in the format `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`
- `REDIS_HOST` The host for the Redis server, usually `localhost`
- `REDIS_PASSWORD` The password for the Redis server
- `PORT` The port on which the app will run, default is `3000`
- `LOGGER_LEVEL` The logging level for the app, default is `INFO` (can be `DEBUG`, `INFO`, `WARN`, `ERROR`, in development mode, `DEBUG` is recommended)
- `FRONT_URL` The URL of the front app, default is `http://localhost:8080`
- `ACCESS_TOKEN_VALIDITY_SEC` The validity of the access token in seconds, default is `3600` (1 hour)
- `ACCESS_TOKEN_COOKIE_NAME` The name of the cookie that stores the access token, default is `access_token`
- `REMEMBER_ME_VALIDITY_SEC` The validity of the "remember me" token in seconds, default is `2592000` (30 days)
- `REMEMBER_ME_COOKIE_NAME` The name of the cookie that stores the "remember me" token, default is `remember_me`
- `IS_SSL` Set to `true` if the app is running with SSL (https), default is `false`
- `COOKIE_DOMAIN` The domain for the cookies, don't set it if you are running the app locally
- `IS_PROD` Set to `true` if the app is running in production mode, default is `false`
- `USER_WHITELIST` A comma-separated list of user logins that are allowed to access the app, if not set, all users are allowed
- `PRIVATE_KEY_VALIDITY` Time in ms for which the private key of the JWKS will be valid, default is `86400000` (1 day)
- `REDIS_PORT` The port for the Redis server, default is `6379`
- `REDIS_PREFIX` The prefix for the Redis keys, default is `back-app`
- `EXEC_URL` The URL of the execution server, default is `http://localhost:3001`
- `UPLOAD_DIR` The absolute path to the directory where the app will store uploaded files

## Development

Use `pnpm migrate:deploy` to apply the database migrations. This will create the necessary tables in the PostgreSQL database

Use `pnpm prisma:generate` to generate the Prisma client based on the current schema. This will create the necessary files in the `node_modules/@prisma/client` folder

Use `pnpm dev` to start the development server. The app will be available at `http://localhost:3000` (or the port you set in the `.env` file)

## Build

Use `pnpm build` to build the app. The built files will be available in the `dist` folder

## Run

Use `pnpm start` to run the app in production mode (you need to build the app first). The app will be available at `http://localhost:3000` (or the port you set in the `.env` file)

## Data

### Migrations

Use `pnpm migrate:dev` to create a migration according to the current state of the database. Please make migrations as small and atomic as possible, so that they can be easily applied and reverted. All migrations needs to be backward compatible with the previous version of the app

### Prisma studio

Use `pnpm prisma:studio` to open the Prisma Studio, a web interface to view and edit the data in the database. It will be available at `http://localhost:5555` by default
