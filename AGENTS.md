# AGENTS.md

## Project Overview

This is a family learning check-in MVP.

Core workflow:
Parent creates study tasks.
Child checks today's task list.
Child uploads photos after completion.
AI checks completion.
Parent reviews the result.
Weekly report is generated.

## Tech Stack

- Next.js App Router
- TypeScript
- MySQL
- Qiniu Cloud Storage
- Alibaba Bailian
- UI:animal-island-ui-style
- GitHub Actions

## Directory Rules

- docs/ contains the project documentation.
- docs/api.md contains the API documentation.
- docs/prd.md contains the product requirements document.
- src/frontend/ contains the frontend code.
  - src/frontend/DESIGN.md contains the frontend design document.
- src/backend/ contains the backend code.
- app/ only contains routes, layouts, pages and route handlers.
- features/ contains business modules.
- server/ contains server-only infrastructure code.
- components/ui/ contains reusable UI components.
- Do not put business logic directly inside page.tsx.
- Do not expose secret keys to client components.

## Coding Rules

- Use TypeScript strictly.
- Use Zod for request validation.
- Use service + repository pattern for business modules.
- All database writes must check family permission.
- All AI outputs must be stored with raw_result for debugging.

## Security Rules

- Never expose MYSQL_ACCOUNT to client.
- Never expose MYSQL_PASSWORD to client.
- Never expose QINIU_SECRET_KEY to client.
- Never expose BAILIAN_API_KEY to client.
- Parent and child login should use the application user system stored in MySQL.
- Login uses username + password.
- Parent operations require an authenticated parent application user.

## Testing Rules

- Unit tests for service layer.
- Integration tests for API routes.
- E2E tests for core check-in flow.
- Use Playwright Test with TypeScript.
- Put all E2E tests under tests/e2e.
- Use Page Object for complex flows.


## Must Update After Each Round
- `docs/implement.md`
- `docs/documentation.md`
- Update `docs/api.md` if backend APIs change.
