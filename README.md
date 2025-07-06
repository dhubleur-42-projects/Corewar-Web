# Introduction

This project is a template project to create web applications implementing an auth with the 42's school API

## Technologies

### Front

-   Typescript
-   React
-   React Router
-   MUI
-   Tanstack Query
-   Zustand

### Back

-   Typescript
-   Fastify
-   Prisma
-   BullMQ

### Data

-   PostgreSQL
-   Redis

# Formatting

All projects are configured to use prettier and eslint for code formatting and linting. Please make sure that your IDE is configured to use these tools. Linting errors will not prevent local development, but they will be reported in the CI pipeline. You can run `pnpm lint` in each project to check for linting errors

If you introduce features that require new linting rules, please make sure to update the `.eslintrc.js` file in the respective project

# Installation

This project uses Volta to manage the Node.js and pnpm versions. If you don't have Volta installed, you can install it by following the instructions on the [Volta website](https://volta.sh/)

This project is a pnpm monorepo divided into two main folders:

-   `apps` for all the applications
-   `libs` for internal shared libraries

Please make sure to read the [libs README](./libs/README.md) file to understand how to use the shared libraries in your projects

In order to install the project, you can run the following command in the root of the project:

```bash
pnpm install
```

In order to run the project, you can read projects' README files:

-   [Front README](./apps/front-app/README.md)
-   [Back README](./apps/back-app/README.md)
