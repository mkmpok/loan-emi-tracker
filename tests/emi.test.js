import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addMonthsClamped,
  calculateEmi,
  calculateForeclosureSettlement,
  generateEmiSchedule
} from '../server/domain/emi.js';

test('calculates the standard reducing-balance EMI for ₹1,00,000 over 12 months', () => {
  assert.equal(calculateEmi(100000, 12), 8699);
});

test('schedule preserves principal exactly and clears the last balance', () => {
  const { regularEmi, schedule } = generateEmiSchedule({
    principal: 100000,
    tenure: 12,
    disbursedOn: '2026-01-15'
  });

  assert.equal(schedule.length, 12);
  assert.equal(schedule[0].emiAmount, regularEmi);
  assert.equal(schedule.at(-1).outstandingAfter, 0);
  assert.equal(
    schedule.reduce((sum, row) => sum + row.principalComponent, 0),
    100000
  );
});

test('interest falls as outstanding principal reduces for a normal amortising loan', () => {
  const { schedule } = generateEmiSchedule({
    principal: 250000,
    tenure: 24,
    disbursedOn: '2026-04-10'
  });

  assert.ok(schedule[0].interestComponent > schedule.at(-1).interestComponent);
  for (let i = 1; i < schedule.length; i += 1) {
    assert.ok(schedule[i].outstandingAfter <= schedule[i - 1].outstandingAfter);
  }
});

test('one-month loan charges one month of interest and clears principal', () => {
  const { schedule } = generateEmiSchedule({
    principal: 10000,
    tenure: 1,
    disbursedOn: '2026-06-05'
  });

  assert.deepEqual(schedule[0], {
    installmentNumber: 1,
    dueDate: '2026-07-05',
    emiAmount: 10067,
    principalComponent: 10000,
    interestComponent: 67,
    outstandingAfter: 0
  });
});

test('month-end due dates clamp to the last valid calendar day', () => {
  assert.equal(addMonthsClamped('2025-01-31', 1), '2025-02-28');
  assert.equal(addMonthsClamped('2024-01-31', 1), '2024-02-29');
  assert.equal(addMonthsClamped('2026-01-31', 2), '2026-03-31');
});

test('rejects invalid tenure instead of producing a broken schedule', () => {
  assert.throws(
    () => generateEmiSchedule({ principal: 50000, tenure: 0, disbursedOn: '2026-01-01' }),
    /Tenure must be/
  );
});

test('foreclosure charges outstanding principal plus one month interest', () => {
  assert.deepEqual(calculateForeclosureSettlement(50000), {
    outstandingPrincipal: 50000,
    currentMonthInterest: 333,
    settlementAmount: 50333
  });
});
