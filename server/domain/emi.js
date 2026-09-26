export const ANNUAL_INTEREST_RATE = 0.08;
export const MONTHLY_INTEREST_RATE = ANNUAL_INTEREST_RATE / 12;

export function calculateEmi(principal, tenure, annualRate = ANNUAL_INTEREST_RATE) {
  assertPositiveInteger(principal, 'Principal');
  assertTenure(tenure);

  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return Math.round(principal / tenure);

  const growth = (1 + monthlyRate) ** tenure;
  const rawEmi = principal * monthlyRate * growth / (growth - 1);
  return Math.max(1, Math.round(rawEmi));
}

export function generateEmiSchedule({
  principal,
  tenure,
  disbursedOn = todayIsoDate(),
  annualRate = ANNUAL_INTEREST_RATE
}) {
  assertPositiveInteger(principal, 'Principal');
  assertTenure(tenure);
  assertIsoDate(disbursedOn);

  const monthlyRate = annualRate / 12;
  const regularEmi = calculateEmi(principal, tenure, annualRate);
  const schedule = [];
  let outstanding = principal;

  for (let installmentNumber = 1; installmentNumber <= tenure; installmentNumber += 1) {
    const isFinalInstallment = installmentNumber === tenure;
    const interestComponent = Math.round(outstanding * monthlyRate);

    let principalComponent;
    let emiAmount;

    if (isFinalInstallment) {
      // Whole-rupee rounding can leave a small residual. The final row absorbs it
      // so the principal always reaches exactly zero.
      principalComponent = outstanding;
      emiAmount = principalComponent + interestComponent;
    } else {
      principalComponent = Math.max(0, Math.min(regularEmi - interestComponent, outstanding));
      emiAmount = principalComponent + interestComponent;
    }

    outstanding -= principalComponent;

    schedule.push({
      installmentNumber,
      dueDate: addMonthsClamped(disbursedOn, installmentNumber),
      emiAmount,
      principalComponent,
      interestComponent,
      outstandingAfter: outstanding
    });
  }

  return {
    regularEmi,
    schedule
  };
}

export function calculateForeclosureSettlement(outstandingPrincipal, annualRate = ANNUAL_INTEREST_RATE) {
  if (!Number.isInteger(outstandingPrincipal) || outstandingPrincipal < 0) {
    throw new Error('Outstanding principal must be a non-negative whole rupee amount.');
  }

  const currentMonthInterest = Math.round(outstandingPrincipal * (annualRate / 12));
  return {
    outstandingPrincipal,
    currentMonthInterest,
    settlementAmount: outstandingPrincipal + currentMonthInterest
  };
}

export function addMonthsClamped(isoDate, monthsToAdd) {
  assertIsoDate(isoDate);
  if (!Number.isInteger(monthsToAdd) || monthsToAdd < 0) {
    throw new Error('Months to add must be a non-negative integer.');
  }

  const [year, month, day] = isoDate.split('-').map(Number);
  const monthIndex = month - 1 + monthsToAdd;
  const targetYear = year + Math.floor(monthIndex / 12);
  const targetMonthIndex = ((monthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonthIndex + 1, 0)).getUTCDate();
  const targetDay = Math.min(day, lastDay);

  return `${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
}

export function todayIsoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function assertPositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive whole number.`);
  }
}

function assertTenure(tenure) {
  if (!Number.isInteger(tenure) || tenure <= 0 || tenure > 360) {
    throw new Error('Tenure must be a whole number between 1 and 360 months.');
  }
}

function assertIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Date must use YYYY-MM-DD format.');
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isSameDate = date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;

  if (!isSameDate) throw new Error('Date is invalid.');
}
