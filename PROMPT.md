# Hacker News Clone: Project Plan & Progress Tracker

**Objective:** Build a full-stack Hacker News clone as per `ASSIGNMENT.md`.

**Overall Approach:** Develop a monolithic Next.js application (frontend and backend API routes) using TypeScript. Prioritize core features, then address bonus points if time allows.

---

## 1. Chosen Technology Stack & Architecture

*   **Framework:** Next.js (for both Frontend UI and Backend API Routes).
*   **Language:** TypeScript.
*   **Database:** PostgreSQL (hosted on Supabase for convenience, or locally via Docker). Interaction via Prisma ORM.
*   **ORM:** Prisma (schema definition, migrations, type-safe client).
*   **API Input Validation:** Zod.
*   **Authentication:** Custom JWT-based (implemented in Next.js API Routes).
*   **Frontend Styling:** Styled Components.
*   **Frontend Routing:** Next.js file-system routing + TanStack Router (for advanced client-side navigation & search param state).
*   **Frontend State Management:**
    *   Server State & Caching: React Query (TanStack Query).
    *   Global Client UI State: Zustand.
*   **Project Structure:** Standard Next.js project structure (no Nx).
    *   `prisma/`: Contains `schema.prisma` and migrations.
    *   `src/pages/`: Next.js pages.
    *   `src/pages/api/`: Next.js API routes (backend).
    *   `src/components/`: Reusable React components.
    *   `src/lib/`: Server-side helpers, Prisma client instance, etc.
    *   `src/utils/`: Client-side helpers.
    *   `src/hooks/`: Custom React hooks.
    *   `src/types/` or `src/interfaces/`: Shared TypeScript definitions, Zod schemas.

---

## 2. Core Features: Implementation Plan

*(Mark progress: [ ] TODO, [>] WIP, [x] DONE)*

### 2.1. User Authentication
    - **[ ] Backend (API Routes - `/src/pages/api/auth/`)**
        - **[ ] Models:** `User` model in `prisma/schema.prisma` (`id`, `email`, `username`, `password` (hashed), `createdAt`, `updatedAt`).
        - **[ ] API Endpoint `POST /api/auth/signup`:**
            - Input: `{ email, username, password }` (Validate with Zod).
            - Logic: Hash password (`bcrypt`), create `User` record.
            - Output: `{ user: {id, email, username}, token }`.
        - **[ ] API Endpoint `POST /api/auth/login`:**
            - Input: `{ emailOrUsername, password }` (Validate with Zod).
            - Logic: Find user, compare password hash, generate JWT.
            - Output: `{ user: {id, email, username}, token }`.
        - **[ ] API Endpoint `POST /api/auth/logout`:**
            - Logic: (Stateless JWT) Client discards token. No server-side action strictly needed.
            - Output: `{ message: "Logged out successfully" }`.
        - **[ ] API Endpoint `GET /api/auth/me`:**
            - Logic: Verify JWT from `Authorization` header, return user details.
            - Output: `{ user: {id, email, username} }`.
        - **[ ] Middleware/Helpers:** For JWT generation/verification and route protection.
    - **[ ] Frontend (`/src/pages/`, `/src/components/auth/`)**
        - **[ ] Pages:** `LoginPage`, `SignupPage`.
        - **[ ] Forms:** Login form, Signup form (with validation - potentially react-hook-form + Zod).
        - **[ ] State:** Manage auth state (user, token, loading/error states) using React Query (for `/api/auth/me`) and Zustand (for storing user session).
        - **[ ] Logic:** Call signup/login API endpoints, handle token storage (e.g., localStorage), redirect on auth status change.
        - **[ ] UI:** Display login/logout buttons, user info in navbar.

