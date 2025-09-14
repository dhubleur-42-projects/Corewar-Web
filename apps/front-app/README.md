# Front app

## Env variables

Copy the `./envValues/.env.local` file to `./.env`. You don't need to change anything for development

You can also configure other variables if you need to:
-   `VITE_API_URL` The url of the backend service
-   `VITE_LOCALE_KEY` The key used to store the locale in the local storage (default: `locale`)
-   `VITE_LOCALE_DEFAULT` The default locale to use if no locale is set in the local storage (default: `en`)

## Development

Use `pnpm dev` to start the development server. The app will be available at `http://localhost:8080`

## Build

Use `pnpm build` to build the app. The built files will be available in the `dist` folder
