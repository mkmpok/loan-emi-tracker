import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../data');
const localDbPath = process.env.DB_PATH || path.join(dataDir, 'loan-tracker.db');
const remoteUrl = process.env.TURSO_DATABASE_URL;

if (!remoteUrl) {
  fs.mkdirSync(path.dirname(localDbPath), { recursive: true });
}

const url = remoteUrl || `file:${localDbPath.replaceAll('\\', '/')}`;

export const db = createClient({
  url,
  authToken: remoteUrl ? process.env.TURSO_AUTH_TOKEN : undefined,
  intMode: 'number'
});

let initializationPromise;

export function initDb() {
  if (!initializationPromise) {
    initializationPromise = initializeSchema().catch((error) => {
      initializationPromise = undefined;
      throw error;
    });
  }
  return initializationPromise;
}

export async function closeDb() {
  db.close();
}

async function initializeSchema() {
  await db.batch([
    `CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      member_code TEXT NOT NULL COLLATE NOCASE UNIQUE,
      monthly_salary INTEGER NOT NULL CHECK (monthly_salary > 0),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      principal INTEGER NOT NULL CHECK (principal > 0),
      tenure INTEGER NOT NULL CHECK (tenure > 0 AND tenure <= 360),
      annual_interest_rate REAL NOT NULL DEFAULT 0.08,
      disbursed_on TEXT NOT NULL,
      regular_emi INTEGER NOT NULL,
      outstanding_balance INTEGER NOT NULL,
      paid_installments INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Closed')),
      closure_type TEXT CHECK (closure_type IN ('Repaid', 'Foreclosed') OR closure_type IS NULL),
      foreclosure_settlement INTEGER,
      closed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id)
    )`,
    `CREATE TABLE IF NOT EXISTS emi_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      installment_number INTEGER NOT NULL,
      due_date TEXT NOT NULL,
      emi_amount INTEGER NOT NULL,
      principal_component INTEGER NOT NULL,
      interest_component INTEGER NOT NULL,
      outstanding_after INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Waived')),
      paid_at TEXT,
      FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
      UNIQUE (loan_id, installment_number)
    )`,
    'CREATE INDEX IF NOT EXISTS idx_loans_member_id ON loans(member_id)',
    'CREATE INDEX IF NOT EXISTS idx_schedule_loan_id ON emi_schedule(loan_id)'
  ], 'write');
}