### 2.2. Post Feed
    - **[ ] Backend (API Routes - `/src/pages/api/posts/`)**
        - **[ ] Models:**
            - `Post` model (`id`, `title`, `url`?, `textContent`?, `type` ('LINK'|'TEXT'), `authorId` (FK to User), `createdAt`, `updatedAt`).
            - `Vote` model (`id`, `userId`, `postId`?, `commentId`?, `voteType` ('UPVOTE'|'DOWNVOTE')).
        - **[ ] API Endpoint `GET /api/posts`:**
            - Input: `page` (int), `limit` (int), `sort` ('new'|'top'|'best').
            - Logic: Fetch paginated posts, include author username, calculate `points` (sum of votes), `commentCount`. Sorting logic for 'new', 'top', 'best'.
            - Output: `{ posts: [PostDetails...], page, totalPages, totalPosts }`.
        - **[ ] API Endpoint `POST /api/posts/[postId]/vote`:**
            - Input: `{ voteType: ('UPVOTE'|'DOWNVOTE') }` (Validate with Zod).
            - Logic: (Authenticated) Create/update `Vote` record. Ensure user can only vote once or change their vote. Update post score (can be done via a trigger or application logic, simpler to do in app logic for now).
            - Output: `{ newScore }`.
    - **[ ] Frontend (`/src/pages/index.tsx`, `/src/components/post/`)**
        - **[ ] Components:** `PostList`, `PostItem`.
        - **[ ] `PostItem` Display:** Title, URL (domain if URL, or "text post"), author, points, comment count, time.
        - **[ ] Data Fetching:** Use React Query to fetch posts from `/api/posts`.
        - **[ ] Pagination/Infinite Scroll:** Implement client-side.
        - **[ ] Voting UI:** Up/down vote buttons on `PostItem`.
        - **[ ] Voting Logic:** Call `/api/posts/[postId]/vote` using React Query `useMutation`. Optimistic updates for immediate UI feedback.

### 2.3. Submission
    - **[ ] Backend (API Routes - `/src/pages/api/posts/`)**
        - **[ ] API Endpoint `POST /api/posts`:**
            - Input: `{ title, url?, textContent?, type }` (Validate with Zod).
            - Logic: (Authenticated) Create new `Post` record linked to the user.
            - Output: `PostDetails`.
    - **[ ] Frontend (`/src/pages/submit.tsx`, `/src/components/submission/`)**
        - **[ ] Page:** `SubmitPage` (requires authentication).
        - **[ ] Form:** For submitting URL-based or text-based posts (title, URL or text content).
        - **[ ] Logic:** Call `/api/posts` using React Query `useMutation`. Redirect to new post or feed on success.

### 2.4. Comments
    - **[ ] Backend (API Routes - `/src/pages/api/`)**
        - **[ ] Models:** `Comment` model (`id`, `textContent`, `authorId`, `postId`, `parentId`? (for threading), `createdAt`, `updatedAt`).
        - **[ ] API Endpoint `GET /api/posts/[postId]/comments`:**
            - Logic: Fetch comments for a post, include author username, calculate `points`. Support fetching replies/threaded view.
            - Output: `[CommentDetails...]`.
        - **[ ] API Endpoint `POST /api/posts/[postId]/comments`:**
            - Input: `{ textContent, parentId? }` (Validate with Zod).
            - Logic: (Authenticated) Create new `Comment` record.
            - Output: `CommentDetails`.
        - **[ ] API Endpoint `PUT /api/comments/[commentId]`:**
            - Input: `{ textContent }` (Validate with Zod).
            - Logic: (Authenticated, author only) Update comment.
            - Output: `CommentDetails`.
        - **[ ] API Endpoint `DELETE /api/comments/[commentId]`:**
            - Logic: (Authenticated, author only) Delete comment.
            - Output: `{ message: "Comment deleted" }`.
        - **[ ] API Endpoint `POST /api/comments/[commentId]/vote`:** (Similar to post voting)
            - Output: `{ newScore }`.
    - **[ ] Frontend (`/src/pages/post/[postId].tsx`, `/src/components/comment/`)**
        - **[ ] Page:** `PostDetailPage` to display post and comments.
        - **[ ] Components:** `CommentList`, `CommentItem`, `CommentForm`.
        - **[ ] `CommentItem` Display:** Author, text, points, reply button, edit/delete buttons (for own comments).
        - **[ ] Threading:** Display comments in a nested/threaded manner.
        - **[ ] Data Fetching:** Use React Query for comments.
        - **[ ] Forms:** For adding new comments and replying.
        - **[ ] Logic:** CRUD operations for comments using React Query mutations.

### 2.5. Sorting & Search
    - **[ ] Backend (API Routes)**
        - **[ ] Sorting:** Implemented in `GET /api/posts` (logic for 'new', 'top', 'best').
            - 'new': Order by `createdAt DESC`.
            - 'top'/'best': Requires a scoring algorithm (e.g., Hacker News algorithm, or simpler: `score / age^gravity`). Start with simple score DESC, then by `createdAt DESC`.
        - **[ ] API Endpoint `GET /api/search/posts`:**
            - Input: `query` (string), `page`, `limit`.
            - Logic: Basic text search on `Post.title` and `Post.textContent` using Prisma's full-text search capabilities or `contains` filter with `mode: 'insensitive'`.
            - Output: `{ posts: [PostDetails...], ... }`.
    - **[ ] Frontend**
        - **[ ] UI:** Controls for selecting sort order (New, Top, Best) on the post feed. Search input field.
        - **[ ] Logic:** Update React Query parameters for `GET /api/posts` or `GET /api/search/posts` based on user interaction. TanStack Router can manage these filter/sort states in URL search params.

