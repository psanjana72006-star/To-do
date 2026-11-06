# Daylight

Daylight is a responsive task-planning app built with React, Vite, TypeScript, and Express. Its interface is available in English, Kannada, Hindi, Telugu, and Tamil.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` if you need to change the port.
3. Start the frontend and API together with `npm run dev`.
4. Open `http://localhost:3000`.

Demo account: `demo@daylight.app` / `daylight123`.

New users can register from the sign-in screen. Tasks persist across refreshes in `data/daylight-store.json`; the server stores salted PBKDF2 password hashes and scopes task queries and mutations to the authenticated user.

## Commands

- `npm run dev` starts the local Express/Vite app.
- `npm run build` creates the production frontend bundle.
- `npm run lint` runs the TypeScript check.
- `npm run clean` removes only the generated `dist` directory and preserves stored data.

## Current limitations

- The JSON file store is suitable for local development and a single server instance, not production multi-user deployment. It has no database transactions, backup/restore workflow, or cross-instance coordination. Use a managed database such as Supabase/PostgreSQL before deployment.
- Password reset email, session expiry/rotation, rate limiting, and browser-based end-to-end tests are not implemented.
- The interface translations are local. Task-content translation returns an explicit `503` until a real server-side translation provider is integrated; no translation is fabricated or applied.
- Reminders, recurring tasks, drag-and-drop ordering, calendar/focus views, and browser notifications are not implemented.
- No deployment has been performed. Keep the demo credentials out of production and configure a production database/auth provider before exposing this server publicly.
