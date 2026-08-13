# ShopFlow

A full-stack e-commerce platform used as a **practice codebase** for learning
software engineering. It comes with a realistic REST API, a React storefront,
an admin dashboard, and a deliberately imperfect codebase — known bugs, missing
features and outdated tests are documented so you can practice debugging,
testing and refactoring.

> ⚠️ This repository is a teaching tool. Some tests intentionally fail and some
> features intentionally misbehave. See [docs/known-issues.md](docs/known-issues.md)
> and the [challenge board](docs/challenges.md) for extra scored tasks.

## Stack

- **Backend**: Node.js 20+, Express, Sequelize ORM, SQLite (dev) / PostgreSQL (prod)
- **Frontend**: React 18, Vite, react-router-dom
- **Testing**: Jest + Supertest

## Quick start

Prerequirements: Node.js ≥ 20 and npm.

```bash
# 1. Backend
cd backend
npm install
npm run migrate     # create the SQLite database + tables
npm run seed        # load demo data
npm run dev         # API on http://localhost:4000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev         # storefront on http://localhost:5173
```

Open http://localhost:5173 and sign in with
`customer@shopflow.test` / `Password123!` (see the API docs for all accounts).

### Running the tests

```bash
cd backend
npm test
```

The suite is intentionally a mix of green and red tests — a red test points at a
known issue to fix (never change the test to make it pass).

## Repository layout

```
backend/     Express REST API, migrations, seeders, tests
frontend/    React (Vite) storefront + admin SPA
docs/        architecture, API reference, schema, known issues
```

## Documentation

- [Architecture](docs/architecture.md)
- [API reference](docs/api.md)
- [Database schema](docs/schema.md)
- [Known issues](docs/known-issues.md) — deliberate bugs to find and fix

## Docker (PostgreSQL)

An optional `docker-compose.yml` runs Postgres + both services. See
[docs/architecture.md](docs/architecture.md) and the `docker-compose.yml`
comments for details.

## License

MIT — see [LICENSE](LICENSE).
