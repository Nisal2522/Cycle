# Admin Payment / Payout CRUD

Admin ge **Payments** (read-only), **Payout Requests** (approve/reject), saha **Payouts** (calculate, adjust, process, export) endpoints.

---

## Payments (Read-only)

| Action | Endpoint | Description |
|--------|----------|-------------|
| **List** | `GET /api/admin/payments` | All payments with filters/pagination. |
| **Read** | `GET /api/admin/payments/:id` | Single payment by id. |
| **Create** | — | Næta (system-generated). |
| **Update** | — | Næta. |
| **Delete** | — | Næta. |

---

## Payout Requests

| Action | Endpoint | Description |
|--------|----------|-------------|
| **List** | `GET /api/admin/payout-requests` | All payout requests (status filter optional). |
| **Read** | `GET /api/admin/payout-requests/:id` | Single payout request. |
| **Approve** | `POST /api/admin/payout-requests/:id/approve` | Mark as **Paid**; deduct from partner `partnerAvailableBalance`. |
| **Reject** | `POST /api/admin/payout-requests/:id/reject` | Body: `{ "rejectionReason": "string" }`. Set status **Rejected**; no balance deduction (Requirement iv & v). |
| **Delete** | — | Næta. |

---

## Payouts (Monthly / Manual)

| Action | Endpoint | Description |
|--------|----------|-------------|
| **List** | `GET /api/admin/payouts` | All payouts (filters/pagination). |
| **Read** | `GET /api/admin/payouts/:id` | Single payout. |
| **Calculate** | `POST /api/admin/payouts/calculate` | Generate payouts for a given month. |
| **Adjust** | `PATCH /api/admin/payouts/:id` | Body: `{ "adjustmentAmount": number, "adjustmentNote": "string" }`. Set manual adjustment before processing. |
| **Process** | `POST /api/admin/payouts/:id/process` | Mark payout **Paid**, set transactionId. |
| **Export** | `GET /api/admin/payouts/export` | Download payout list as CSV (Requirement ii — Additional Feature). |
| **Delete** | — | Næta. |

---

## Bank Details (Partner payout destination)

- **Model:** `User.bankDetails` (nested: `bankName`, `branchName`, `accountNo`, `accountHolderName`). Optional until set.
- **Partner:** `PUT /api/partner/bank-details` — body validated with Joi in `src/validatons/partnerValidation.js` (`bankDetailsSchema`); all four fields required (Requirement v). Logic in `partnerService.updateBankDetails`, DB in `src/repositories/userRepository.js` (`updateBankDetails`).
- **Payout request guard (Requirement v):** A partner cannot create a payout request if `bankDetails` are incomplete. `partnerService.createPayoutRequest` checks all four fields; returns **400 Bad Request** with message *"Bank details are required before requesting a payout. Please update your Bank Settings."* if any is missing.
- **Auto-fetch for Admin (Requirement vi):** `GET /api/admin/payouts` and `GET /api/admin/payout-requests` use Mongoose `.populate("partnerId", "name email shopName bankDetails")` in `payoutService.getPayouts` and `payoutService.getPayoutRequests`, so the admin response includes the partner’s bank details. Admin UI shows these inline for **Pending** items so the admin can verify before Approve/Process.

---

## Clean Architecture

- **Services:** Business logic in `src/services/` (payoutService, partnerService). No business logic in controllers.
- **Repositories:** DB access in `src/repositories/` (e.g. `userRepository` for User/bank-details). Payout reads/writes in payoutService call models directly; can be moved to a payoutRepository later for full consistency.
- **Validation:** Reject body and adjustment in `src/validatons/payoutValidation.js`; bank details in `src/validatons/partnerValidation.js`. Middleware uses these schemas.
- **Error handling:** Errors from services (e.g. "User not found", validation) propagate to `src/middleware/errorHandler.js` (central error handler).
- **Controllers:** Validate (middleware), call service, format response (e.g. `responseFormatter.success()`).

Admin panel eke "Payout Management" tab eke **monthly payouts** (calculate, adjust, process, export CSV) with "View Bank Info", **payout requests** (approve, reject with reason), saha **Payments** (read-only) use kara hækum.