---

## 3. Bonus Features: Implementation Plan

### 3.1. If you do both frontend and backend
    - **[x] DONE** (This plan covers both)

### 3.2. Notifications
    - **[ ] Backend (API Routes)**
        - **[ ] API Endpoint `GET /api/notifications`:** (Authenticated) Fetch user's notifications.
        - **[ ] Logic:** (Polling) When actions occur (e.g., reply to user's post/comment), create `Notification` records.
        - **[ ] Models:** `Notification` model (`id`, `userId` (recipient), `type` (e.g., 'new_comment', 'reply'), `sourceId` (e.g., commentId), `read` (boolean), `createdAt`).
    - **[ ] Frontend**
        - **[ ] UI:** Notification indicator, dropdown/page to view notifications.
        - **[ ] Logic:** Poll `/api/notifications` using React Query. Mark as read.

### 3.3. Rate Limiting & Spam Protection
    - **[ ] Backend (API Routes)**
        - **[ ] Rate Limiting:** Implement basic rate limiting (e.g., using `express-rate-limit` if adapting to Next.js API routes context, or a similar library like `next-api-shield` or custom logic with Redis/memory store) on sensitive endpoints (login, signup, post/comment creation).
        - **[ ] Spam Protection:** Basic checks (e.g., disallow identical consecutive posts/comments from same user, simple keyword filters if necessary).

### 3.4. Dockerization and CI/CD
    - **[ ] Dockerization**
        - **[ ] `Dockerfile`:** For the Next.js application.
            - Use multi-stage builds.
            - Utilize Next.js `output: 'standalone'` for minimal image size.
        - **[ ] `docker-compose.yml` (for local development):**
            - Service for the Next.js app.
            - Service for local PostgreSQL (if not using Supabase exclusively for dev).
        - **[ ] Scaling Notes:** (As previously discussed: stateless app, horizontal scaling, load balancer).
    - **[ ] CI/CD (e.g., GitHub Actions)**
        - **[ ] Workflow:** Lint -> Test (if tests are added) -> Build Docker image -> Push to registry (e.g., Docker Hub, GHCR) -> Deploy (manual trigger or to a staging/prod environment).

### 3.5. Mobile-responsive UI
    - **[ ] Frontend (Styling)**
        - **[ ] Approach:** Use Styled Components with a mobile-first approach. Employ media queries for different breakpoints.
        - **[ ] Testing:** Test on various device sizes during development.

---

## 4. API Documentation (`API.md`) Plan

*(To be created if backend is built, which it is in this plan)*
*   Introduction to the API.
*   Base URL: `/api`.
*   Authentication: JWT (how to get it, how to send it).
*   Endpoints (for each, document):
    *   Method & Path (e.g., `POST /api/auth/signup`).
    *   Description.
    *   Request Body (if any, with example and Zod schema reference).
    *   Query Parameters (if any).
    *   Success Response (status code, body with example).
    *   Error Responses (status codes, error format).
*   Cover all auth, posts, comments, votes, search endpoints.

---

## 5. `README.md` Content Plan

*   Project Title & Brief Description.
*   **Setup Instructions:**
    *   Prerequisites (Node.js, npm/yarn, Docker optional).
    *   Cloning the repo.
    *   Environment variables setup (`.env.local`): `DATABASE_URL`, `JWT_SECRET`, etc.
    *   Installing dependencies (`npm install` or `yarn install`).
    *   Running Prisma migrations (`npx prisma migrate dev`).
    *   Running the development server (`npm run dev` or `yarn dev`).
    *   Building for production.
    *   Running with Docker (if applicable).
*   **Technology Stack Summary.**
*   **Project Structure Overview.**
*   **API Documentation:** Link to `API.md`.
*   **AI Tools Used:**
    *   List (e.g., Cursor, GitHub Copilot).
    *   Explanation of how AI assisted development (e.g., boilerplate generation, debugging help, code suggestions, refactoring, writing documentation).
*   **Known Issues / Future Improvements (Optional).**

---

## 6. General Development Guidelines

*   **Code Quality:** Maintainable, well-commented (especially non-obvious logic). Follow consistent coding style (ESLint/Prettier).
*   **Environment Variables:** Use `.env.local` for local development, provide `.env.example`.
*   **Git Workflow:** Feature branches, descriptive commit messages.
*   **Error Handling:** Graceful error handling in API routes and frontend. Consistent error response format from API.

---
*This document will be updated to track progress.*
