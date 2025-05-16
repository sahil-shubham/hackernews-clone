# Technical Decisions Log

This document logs key technical decisions made during the development of the Hacker News clone, along with considerations and alternatives.

## 1. Core Technology Stack

*   **Decision**: The project was pre-defined to use Next.js (App Router), TypeScript, PostgreSQL, Prisma ORM, Zod for validation, JWT for custom authentication, Styled Components for styling, React Query (TanStack Query) for server state, and Zustand for global client state.
*   **Reasoning**: This stack was provided as the foundation for the project as per `PROMPT.md` and `ASSIGNMENT.md`.
*   **Alternatives Considered**: While not chosen by us, alternative stacks could involve different backend frameworks (e.g., Express.js, NestJS), databases (MongoDB), ORMs (TypeORM), or frontend state management (Redux, Jotai).

## 2. Search Functionality

*   **Decision**: Implemented a basic full-text search capability for posts using PostgreSQL's built-in FTS features, accessed via Prisma Client.
    *   The API (`GET /api/posts`) was extended to accept a `search` query parameter.
    *   The Zod schema for query validation was updated to `search: z.string().nullable().optional()` to handle cases where the search param might be null or undefined.
    *   Enabled the `fullTextSearchPostgres` preview feature in `prisma/schema.prisma` and regenerated Prisma Client.
    *   The search term on the backend is processed to be compatible with `tsquery` (e.g., spaces replaced with `&`).
*   **Reasoning**: Leverages existing database capabilities for simplicity in a full-stack Next.js setup. Good for straightforward search needs.
*   **Process & Challenges**:
    *   Initially attempted to use `@@fulltext` in `schema.prisma` for index definition, which was not the correct approach for Prisma with PostgreSQL FTS and led to validation errors.
    *   Encountered `tsquery syntax error` from PostgreSQL, which was resolved by transforming the user's search input (e.g., "show HN" to "show & HN") in the API route before passing it to Prisma's `search` operator.
*   **Manual Steps**: Required manual creation of GIN indexes on the `title` and `textContent` columns in PostgreSQL for performance, as Prisma does not automatically manage these FTS-specific indexes.
    ```sql
    CREATE INDEX post_title_fts_idx ON posts USING GIN (to_tsvector('english', title));
    CREATE INDEX post_textcontent_fts_idx ON posts USING GIN (to_tsvector('english', coalesce(textContent, '')));
    ```
