# Delivery Buddy API

Courier-facing backend API for the Delivery Buddy delivery-driver mobile app.

## Tech Stack

- **Runtime**: Node.js + Express + TypeScript
- **Persistence**: SQLite via Prisma ORM
- **Cache**: In-memory LRU cache (`lru-cache`) for route/ETA lookups (60s TTL)
- **Auth**: JWT (stateless) + bcrypt password hashing
- **Validation**: Zod schemas
- **Docs**: OpenAPI 3.0 spec served at `/docs` via swagger-ui-express
- **Testing**: Jest + Supertest

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client + push schema to SQLite
npx prisma generate
npx prisma db push

# Start dev server (hot reload)
npm run dev

# Build
npm run build

# Run tests
npm test
```

The server runs on `http://localhost:3000`. Swagger docs at `http://localhost:3000/docs`.

## Project Structure

```
src/
  config/          # Prisma client + env config
  controllers/     # Route handlers (auth, courier, shift, order, wallet, chat)
  middleware/       # Auth, error handler, validation, async wrapper
  routes/          # Express routers per domain
  services/        # Route cache, wallet computation
  types/           # Zod schemas
  app.ts           # Express app setup
  openapi.yaml     # OpenAPI 3.0 spec
prisma/
  schema.prisma    # Database schema (all 6 entities)
docs/
  ERD.md           # Entity relationship diagram (Mermaid)
  architecture.md  # Component diagram + design decisions
  requirements-spec.md  # Full endpoint specification
tests/
  *.test.ts        # Jest + Supertest test suites
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/signup | Register a courier |
| POST | /auth/login | Log in |
| POST | /auth/logout | Log out |
| GET | /couriers/me | Get profile |
| PUT | /couriers/me/profile | Update profile |
| PATCH | /couriers/me/settings | Update settings |
| POST | /shifts/start | Start shift |
| POST | /shifts/:id/stop | Stop shift |
| GET | /shifts/current | Get active shift |
| GET | /shifts | Shift history |
| GET | /orders | List orders |
| GET | /orders/:id | Get order detail |
| PATCH | /orders/:id/status | Update order status |
| GET | /orders/:id/route | Get route/ETA (cached) |
| GET | /wallet | Wallet summary |
| GET | /wallet/transactions | Transaction history |
| POST | /wallet/withdraw | Withdraw funds |
| GET | /orders/:id/messages | Get chat messages |
| POST | /orders/:id/messages | Send a message |

## Caching Strategy

Route/ETA lookups use a three-tier cache:
1. **In-memory LRU** (60s TTL) — hot path, sub-millisecond
2. **RouteCache table** (SQLite) — survives process restarts
3. **Mock geocoding provider** — called only on full cache miss

This ensures repeated polling from the live-tracking screen never re-hits the
third-party maps API within the TTL window.
