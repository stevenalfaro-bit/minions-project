# The Minions Project

This repository contains a playful Minions-inspired landing page for the project.

## Website
- Open `index.html` in a browser to view the site.
- The profile image is referenced as `king_bob.jpeg` in the page.
- If you later upload a real image file named `king_bob.jpeg`, it will display automatically.

## Project structure
- `index.html` — main page markup
- `styles.css` — site styling
- `script.js` — small script for the footer year

## Live updates

The `/updates.html` page lists the latest pushes to the default branch and reloads itself when a new one lands.

Required environment variables:
- `DATABASE_URL`: Postgres connection string (reference the Railway Postgres service's `DATABASE_URL`).
- `GITHUB_WEBHOOK_SECRET`: shared secret used to verify GitHub webhook signatures.

GitHub webhook setup (repo → Settings → Webhooks → Add webhook):
- Payload URL: `https://<service-domain>/github`
- Content type: `application/json`
- Secret: same value as `GITHUB_WEBHOOK_SECRET`
- Events: "Just the push event"

Routes: `POST /github`, `GET /api/announcements`, `GET /api/announcements/latest`, `GET /health`.