*   **Better Alternatives/Future Considerations**:
    *   **Dedicated Search Engines**: For more advanced features (e.g., typo tolerance, complex relevance tuning, faceting, analytics, easier scaling of search), dedicated solutions like Elasticsearch, Algolia, Meilisearch, or Typesense would be superior.
    *   **Advanced Query Parsing**: Implement more sophisticated parsing of the user's search input on the backend to support phrase searching, OR operators, exclusion, etc., and translate these into valid `tsquery` syntax.
    *   **PostgreSQL Query Functions**: Directly using functions like `websearch_to_tsquery` or `phraseto_tsquery` in PostgreSQL (possibly via Prisma's raw query capabilities if direct ORM support is limited) could handle more natural user input more gracefully.

## 3. Notifications System

### 3.1. Backend
*   **Decision**: Implemented a database-backed notification system.
    *   Created a `Notification` model in `prisma/schema.prisma` with fields for recipient, triggerer, type, source (post/comment), read status, and timestamps.
    *   Notifications are created within the API logic when a user comments on another user's post or replies to another user's comment.
*   **API Endpoints Created**:
    *   `GET /api/notifications`: Fetches paginated notifications for the authenticated user, including related data (triggering user, post, comment snippet).
    *   `PATCH /api/notifications/[notificationId]`: Marks a single specified notification as read for the authenticated user.
    *   `POST /api/notifications/mark-all-as-read`: Marks all unread notifications as read for the authenticated user.
*   **Reasoning**: A common and straightforward approach for managing notifications. Direct integration into API logic for comment creation ensures notifications are generated upon relevant actions.
*   **Better Alternatives/Future Considerations**:
    *   **Asynchronous Notification Creation**: For high-volume systems, notification creation could be offloaded to a background job/queue (e.g., using BullMQ, RabbitMQ) triggered by events, rather than being handled synchronously in the API request path. This improves API response times.
    *   **Database Triggers**: Could be used to create notification records automatically when certain database events occur (e.g., a new comment is inserted). This decouples notification creation from application code but moves logic into the database layer.
    *   **More Sophisticated Notification Types & Grouping**: Support for more notification types (e.g., votes, mentions) and server-side grouping/aggregation of similar notifications.

### 3.2. Frontend
*   **Decision**:
    *   A `NotificationBell` component in the header displays a bell icon and an unread notification count.
    *   The unread count is fetched on component mount and then polled periodically (every 60 seconds) for updates.
    *   Clicking the bell toggles a `NotificationPopup` component.
    *   The `NotificationPopup` displays notifications in "Inbox" (unread) and "Archive" (read) tabs.
    *   It allows marking individual notifications as read (on click, which also navigates to the source) and provides a "Mark all as read" button.
*   **Reasoning**: Provides a standard and recognizable UX for notifications. Client-side polling is simpler to implement initially for unread counts.
*   **Better Alternatives/Future Considerations**:
    *   **Real-time Updates**: Use WebSockets (e.g., via Socket.IO, or services like Pusher, Ably) or Server-Sent Events (SSE) to push real-time updates for the unread count and new notifications to the client, eliminating the need for polling and providing a better UX.
    *   **Backend Filtering for Tabs**: The `GET /api/notifications` endpoint could accept a `read` status query parameter to fetch only unread or read notifications directly, rather than fetching all and filtering client-side in the `NotificationPopup`. This is more efficient for large numbers of notifications.
    *   **Dedicated Unread Count Endpoint**: Create a lightweight API endpoint (e.g., `GET /api/notifications/unread-count`) that only returns the count, which would be more efficient for the `NotificationBell` to poll than fetching full notification lists.
    *   **Optimistic Updates**: For actions like marking as read, update the UI optimistically before the API call completes to make the interface feel faster.

## 4. Rate Limiting & Spam Protection

*   **Decision**: Discussed as important features, with plans for basic implementation.
    *   Rate Limiting: Suggested IP-based for key actions (post/comment submission) using a library like `rate-limiter-flexible`. For development, an in-memory store; for production, an external store like Redis or Vercel KV. Next.js Middleware is a suitable place.
    *   Spam Protection: Suggested basic checks like disallowing identical consecutive posts/comments from the same user and potentially honeypot fields.
*   **Reasoning**: Essential for protecting the application from abuse and ensuring stability.
*   **Better Alternatives/Future Considerations (as discussed)**:
    *   **Edge Rate Limiting**: Implement rate limiting at the edge (e.g., Vercel Edge Middleware, Cloudflare Workers) to block abusive traffic before it hits the application servers, improving performance and reducing load.
    *   **Dynamic Rate Limits**: Adjust limits based on user reputation, account age, subscription tier, or other factors.
    *   **Comprehensive Spam Filtering**: Integrate third-party services (Akismet, CleanTalk) or implement more advanced techniques like content analysis (keyword/pattern matching, Bayesian filtering), link checking, and CAPTCHAs for suspicious activity.
    *   **User Trust System**: Implement a system where new users have stricter limits that relax over time with good behavior.

## 5. Data Seeding (`prisma/seed.ts`)

*   **Initial Challenge**: The seed script initially created comments via direct database access (`prisma.comment.createMany`), which bypassed API logic and thus did not trigger the creation of notifications.
*   **Decision**: Modified `prisma/seed.ts` to manually create `Notification` records directly in the database *after* comments are seeded. The logic for creating these notifications in the seed script mimics the conditions defined in the API routes (e.g., don't notify if a user comments on their own post).
*   **Reasoning**: This was chosen as a pragmatic approach to ensure that seeded data includes notifications for testing the UI, while being relatively quick to implement within the existing seed script structure. It avoids the significant slowdown and complexity of making thousands of API calls during seeding.
*   **Better Alternatives/Future Considerations**:
    *   **Seed via API Calls**: For maximum realism, the seed script could be refactored to make actual HTTP requests to the application's API endpoints to create entities. This would test the full application flow, including all side effects like notification generation, validation, and authentication. However, this is significantly slower and more complex to implement (requires handling auth, HTTP client setup, potential rate limits during seeding).
    *   **Hybrid Seeding Strategy**: A combination where bulk, basic data is seeded directly, and then a smaller, targeted set of data is created via API calls to test specific interaction flows and side effects.
    *   **Event-Driven Seeding**: If the application architecture were more event-driven, the seed script could publish events (e.g., "comment_created"), and dedicated event consumers (like a notification service) would react to these events. This decouples the seeding from direct knowledge of all side effects but requires a more complex architecture.

## 6. API Documentation

*   **Requirement**: `ASSIGNMENT.md` specifies the need for an `API.md` file if a backend is built.
*   **Decision (Plan)**: To define API request and response schemas using Zod (which is already in use for validation). Then, leverage a library like `zod-to-openapi` to generate an OpenAPI (Swagger) specification from these Zod schemas. This specification can then be used to automatically generate or serve `API.md` or an interactive Swagger UI.
*   **Reasoning**: Zod as a single source of truth for validation and schema definition simplifies development and ensures documentation stays synchronized with the actual API behavior. OpenAPI is a standard for API documentation.
*   **Alternatives**: Manually writing `API.md` (prone to errors and becoming outdated), using other documentation generation tools based on code comments (e.g., JSDoc to Markdown/OpenAPI converters).

## 7. TypeScript Type Safety

*   **Decision**: Strive to use Prisma-generated types for database interaction results and Zod for defining API contracts (request/response shapes), inferring TypeScript types from Zod schemas where applicable.
*   **Process**: Refined the type definitions in API routes (e.g., `GET /api/notifications`) to use `Prisma.ModelNameGetPayload` for accurately typing results of Prisma queries that include relations or select specific fields. Ensured enums like `NotificationType` are correctly imported and used with Zod's `z.nativeEnum()`.
*   **Reasoning**: Maximizes type safety throughout the application, from database to API layer, reducing runtime errors and improving developer experience.
*   **Challenges Encountered**: Occasional linter/TypeScript server issues where newly generated Prisma Client types (after schema changes) were not immediately recognized, often requiring an IDE restart or explicit `prisma generate`.

---
*This document should be updated as new significant decisions are made.*
