# Google Sign-In Setup

Fix **403 "The given origin is not allowed for the given client ID"** and **404 on /api/auth/google** as follows.

**Quick checklist:**
1. Add the **exact** app URL (e.g. `http://localhost:5173`) under Authorized JavaScript origins in Google Cloud Console.
2. Run the **backend** in a separate terminal (`cd backend` then `npm start`) so `/api/auth/google` is available.
3. Use the **same** Client ID in backend `.env` (`GOOGLE_CLIENT_ID`) and frontend `.env` (`VITE_GOOGLE_CLIENT_ID`).

On the **Login page in dev**, a yellow box shows the exact origin to add and a reminder to start the backend.

---

## 1. Fix 403 – Add your origin in Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) → your project.
2. Go to **APIs & Services** → **Credentials**.
3. Open your **OAuth 2.0 Client ID** (Web application).
4. Under **Authorized JavaScript origins**, add the **exact** URL your app runs on:
   - Local dev: `http://localhost:5173` (Vite default)
   - If you use another port: `http://localhost:3000`, etc.
   - Production: `https://yourdomain.com` (no trailing slash)
5. **Save**.

Use the same origin in the address bar (e.g. if you use `http://127.0.0.1:5173`, add that too).

---

## 2. Fix 404 – Backend must be running

The frontend sends Google login to **POST /api/auth/google**, which is proxied to the backend.

1. In a separate terminal, start the **backend** from the `backend` folder:
   ```bash
   cd backend
   npm start
   ```
2. It should listen on **port 5000** (or your `PORT` in `backend/.env`).
3. Start the **frontend** from the `frontend` folder:
   ```bash
   cd frontend
   npm run dev
   ```
4. Open the app at the URL you added in step 1 (e.g. `http://localhost:5173`).

If the backend is not running, requests to `/api/auth/google` will fail (404 or 502).

---

## 3. Environment variables

- **Backend** (`backend/.env`): `GOOGLE_CLIENT_ID` = your full Web client ID (e.g. `xxxxx.apps.googleusercontent.com`).
- **Frontend** (`frontend/.env`): `VITE_GOOGLE_CLIENT_ID` = the **same** Client ID.

Use the **same** OAuth 2.0 Web client in the Console for both; only the **Client ID** is needed (no client secret for the frontend flow).

---

## 4. Cross-Origin-Opener-Policy (COOP) message

If you see “Cross-Origin-Opener-Policy policy would block the window.postMessage call”:

- Usually fixing **Authorized JavaScript origins** (step 1) resolves it.
- Ensure you’re not opening the app in an iframe or with strict COOP headers.
- Try in a normal tab with no strict security extensions.
