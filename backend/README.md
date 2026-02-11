# CycleLink Backend API

Node.js/Express backend with **MVC structure**, Mongoose (MongoDB), and JWT auth.

---

## MVC Pattern (Clean Code)

| Layer      | Location        | Role |
|-----------|------------------|------|
| **Models**    | `models/`        | Mongoose schemas (User, Hazard) |
| **Controllers** | `controllers/`   | Business logic; handle `req`/`res` |
| **Routes**     | `routes/`        | HTTP method + path → controller |

### API Endpoints (4+)

| Method | Path | Controller | Description |
|--------|------|-------------|-------------|
| POST   | `/api/auth/register`   | `authController.registerUser`   | Create account |
| POST   | `/api/auth/login`      | `authController.loginUser`      | Login, get JWT |
| POST   | `/api/auth/google`     | `authController.googleLogin`    | Google Sign-In (body: `{ credential }`), returns same JWT shape |
| GET    | `/api/auth/profile`    | `authController.getProfile`     | Current user profile |
| GET    | `/api/cyclist/stats`   | `cyclistController.getStats`    | Cyclist dashboard stats |
| POST   | `/api/cyclist/update-distance` | `cyclistController.updateDistance` | Record ride, update tokens/CO₂ |
| GET    | `/api/cyclist/leaderboard`     | `cyclistController.getLeaderboard`  | Top 5 cyclists |
| GET    | `/api/hazards`         | `hazardController.getHazards`   | List active hazards |
| POST   | `/api/hazards/report`  | `hazardController.reportHazard` | Report new hazard |
| PATCH  | `/api/hazards/:id`     | `hazardController.updateHazard` | Update hazard (owner) |
| DELETE | `/api/hazards/:id`     | `hazardController.deleteHazard` | Delete hazard (owner) |

### Mongoose Models

- **User** (`models/User.js`): auth fields, cyclist stats (tokens, totalDistance, co2Saved, totalRides, safetyScore).
- **Hazard** (`models/Hazard.js`): lat, lng, type, description, reportedBy, active.

---

## Run

```bash
npm start
```

Requires `.env` with `MONGO_URI`, `JWT_SECRET`, and optional `PORT`. For Google Sign-In, set `GOOGLE_CLIENT_ID` to your Google OAuth 2.0 Client ID (same as the frontend).
