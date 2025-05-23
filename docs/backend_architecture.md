# Backend Architecture and Database Overview

The backend is built using Next.js, leveraging its API Routes and Server Actions capabilities. Prisma serves as the Object-Relational Mapper (ORM) for interacting with the PostgreSQL database, providing a type-safe and efficient data access layer.

## API Structure

The API design distinguishes between two main types of backend operations:

1.  **Stateful/Session-based Operations (Next.js API Routes):**
    *   Located in `src/app/api/`.
    *   **Authentication (`src/app/api/auth/`):** Endpoints for user registration, login, and managing user tokens (e.g., issuing JWTs stored in cookies).
    *   **Notifications (`src/app/api/notifications/`):** Endpoints for fetching user notifications, marking them as read, etc.
    
2.  **Core Application Logic (Next.js Server Actions):**
    *   Located in `src/app/actions/` (e.g., `replyActions.ts`, `voteActions.ts`, `bookmarkActions.ts`).
    *   Server Actions are used for most of the core application functionalities like creating posts, submitting comments, casting votes, and managing bookmarks.
    *   **Direct Prisma Interaction:** These actions typically import the Prisma client directly and perform database operations.
    *   **Simplified Data Flow:** This approach allows Server Components to call these asynchronous functions directly, reducing boilerplate and the need for manual `fetch` calls for many CRUD operations.

This hybrid approach aims to use the most suitable Next.js feature for each type of backend task—API Routes for more traditional endpoint needs and Server Actions for streamlined data mutations and queries directly from components.

## Database (Prisma)

The primary data store is a PostgreSQL database, managed via Prisma.

*   **Schema Definition:** The database schema, including all models, fields, relations, and enums, is defined in `prisma/schema.prisma`.
*   **Migrations:** Prisma Migrate is used to manage database schema changes over time, ensuring that the schema evolves in a consistent and trackable manner. Migration files are stored in `prisma/migrations/`.
*   **Prisma Client:** A type-safe database client is generated by Prisma based on the schema. This client is used throughout the backend (in API Routes and Server Actions) to interact with the database.

For a detailed breakdown of the database models, relationships, and indexing strategies, please refer to the [Database Schema Details](./database_schema.md) documentation. 