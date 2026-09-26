# Loan EMI Tracker

A small full-stack loan-management app for the coding assignment. Staff can log in, add members, create **8% p.a. reducing-balance** loans, inspect the complete EMI schedule, record repayments, see current outstanding principal, foreclose a loan, view member-wise outstanding, and export that report to CSV.

## What is included

- Mock staff login
- Member creation and member search
- Loan creation with fixed 8% annual reducing-balance interest
- Full auto-generated EMI schedule
- Sequential EMI payment recording so current outstanding is meaningful
- Loan status: Active / Closed
- Member-wise outstanding report
- CSV export
- Bonus: foreclosure
- Bonus: search/filter
- EMI unit tests, including rounding and month-end dates
- Responsive UI

## Tech choices

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** libSQL/Turso (`@libsql/client`) — local SQLite file in development, persistent Turso database on Vercel
- **Tests:** Node's built-in test runner

I chose a small full-stack architecture rather than a front-end-only mock because the assignment asks to track changing outstanding balances. The database layer uses SQLite-compatible libSQL. Locally it writes to `data/loan-tracker.db`; on Vercel it connects to Turso so data survives serverless function restarts.

> Node.js **24.x** is used locally and on Vercel.


## Deploy to Vercel

The hosted version needs a durable database. Vercel Functions do not provide a persistent local filesystem, so the production deployment uses **Turso Cloud** through Vercel's Marketplace integration while local development continues to use a SQLite file.

### 1. Push this project to GitHub

Create a repository and push the contents of this folder (the folder containing `package.json`, not the outer ZIP folder).

### 2. Import the repository into Vercel

In Vercel, choose **Add New → Project**, import the GitHub repository, and keep the detected **Vite** framework settings. Node is pinned to `24.x` in `package.json`.

### 3. Connect a Turso database

From the Vercel project, open **Storage / Marketplace**, add **Turso Cloud**, create a database, and connect it to this project. The integration supplies these environment variables automatically:

```text
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
```

No SQL setup is required manually; the app creates its tables and indexes on the first API request.

### 4. Optional demo-login variables

The defaults work without configuration, but you can set these in **Project Settings → Environment Variables** if you want different demo credentials:

```text
DEMO_EMAIL=staff@company.com
DEMO_PASSWORD=demo123
```

### 5. Redeploy

Redeploy after connecting Turso. Vercel builds the Vite frontend and routes `/api/*` to the Express serverless function using `vercel.json`.

After deployment, verify:

```text
https://YOUR-PROJECT.vercel.app/
https://YOUR-PROJECT.vercel.app/api/health
```

The health endpoint should return:

```json
{ "status": "ok" }
```

Then log in, add a member, create a loan, refresh the browser, and confirm the records are still present. That persistence check proves the deployment is using Turso rather than ephemeral function storage.

## Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

Demo login:

```text
Email:    staff@company.com
Password: demo123
```

The Vite dev server proxies `/api` requests to the Express server on port `3001`.

## Run tests

```bash
npm test
```

## Production build

```bash
npm run build
npm start
```

Then open:

```text
http://localhost:3001
```

## EMI calculation

Annual interest is fixed at 8% and uses a reducing balance.

```text
monthlyRate = 0.08 / 12

EMI = P × r × (1 + r)^n
      -------------------
        (1 + r)^n - 1
```

For every month:

```text
interest  = round(currentOutstanding × monthlyRate)
principal = EMI - interest
nextOutstanding = currentOutstanding - principal
```

All stored/displayed money is in whole rupees, matching the assignment. That creates small rounding differences compared with a paise-level amortisation table, so the **final instalment is adjusted** to repay the exact remaining principal and leave outstanding at exactly `₹0`.

Example: with `₹1,00,000` for 12 months, the regular EMI rounds to `₹8,699`. Month 1 interest is higher than later interest because interest is calculated on the then-current outstanding principal, which reduces after each principal payment.

The finance logic lives only in `server/domain/emi.js`; the React UI never reimplements the formula.

## Assumptions

1. Principal and salary are entered as positive whole-rupee amounts.
2. Tenure is from 1 to 360 months.
3. The first EMI is due one calendar month after disbursement. If that day does not exist (for example, 31 January → February), the due date is clamped to that month's last day.
4. EMI payments are recorded in schedule order. This prevents an impossible stored state such as EMI 5 being paid while EMI 4 is still pending.
5. The assignment asks for “current outstanding”, but does not explicitly specify a payment-entry workflow. I added “Record next EMI paid” so outstanding can actually change rather than always equal the original principal.
6. **Foreclosure bonus assumption:** settlement equals current outstanding principal + one full month of interest on that outstanding principal. Future scheduled rows are marked `Waived`.
7. This is mock authentication. The token is intentionally simple and is not production security.

## Project structure

```text
loan-emi-tracker/
├── server/
│   ├── domain/emi.js          # Pure EMI, foreclosure and due-date math
│   ├── middleware/auth.js     # Mock auth guard
│   ├── routes/                # Thin HTTP routes
│   ├── services/loanService.js# Loan transactions/use-cases
│   ├── utils/csv.js           # CSV serializer
│   ├── db.js                  # libSQL schema + local/Turso connection
│   └── index.js               # Express app
├── src/
│   ├── components/            # Shared UI
│   ├── lib/                   # API + formatting helpers
│   ├── pages/                 # Screens
│   └── App.jsx
├── tests/emi.test.js
├── docs/INTERVIEW_NOTES.md
└── README.md
```

## API summary

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Mock staff login |
| GET/POST | `/api/members` | List/create members |
| GET/POST | `/api/loans` | List/create loans |
| GET | `/api/loans/:id` | Loan detail + complete schedule |
| POST | `/api/loans/:id/pay-next` | Record the next EMI as paid |
| POST | `/api/loans/:id/foreclose` | Bonus foreclosure flow |
| GET | `/api/reports/member-outstanding` | Member-wise outstanding JSON |
| GET | `/api/reports/member-outstanding.csv` | CSV export |

## AI assistance

AI assistance was used to help scaffold the project, implement and review the EMI calculation, suggest edge-case tests, and refine the UI/code structure. This is intentionally disclosed because the assignment explicitly permits AI tools.

## What I would improve with more time

- Replace mock auth with password hashing and real sessions/JWT rotation.
- Add a proper payment ledger with payment date/reference instead of representing payments only as schedule status.
- Add HTTP-level API tests in addition to the existing service/database integration tests.
- Add database migrations instead of creating the current schema at startup.
- Add explicit decimal-money/paise handling if the product later requires paise-level accounting.
- Add audit logging for repayments and foreclosure actions.
- Add pagination for large member/loan datasets.

## Submission check

- [x] Login works
- [x] Add/list members
- [x] Create 8% reducing-balance loan
- [x] Full EMI schedule auto-generates
- [x] Outstanding reduces as EMIs are recorded
- [x] Final EMI clears the balance to zero
- [x] Member-wise outstanding report
- [x] CSV export
- [x] Indian currency formatting (`₹1,23,456`)
- [x] README with exact run instructions and AI disclosure
- [x] EMI tests
- [x] Bonus foreclosure and search
