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
*   **Authentication:** Custom JWT-based (implemented in Next.js API Routes using jose).
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
    - **[x] Backend (API Routes - `/src/app/api/auth/`)**
        - **[x] Models:** `User` model in `prisma/schema.prisma` (`id`, `email`, `username`, `password` (hashed), `createdAt`, `updatedAt`).
        - **[x] API Endpoint `POST /api/auth/signup`:**
            - Input: `{ email, username, password }` (Validate with Zod).
            - Logic: Hash password (`bcrypt`), create `User` record.
            - Output: `{ user: {id, email, username}, token }`.
        - **[x] API Endpoint `POST /api/auth/login`:**
            - Input: `{ emailOrUsername, password }` (Validate with Zod).
            - Logic: Find user, compare password hash, generate JWT.
            - Output: `{ user: {id, email, username}, token }`.
        - **[x] API Endpoint `GET /api/auth/me`:**
            - Logic: Verify JWT from `Authorization` header, return user details.
            - Output: `{ user: {id, email, username} }`.
        - **[x] Middleware/Helpers:** For JWT generation/verification and route protection.
    - **[x] Frontend (`/src/app/`, `/src/components/auth/`)**
        - **[x] Pages:** `LoginPage`, `SignupPage`.
        - **[x] Forms:** Login form, Signup form (with validation).
        - **[x] State:** Manage auth state (user, token, loading/error states).
        - **[x] Logic:** Call signup/login API endpoints, handle token storage (localStorage).
        - **[x] UI:** Display login/logout buttons, user info in navbar.

### 2.2. Post Feed
    - **[x] Backend (API Routes - `/src/app/api/posts/`)**
        - **[x] Models:**
            - `Post` model (`id`, `title`, `url`?, `textContent`?, `type` ('LINK'|'TEXT'), `authorId` (FK to User), `createdAt`, `updatedAt`).
            - `Vote` model (`id`, `userId`, `postId`?, `commentId`?, `voteType` ('UPVOTE'|'DOWNVOTE')).
        - **[x] API Endpoint `GET /api/posts`:**
            - Input: `page` (int), `limit` (int), `sort` ('new'|'top'|'best').
            - Logic: Fetch paginated posts, include author username, calculate `points` (sum of votes), `commentCount`.
            - Output: `{ posts: [PostDetails...], page, totalPages, totalPosts }`.
        - **[x] API Endpoint `POST /api/posts/[postId]/vote`:**
            - Input: `{ voteType: ('UPVOTE'|'DOWNVOTE') }` (Validate with Zod).
            - Logic: (Authenticated) Create/update `Vote` record.
            - Output: `{ newScore }`.
    - **[x] Frontend (`/src/app/page.tsx`, `/src/components/post/`)**
        - **[x] Components:** `PostList`, `PostItem`.
        - **[x] `PostItem` Display:** Title, URL, author, points, comment count, time.
        - **[x] Data Fetching:** Fetch posts from `/api/posts`.
        - **[x] Pagination:** Implemented client-side.
        - **[x] Voting UI:** Up/down vote buttons on `PostItem`.
        - **[x] Voting Logic:** Call `/api/posts/[postId]/vote`.

### 2.3. Submission
    - **[x] Backend (API Routes - `/src/app/api/posts/`)**
        - **[x] API Endpoint `POST /api/posts`:**
            - Input: `{ title, url?, textContent?, type }` (Validate with Zod).
            - Logic: (Authenticated) Create new `Post` record linked to the user.
            - Output: `PostDetails`.
    - **[x] Frontend (`/src/app/submit/page.tsx`, `/src/components/submission/`)**
        - **[x] Page:** `SubmitPage` (requires authentication).
        - **[x] Form:** For submitting URL-based or text-based posts (title, URL or text content).
        - **[x] Logic:** Call `/api/posts` endpoint to create posts.

### 2.4. Comments
    - **[x] Backend (API Routes - `/src/app/api/`)**
        - **[x] Models:** `Comment` model (`id`, `textContent`, `authorId`, `postId`, `parentId`? (for threading), `createdAt`, `updatedAt`).
        - **[x] API Endpoint `GET /api/posts/[postId]/comments`:**
            - Logic: Fetch comments for a post, include author username, calculate `points`. Support fetching replies/threaded view.
            - Output: `[CommentDetails...]`.
        - **[x] API Endpoint `POST /api/posts/[postId]/comments`:**
            - Input: `{ textContent, parentId? }` (Validate with Zod).
            - Logic: (Authenticated) Create new `Comment` record.
            - Output: `CommentDetails`.
        - **[x] API Endpoint `POST /api/comments/[commentId]/vote`:**
            - Output: `{ newScore }`.
    - **[x] Frontend (`/src/app/post/[postId]/page.tsx`, `/src/components/comment/`)**
        - **[x] Page:** `PostDetailPage` to display post and comments.
        - **[x] Components:** `CommentList`, `CommentItem`, `CommentForm`.
        - **[x] `CommentItem` Display:** Author, text, points, reply button.
        - **[x] Threading:** Display comments in a nested/threaded manner.
        - **[x] Data Fetching:** Fetch comment data.
        - **[x] Forms:** For adding new comments and replying.

### 2.5. Sorting & Search
    - **[x] Backend (API Routes)**
        - **[x] Sorting:** Implemented in `GET /api/posts` (logic for 'new', 'top', 'best').
            - 'new': Order by `createdAt DESC`.
            - 'top'/'best': Includes vote count.
    - **[x] Frontend**
        - **[x] UI:** Controls for selecting sort order (New, Top, Best) on the post feed.
        - **[x] Logic:** Update query parameters for `GET /api/posts` based on user interaction.

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
        - **[ ] Logic:** Poll `/api/notifications`. Mark as read.

### 3.3. Rate Limiting & Spam Protection
    - **[ ] Backend (API Routes)**
        - **[ ] Rate Limiting:** Implement basic rate limiting on sensitive endpoints.
        - **[ ] Spam Protection:** Basic checks (e.g., disallow identical consecutive posts/comments from same user).

### 3.4. Dockerization and CI/CD
    - **[>] Dockerization**
        - **[x] `docker-compose.yml` (for local development):**
            - Service for the Next.js app.
            - Service for local PostgreSQL.
        - **[ ] Scaling Notes:** (stateless app, horizontal scaling, load balancer).
    - **[ ] CI/CD (e.g., GitHub Actions)**
        - **[ ] Workflow:** Lint -> Test -> Build Docker image -> Push to registry -> Deploy.

### 3.5. Mobile-responsive UI
    - **[x] Frontend (Styling)**
        - **[x] Approach:** Styled Components with responsive design.
        - **[x] Testing:** Tested on various device sizes.

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
