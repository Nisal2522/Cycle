# CycleLink Backend API

Node.js/Express backend with **Controller → Service → Model architecture**, Mongoose (MongoDB), and JWT auth.

---

## Architecture Pattern (Clean Code)

| Layer          | Location         | Responsibility |
|----------------|------------------|----------------|
| **Routes**     | `routes/`        | HTTP routing, auth middleware |
| **Controllers**| `controllers/`   | Parse request, validate input, call service, format response |
| **Services**   | `services/`      | Business logic, orchestration, DB access |
| **Models**     | `models/`        | Mongoose schemas, DB validation |
| **Validations**| `validations/`   | Joi schemas for input validation |
| **Utils**      | `utils/`         | Shared utilities (tokens, formatters) |

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

## PayHere Payment Integration

CycleLink uses **PayHere** (Sri Lankan payment gateway) for processing partner payout requests.

### How It Works

1. **Admin Dashboard**: Admin clicks "Approve & Pay" on a pending payout request
2. **Payment Initialization**: Frontend calls `/api/admin/payout-requests/:id/payhere-init`
3. **PayHere Checkout**: Opens PayHere payment form in popup window
4. **Payment Processing**: User completes payment on PayHere
5. **Webhook Notification**: PayHere sends POST to `/api/payments/payhere/notify`
6. **Status Update**: Backend verifies signature and updates payout request to "Paid"

### Required Environment Variables

```bash
PAYHERE_MERCHANT_ID=your_merchant_id
PAYHERE_SECRET=your_merchant_secret
PAYHERE_BASE_URL=https://sandbox.payhere.lk/pay/checkout  # Use live URL for production
BACKEND_URL=http://localhost:5000  # For webhook notify_url
FRONTEND_ORIGIN=http://localhost:5173  # For return_url and cancel_url
```

### Testing with PayHere Sandbox

1. Sign up at [PayHere Sandbox](https://sandbox.payhere.lk/)
2. Get your Merchant ID and Secret from the dashboard
3. Use sandbox URL: `https://sandbox.payhere.lk/pay/checkout`
4. Test card: `5555 5555 5555 4444` (any future expiry, any CVV)

### Key Files

- **Controllers**: `adminController.js` (getPayhereInit), `paymentController.js` (payhereNotify)
- **Utils**: `payhereHelper.js` (hash generation, payment params)
- **Services**: `payoutService.js` (approvePayoutRequest)
- **Frontend**: `AdminDashboard.jsx` (handleApproveAndPayPayHere)

### Security

- **MD5 Hash Verification**: All PayHere webhooks are verified using MD5 signature
- **Formula**: `MD5(merchant_id + order_id + amount + currency + MD5(merchant_secret))`
- **Status Codes**: Only `status_code=2` (success) triggers payout approval

---

## Run

```bash
npm start
```

Requires `.env` with `MONGO_URI`, `JWT_SECRET`, and optional `PORT`. For Google Sign-In, set `GOOGLE_CLIENT_ID` to your Google OAuth 2.0 Client ID (same as the frontend).

For PayHere integration, see `.env.example` for required PayHere configuration variables.
