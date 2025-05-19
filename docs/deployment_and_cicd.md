# Deployment Strategies and CI/CD

This document outlines the deployment strategies using Docker and Docker Compose, as well as the Continuous Integration/Continuous Deployment (CI/CD) workflows set up with GitHub Actions.

## Docker Setup

The application is containerized using Docker to ensure consistent environments across development, testing, and production, and to simplify deployment.

### `Dockerfile`

The `Dockerfile` located in the project root defines the multi-stage build process for the Next.js application. This approach creates optimized, lean production images.

### `docker-compose.yml`

The `docker-compose.yml` file orchestrates a multi-container environment, ideal for local development that mirrors a production setup and can also be adapted for some production deployments.

It defines the following services:

*   **`db` Service:**
    *   Image: `postgres:16`
    *   Environment: Sets `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.
    *   Ports: Maps port `5432` on the host to `5432` in the container.
    *   Volumes: Uses a named volume `postgres_data` for persistent database storage.
*   **`redis` Service: (Currently not used in production)**
    *   Image: `redis:alpine`
    *   Ports: Maps port `6379` on the host to `6379` in the container.
*   **`app` Service (The Next.js Application):**
    *   Build Context: Builds from the local `Dockerfile`.
    *   Expose: Exposes port `3000` within the Docker network.
    *   Depends On: `db` and `redis`, ensuring they start before the application.
    *   Environment: Sets `DATABASE_URL` and `REDIS_URL` to connect to the other services within the Docker network. Also includes `JWT_EXPIRES_IN` and `JWT_SECRET`.
*   **`caddy` Service (Reverse Proxy):**
    *   Image: `caddybuilds/caddy-cloudflare:latest` (Caddy with Cloudflare module for DNS challenges for automatic HTTPS).
    *   Restart Policy: `always`
    *   Ports: Maps host ports `80` and `443` (TCP/UDP) to the container.
    *   Volumes:
        *   Mounts a local `Caddyfile` into `/etc/caddy/Caddyfile` for Caddy configuration.
        *   Uses named volumes `caddy_data` and `caddy_config` for persistent Caddy data (like SSL certificates).
    *   Environment: `CLOUDFLARE_API_TOKEN` (I was using Cloudflare for DNS-01 challenge for TLS certificates).
    *   Depends On: `app` service.

This Docker Compose setup provides a complete, isolated environment for running the entire stack locally with a single command (`docker-compose up`).

## CI/CD Workflows (GitHub Actions)

GitHub Actions, defined in `.github/workflows/`, are used for automation tasks.

### 1. Test Build (`test_build.yml`)

*   **Trigger:** Runs on every `pull_request` to the main branches.
*   **Purpose:** To ensure that the application builds successfully and to catch integration issues early before merging code.
*   **Steps:**
    1.  `Checkout repository`: Checks out the code.
    2.  `Set up Node.js`: Configures Node.js version 22.
    3.  `Install dependencies`: Runs `yarn install --frozen-lockfile`.
    4.  `Generate Prisma Client`: Runs `yarn prisma generate`.
    5.  `Build application`: Runs `yarn build`.

### 2. Manual Database Backfill (`db_backfill.yml`)

*   **Trigger:** Runs manually via `workflow_dispatch` from the GitHub Actions UI.
*   **Purpose:** To allow for controlled seeding of a database (e.g., staging or development) using the project's seed script. This is useful for populating a database with a large amount of realistic test data.
*   **Environment Variables:** Uses GitHub secrets for `DATABASE_URL` and various `SEED_MODE` parameters (`USERS_COUNT`, `POSTS_PER_USER`, etc.) to configure the seed script behavior.
*   **Steps:**
    1.  `Checkout repository`.
    2.  `Set up Node.js`.
    3.  `Install dependencies`.
    4.  `Generate Prisma Client`.
    5.  `Run seed script`: Executes `yarn seed`.

These workflows help maintain code quality and provide tools for managing different environments. 