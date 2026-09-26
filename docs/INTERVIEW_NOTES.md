# Coding Assignment — Loan EMI Tracker

**Time:** ~4–6 hours (take up to 3 days if part-time)
**Submission:** A working app + source code (GitHub repo or zip) + a short README.
**You may use AI tools** (Cursor, Copilot, Claude, ChatGPT, etc.). We encourage it. But you must understand and be able to explain every line you submit — we will ask.

---

## 1. What we're building

A small **Loan EMI Tracker** — a mini loan-management app. A staff user logs in, adds members, creates loans, and the app generates the repayment schedule and tracks what's outstanding.

This is deliberately small in scope but has one part that separates people who *understand* code from people who only *generate* it: the **EMI math**. Get that right and explain it, and you're most of the way there.

---

## 2. Tech stack

Use whatever you're fastest and most confident in. Suggested:

- **Frontend:** React / React Native / Next.js (or your choice)
- **Backend:** Node/Express, FastAPI, or similar (a backend is preferred but a well-structured front-end-only app with mock data is acceptable if you're short on time)
- **Data:** SQLite / Postgres / or in-memory seed data — your call
- **Auth:** Mock/hardcoded login is fine

We care more about clean, readable, working code than about a fancy stack.

---

## 3. Core requirements (must-have)

### 3.1 Login
- A simple login screen. Hardcoded or mock credentials are acceptable.
- After login, the user lands on a dashboard.

### 3.2 Members
- List all members (table or cards).
- Add a new member: name, employee/member ID, monthly salary.
- Basic validation (no empty required fields).

### 3.3 Loans
- Create a loan for a member with these inputs:
  - **Principal** (loan amount)
  - **Tenure** (number of monthly instalments / EMIs)
  - **Interest rate:** fixed at **8% per annum, reducing balance**
- On creation, the app must **auto-generate the full EMI schedule** (see Section 4).
- List all loans with: member name, principal, tenure, outstanding balance, status (Active / Closed).

### 3.4 Loan detail
- Open a loan to see its **full EMI schedule** as a table:
  - EMI number, due date, EMI amount, principal component, interest component, **outstanding balance after that EMI**.
- Show the current outstanding principal at the top.

### 3.5 Report
- One report screen: **Member-wise outstanding** — each member and their total outstanding across loans.
- Add an **"Export to CSV"** button for this report.

---

## 4. The EMI math (read this carefully)

Loans use **8% per annum on a reducing-balance basis**. This is the heart of the assignment.

- Monthly interest rate = annual rate / 12.
- Each month, interest is charged on the **remaining outstanding principal**, not the original principal.
- The EMI (monthly instalment) is a fixed amount calculated with the standard reducing-balance formula:

```
EMI = P × r × (1 + r)^n / ((1 + r)^n − 1)

where:
  P = principal
  r = monthly interest rate (annual rate / 12, as a decimal)
  n = tenure in months
```

- Each instalment splits into an **interest part** (this month's interest on the outstanding balance) and a **principal part** (the rest). The outstanding balance reduces each month by the principal part.
- The final instalment should clear the balance to (near) zero — handle rounding so the last row doesn't leave a few paise hanging.

**Currency:** Indian Rupee format with Indian comma grouping, e.g. `₹1,23,456`. No paise needed (round to whole rupees), but make sure your schedule still balances after rounding.

> Tip: if you can't explain *why* the interest in month 1 differs from the interest in month 12, you don't understand reducing balance yet. Fix that before submitting.

---

## 5. Bonus (nice-to-have, not required)

Pick any that interest you — these tell us about depth, not completion:

- **Foreclosure:** a button that closes a loan early — settlement = outstanding principal + the current month's interest only (all future interest waived).
- **Top-up gating:** only allow a top-up loan once ≥ 33% of the current loan's principal is repaid.
- Search / filter on the members or loans list.
- Dark mode or a clean, considered UI.
- Tests for the EMI calculation (this earns serious points).
- Multi-language UI toggle.

---

## 6. What we are evaluating

Be aware: **a working demo is the baseline, not the win.** Anyone can get a green screen out of an AI tool. We are looking at:

1. **Correctness** — does the EMI math actually balance? Does the last instalment clear the loan?
2. **Code quality** — is it readable, organised into sensible files/functions, or one giant dump? Naming, structure, no dead code.
3. **Understanding** — in the interview we will point at a function and ask you to explain it, and ask you to make a small live change (e.g. "add a foreclosure button now"). This is the real test.
4. **Edge cases** — what happens with a 1-month loan? A zero-tenure input? Rounding on the last EMI?
5. **Judgement** — sensible validation, honest handling of things you didn't finish (a clear "not done" beats a fake button).

**Honesty about AI use:** Tell us in the README which parts you used AI for and which parts you wrote/reviewed yourself. We respect this — we do not respect pretending.

---

## 7. What to submit

1. **Source code** — GitHub repo (preferred) or a zip.
2. **A README** containing:
   - How to run it locally (exact commands).
   - Your tech choices and why.
   - Which parts used AI assistance.
   - Anything you'd improve with more time.
3. **(Optional) A 2–3 minute screen recording** walking through the app.

---

## 8. Ground rules

- Timebox it. We are not expecting production-grade software in a few hours — we want to see how you think and how you build.
- A smaller app that works correctly and is well understood beats a large half-broken one.
- If a requirement is ambiguous, make a reasonable assumption and **write it down** in the README. Reasonable assumptions are a green flag.

---

## 9. Quick checklist before you submit

- [ ] Login works
- [ ] Can add a member and see them in the list
- [ ] Can create a loan with principal + tenure (8% reducing)
- [ ] EMI schedule auto-generates and the table is correct
- [ ] Outstanding balance reduces correctly each month
- [ ] Last EMI clears the loan to ~zero (rounding handled)
- [ ] Member-wise outstanding report works
- [ ] CSV export works
- [ ] Currency shown as `₹1,23,456` (Indian format)
- [ ] README with run instructions + AI-usage notes

Good luck — build something you'd be happy to defend line by line.
