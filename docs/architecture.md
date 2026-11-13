# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- **Presentation tier**: Keep React components responsible for rendering and interaction, and use the shared API client for relative `/api` requests. Each capability page should expose accessible loading, error, and empty states before rendering returned data.
- **Logic tier**: Keep HTTP handling and contract validation in the Express routes/services. Return deliberate 4xx responses for invalid or unknown input rather than leaking Mongoose cast or validation errors as 500s.
- **Data tier**: Use Mongoose models for required fields and relationships, and keep representative, repeatable seed data in `src/scripts/seed.ts`. Persist application data in MongoDB; do not introduce a separate storage layer.
- **Activity tracking**: Validate that `userId` and `teamId` are well-formed IDs for existing records before creating an activity. Store the referenced user and team, submitted type and minutes, computed points, and occurrence date.
- **Team management**: Require a name, preserve the submitted name and mascot, and support the members array when creating and listing teams.
- **Leaderboard**: Aggregate activity points by team, sort totals descending, and assign ranks starting at 1.
- **Workout suggestions**: Match the requested email to a user, use that user's goal and recent activity to choose relevant suggestions, and include a concise reason. Return a 4xx when no user matches.
- **Implementation order**: Establish model validation first, then implement and test API writes and reads, then connect the presentation pages to the API. Keep authentication out of scope.

## Test plan

- Run the data contract tests after model or seed changes. A failure indicates a missing model constraint, relationship, or seed-data behavior. `npm run test:data --prefix octofit-tracker/backend` — **passes: 5 tests**.
- Run the API contract tests after route or service changes. Failures indicate a mismatch in HTTP status codes, response shape, persistence, points/ranking, or suggestion matching. `npm run test:api --prefix octofit-tracker/backend` — **passes: 4 tests**.
- Run the frontend contract tests after page or API-client changes. Failures indicate a missing API request, rendered content, or accessible loading/error/empty state. `npm test --prefix octofit-tracker/frontend` — **passes: 15 tests**.
- Run the backend build to catch TypeScript or backend compilation errors. `npm run build --prefix octofit-tracker/backend` — **passes**.
- Run the frontend build to catch frontend compilation or bundling errors. `npm run build --prefix octofit-tracker/frontend` — **passes**.
