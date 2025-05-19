# API Documentation (OpenAPI)

This project uses distinct approaches for its backend functionalities: Next.js API Routes for authentication and notifications, and Next.js Server Actions for most other operations.

## Client-Facing APIs (Auth & Notifications)

For the traditional client-facing API endpoints, specifically for **Authentication** (`src/app/api/auth/`) and **User Notifications** (`src/app/api/notifications/`), an OpenAPI specification is provided.

This specification details the available endpoints, request parameters, response schemas, and authentication methods for these specific services.

*   **OpenAPI Specification File:** You can find the detailed OpenAPI v3.x schema in the root of the repository: [**`openapi.yaml`**](../openapi.yaml)

This `openapi.yaml` file can be used with various tools to visualize the API (like Swagger UI, ReDoc) or to generate client SDKs.

## Server Actions

For core application logic such as creating posts and comments, managing votes, etc., the project utilizes Next.js Server Actions (located in `src/app/actions/`).

Server Actions are functions that execute on the server and can be called directly from Server or Client Components. They do not expose traditional REST or GraphQL endpoints in the same way as the API routes mentioned above. Their "API" is their function signature (parameters and return type).

Documentation for these actions is primarily through their source code (JSDoc comments, TypeScript types) and their usage within the application components.

Refer to the [Backend Architecture](./backend_architecture.md) document for more context on how API Routes and Server Actions are used in this project. 