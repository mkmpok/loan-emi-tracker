# Vercel deployment checklist

This project is prepared for one Vercel URL containing both the React frontend and the Express API.

## Before deployment

Run locally:

```bash
npm install
npm test
npm run dev
```

Verify login, member creation, loan creation, EMI schedule, repayment, report, CSV export and foreclosure.


If the GitHub repository already exists locally, only commit and push the latest changes.

## Vercel

1. Go to Vercel and choose **Add New → Project**.
2. Import the GitHub repository.
3. Confirm the framework is **Vite**.
4. Deploy once to create the project.
5. Open the project and add **Turso Cloud** from Storage / Marketplace.
6. Create a Turso database and connect it to this Vercel project.
7. Confirm the project now has:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
8. Optionally add:
   - `DEMO_EMAIL=staff@company.com`
   - `DEMO_PASSWORD=demo123`
9. Redeploy the latest production deployment.

## Verify production

Open:

```text
https://YOUR-PROJECT.vercel.app/api/health
```

Expected:

```json
{"status":"ok"}
```

Then open the site itself, log in, create a member and loan, refresh, and confirm the records remain. Finally test the CSV export.

## What Vercel-specific files do

- `api/index.js` is the Vercel Function entry point for the Express app.
- `vercel.json` sends `/api/*` requests to that function and sends frontend routes to the Vite SPA entry point.
- `server/db.js` uses a local libSQL/SQLite file when `TURSO_DATABASE_URL` is absent, and Turso when it is present.
- `package.json` pins Node `24.x`, matching the current Vercel runtime used for the deployment.
