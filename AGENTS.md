# AGENTS.md

## Project

Family learning check-in MVP.

Core flow:

1. Parent creates tasks.
2. Child checks today's tasks.
3. Child uploads completion photos.
4. AI checks task completion.
5. Parent reviews results.
6. Weekly report is generated.
7. Calendar panel.

## Tech Stack

* Next.js App Router
* TypeScript
* MySQL
* local Storage
* Alibaba Bailian
* animal-island-ui-style
* GitHub Actions
* Playwright Test

## Project Structure

* `docs/` contains product and technical docs.

  * `docs/prd.md`: product requirements
  * `docs/api.md`: API documentation
  * `docs/implement.md`: implementation progress
  * `docs/documentation.md`: project documentation
* `src/frontend/` contains frontend code.

  * `src/frontend/app/`: routes, layouts, pages, and route handlers only
  * `src/frontend/features/`: business modules
  * `src/frontend/components/ui/`: reusable UI components
  * `src/frontend/DESIGN.md`: frontend design guide
* `src/backend/` contains backend code.

  * `src/backend/server/`: server-only infrastructure code

Do not put business logic directly inside `page.tsx`.

## Coding Rules

* Use strict TypeScript.
* Use Zod for all API input validation.
* Use service + repository pattern for business modules.
* Keep UI, service, repository, and storage logic separated.
* Database writes must verify authenticated user, role.
* All task, photo, AI check, point, wish, and calendar data must belong to a family.


## Security Rules

* Never expose server secrets or private environment variables to client components.
* Alibaba Bailian API calls must run on the server.
* Login uses the application user system stored in MySQL.
* Login method: username + password.
* Parent-only operations require authenticated parent users.
* Child users can only access their own family's assigned tasks.

## Testing Rules

* Unit tests for service layer.
* Integration tests for API routes.
* E2E tests for core check-in flow.
* E2E tests use Playwright Test with TypeScript.
* Put E2E tests under `tests/e2e`.
* Use Page Object for complex flows.

## Documentation Rules

After each implementation round, update:

* `docs/implement.md`
* `docs/documentation.md`
* `docs/api.md` if APIs changed
* `docs/prd.md` if product behavior changed

@RTK.md
