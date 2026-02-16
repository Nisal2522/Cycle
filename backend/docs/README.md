# API Documentation

## Swagger / OpenAPI

REST endpoints for the versioned API are described in `openapi.yaml` (OpenAPI 3.0).

- **View in Swagger UI**: Use [Swagger Editor](https://editor.swagger.io/) or run `npx swagger-ui-watcher docs/openapi.yaml` (if installed) to browse and try the API.
- **Base URL**: `http://localhost:5000/api/v1` for local development.

## Main components (Requirement b)

- **Auth** — `/api/v1/auth` (register, login, Google, profile)
- **Partner/Shop** — `/api/v1/partner` (profile, payouts, checkouts, scan stats)
- **Transactions/Scanner** — `/api/v1/transactions` (redeem, confirm QR checkout)
- **Rewards** — `/api/v1/rewards` (CRUD; third-party notification on reward claimed)

Legacy routes remain at `/api/auth`, `/api/partner`, etc. for backward compatibility.
