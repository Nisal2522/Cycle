# Controller → Service → Model Refactoring Plan

## Goal
Move all data access (Model usage) from Controllers into Services. Controllers only: parse request, call service, send response. Validations live in `validatons/` (existing folder). Shared constants live in `constants.js`.

## Architecture (target)
```
Controller  →  Service  →  Model
     ↓              ↓
  validatons    constants.js
```

## Phase 1: Constants & validators
- **constants.js** — Create `src/constants.js`: `ROLES`, `ROUTE_STATUS`, `HAZARD_TYPES`, `LIMITS` (routes 500/100, hazards 200), `MONTH_NAMES`, `CO2_PER_KM`, `TOKENS_PER_KM`, `MAX_DISTANCE_KM`, etc.
- **validatons** — Keep existing folder name (avoid breaking imports). Add `routeValidation.js`, `hazardValidation.js` where useful; authValidation already uses Joi; reference constants for ROLES.
- **Models** — Hazard model keeps enum; optionally import HAZARD_TYPES from constants to avoid duplication. User model: ROLES can stay or move to constants (auth + admin use it).

## Phase 2: Admin
- **adminService.js** — New. Methods: getStats, getUsers, verifyUser, blockUser, deleteUser, getUserGrowthStats, getRoutes, getApprovedRoutes, getPendingRoutes, getRouteIssues, deleteRoute, approveRoute, rejectRoute, getAdminHazards, resolveAdminHazard, deleteAdminHazard, getPayments. All User, Route, Hazard, Payment access here. Payout operations already in payoutService; adminController continues to call payoutService for those.
- **adminController.js** — Remove model imports. Call adminService for all admin data operations; call payoutService for payouts/payout-requests. Use success() / res.json() only.

## Phase 3: Routes
- **routeService.js** — New. createRoute, getPublicRoutes, getMyRoutes, updateRoute, deleteRoute. Route model + creator checks.
- **routeController.js** — Use routeValidation for body/params if added; call routeService; res only.

## Phase 4: Hazards
- **hazardService.js** — New. getHazards, getHazardMarkers, reportHazard, updateHazard, deleteHazard. Hazard model; HAZARD_TYPES from constants.
- **hazardController.js** — Call hazardService; res only.

## Phase 5: Chat
- **chatService.js** — New. createOrGetOneOnOneChat, createGroupChat, getMyChats, getMessages, editMessage, deleteMessage, searchUsers. Chat, Message, User models. Socket emit can be done in controller (pass io) or service (pass io from controller).
- **chatController.js** — Call chatService; pass req.app.get('io') where needed; res only.

## Phase 6: Cyclist
- **cyclistService.js** — New. getStats, updateDistance, getRides, getLeaderboard, getPartnerCount, getPartnerShops, getShopRewards. User, Reward, Ride models. Constants from constants.js.
- **cyclistController.js** — Call cyclistService; res only.

## Phase 7: Auth
- **authController.js** — Already uses authService. Change: import ROLES from constants.js instead of User model. Validation can stay inline or use validatons/authValidation (already Joi).

## File summary
| New/Updated | File |
|-------------|------|
| New | src/constants.js |
| New | src/services/adminService.js |
| New | src/services/routeService.js |
| New | src/services/hazardService.js |
| New | src/services/chatService.js |
| New | src/services/cyclistService.js |
| New | src/validatons/routeValidation.js (optional) |
| New | src/validatons/hazardValidation.js (optional) |
| Refactor | src/controllers/adminController.js |
| Refactor | src/controllers/routeController.js |
| Refactor | src/controllers/hazardController.js |
| Refactor | src/controllers/chatController.js |
| Refactor | src/controllers/cyclistController.js |
| Refactor | src/controllers/authController.js |
| Update | src/models/User.js (optional: ROLES from constants) |
| Update | src/models/Hazard.js (optional: HAZARD_TYPES from constants) |

## Order of implementation
1. constants.js ✅
2. adminService + adminController ✅
3. routeService + routeController ✅
4. hazardService + hazardController ✅
5. chatService + chatController ✅
6. cyclistService + cyclistController ✅
7. authController (constants for ROLES) ✅

## Implemented
- All controllers now delegate to services; no controller imports models (except authController imports only constants.ROLES).
- Validations: routeValidation.js, hazardValidation.js added; authValidation.js uses constants.ROLES.
- Models: User.js and Hazard.js import ROLES / HAZARD_TYPES from constants.js for single source of truth.

## Repository Layer Removed (2026-02-16)
**Decision**: Removed the repository layer as it added unnecessary complexity without providing value.

**Rationale**:
- Only 2 of 11 models had repositories (18% coverage) - inconsistent implementation
- Mongoose already provides the Data Mapper pattern - adding repositories creates a "repository of repositories"
- No abstraction value: only MongoDB is used, no need to swap data sources
- `paymentRepository.js` was dead code (never imported or used)
- `userRepository.js` was only used by `partnerService.js` for 4 simple operations

**Changes Made**:
- Deleted `src/repositories/userRepository.js`
- Deleted `src/repositories/paymentRepository.js`
- Deleted `src/repositories/` directory
- Refactored `partnerService.js` to use Mongoose User model directly (4 operations inlined)
- Updated `README.md` to document correct Controller → Service → Model architecture

**Current Architecture**: Routes → Controllers → Services → Models (Mongoose)

Services access Mongoose models directly. This is the consistent pattern across all 11 services. Complex or reused queries become service helper functions if needed.
