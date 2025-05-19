# Hackernews Clone

This project is a full-stack clone of Hackernews, developed as a take-home assignment that aims to replicate core Hackernews functionalities, including user authentication, post creation, commenting, voting, and notifications. For detailed documentation, including project architecture, database schema, deployment, and more, please see the [**Full Documentation in the /docs folder**](./docs/README.md).

## Prerequisites

Before you begin, ensure you have the following installed:

- Git
- Yarn
- Docker and Docker Compose

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/sahil-shubham/hackernews-clone.git
    cd hackernews-clone
    ```
2.  **Environment Variables:**
    Create a `.env.local` file in the root directory by copying the `.env.template` (Already pre-filled with local dev data)

    ```bash
    cp .env.template .env.local
    ```
    Ensure the variables in `.env.local` are correctly set for your environment. Key variables include:
    ```env
    # Main database URL for Prisma to connect to PostgreSQL
    DATABASE_URL="postgresql://username:password@localhost:5432/dbname"

    # Direct connection URL (useful for PgBouncer setups)
    DIRECT_URL="postgresql://username:password@localhost:5432/dbname"

    # Redis URL for caching and rate limiting
    REDIS_URL="redis://localhost:6379"

    # Secret key for JWT token generation (min 32 chars)
    JWT_SECRET="my-super-secure-and-ultra-long-secret-key-2024"

    # JWT token expiration time
    JWT_EXPIRES_IN="7D"

    # Controls seeding behavior for backfill script `/scripts/seed.ts` - "development" clears db before backfill
    SEED_MODE="development"

    # Cloudflare API token for DNS management
    # Required permissions: zone-zone-read, zone-dns-edit
    CLOUDFLARE_API_TOKEN="your-cloudflare-api-token" # Only needed if using Caddy with Cloudflare for SSL
    ```

3.  **Install dependencies:**
    ```bash
    yarn install
    ```
4.  **Generate Prisma Client:**
    ```bash
    yarn prisma generate
    ```
5.  **Run Database Migrations:**
    This command applies pending migrations to your database schema.
    ```bash
    yarn prisma migrate dev
    ```
6.  **Seed the database (optional):**
    The project includes two scripts for populating the database:
    - `scripts/seed.ts`: Generates initial test data
    - `scripts/fetch_hackernews.ts`: Imports real data from Hacker News API

    First, ensure PostgreSQL is running locally:
    ```bash
    docker compose up db
    ```

    Then seed the database:
    ```bash
    yarn seed
    ```
7.  **Start the development server:**
    Using Next.js directly:
    ```bash
    yarn dev
    ```
    The application should be available at `http://localhost:3000`.

    Alternatively, using Docker Compose (Recommended for a production-like environment):
    Ensure Docker is running.
    ```bash
    docker-compose up --build -d
    ```
    The application will be available, typically at `http://localhost` (if Caddy is configured for port 80) or `http://localhost:3000` directly from the app service. Check the `Caddyfile` and `docker-compose.yml` for port configurations.

    To stop the Docker Compose services:
    ```bash
    docker-compose down
    ```

For more details on other aspects of the project, please refer to the [**Full Documentation**](./docs/README.md).