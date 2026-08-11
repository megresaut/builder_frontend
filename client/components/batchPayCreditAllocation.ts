/**
 * Vendor-credit allocation for the batch pay modal.
 *
 * A vendor credit belongs to a vendor, not a bill, so when a batch holds several
 * bills from the same vendor something has to decide how each credit is spread.
 *
 * Since migration 148 (vendor_credit_applications) a credit no longer has to fit
 * inside one bill. It SPLITS: each bill absorbs up to its amount due and the
 * remainder carries on. That is what makes a $10,000 credit usable against a
 * $5,000 bill — it applies $5,000 and keeps $5,000 for later.
 *
 * The one constraint that survives: credit applied to a bill can never exceed
 * that bill's amount due, because the pay endpoint rejects
 * credits + cash > outstanding with 409 amount_exceeds_balance.
 *
 * Everything here is pure so the rules stay testable without mounting a modal.
 */

export interface AllocatableBill {
  id: number;
  vendorId?: number;
  amountDueCents: number;
}

export interface AllocatableCredit {
  id: number;
  vendor_id: number;
  /** Immutable face value. */
  amount_cents: number;
  /** What is actually left to spend — face value minus prior applications. */
  remaining_cents: number;
  date: string;
  memo: string;
}

/** One credit consuming part (or all) of its balance against one bill. */
export interface CreditAllocation {
  creditId: number;
  billId: number;
  amountCents: number;
}

/** Total credit applied to a bill across all credits. */
export function allocatedCentsForBill(
  allocations: CreditAllocation[],
  billId: number,
): number {
  return allocations
    .filter((a) => a.billId === billId)
    .reduce((sum, a) => sum + a.amountCents, 0);
}

/** Total of one credit spent across all bills in the batch. */
export function allocatedCentsForCredit(
  allocations: CreditAllocation[],
  creditId: number,
): number {
  return allocations
    .filter((a) => a.creditId === creditId)
    .reduce((sum, a) => sum + a.amountCents, 0);
}

/** How much of a credit this batch leaves unspent. */
export function unallocatedCentsForCredit(
  allocations: CreditAllocation[],
  credit: AllocatableCredit,
): number {
  return Math.max(
    0,
    credit.remaining_cents - allocatedCentsForCredit(allocations, credit.id),
  );
}

/** Total credit left on the table across the whole batch. */
export function totalUnallocatedCents(
  allocations: CreditAllocation[],
  credits: AllocatableCredit[],
): number {
  return credits.reduce((sum, c) => sum + unallocatedCentsForCredit(allocations, c), 0);
}

/**
 * The most of this credit that could go on this bill: capped both by what is left
 * of the credit (after its other bills) and by what the bill still owes (after its
 * other credits). Excludes any existing allocation of this exact pair, so it
 * answers "what could this be set to", not "what is it now".
 */
export function maxApplicableCents(
  allocations: CreditAllocation[],
  credits: AllocatableCredit[],
  bill: AllocatableBill,
  creditId: number,
): number {
  const credit = credits.find((c) => c.id === creditId);
  if (!credit) return 0;
  if (bill.vendorId == null || credit.vendor_id !== bill.vendorId) return 0;

  const spentElsewhere = allocations
    .filter((a) => a.creditId === creditId && a.billId !== bill.id)
    .reduce((sum, a) => sum + a.amountCents, 0);
  const creditLeft = credit.remaining_cents - spentElsewhere;

  const otherCreditsOnBill = allocations
    .filter((a) => a.billId === bill.id && a.creditId !== creditId)
    .reduce((sum, a) => sum + a.amountCents, 0);
  const billLeft = bill.amountDueCents - otherCreditsOnBill;

  return Math.max(0, Math.min(creditLeft, billLeft));
}

/**
 * Initial allocation: for each vendor, walk its bills largest-due first and draw
 * from its oldest credits, splitting whenever a credit outlasts the bill.
 *
 * Largest-bill-first concentrates credit where there is room to absorb it, which
 * maximises what the batch consumes, and it is one sentence to explain when
 * someone asks why a credit landed where it did. Users can retarget any of it.
 */
export function allocateCredits(
  bills: AllocatableBill[],
  credits: AllocatableCredit[],
): CreditAllocation[] {
  const byVendor = new Map<
    number,
    { bills: AllocatableBill[]; credits: AllocatableCredit[] }
  >();

  for (const bill of bills) {
    if (bill.vendorId == null || bill.amountDueCents <= 0) continue;
    const entry = byVendor.get(bill.vendorId) ?? { bills: [], credits: [] };
    entry.bills.push(bill);
    byVendor.set(bill.vendorId, entry);
  }
  for (const credit of credits) {
    const entry = byVendor.get(credit.vendor_id);
    // No bill for this vendor in the batch — the credit is simply not in play.
    if (entry) entry.credits.push(credit);
  }

  const out: CreditAllocation[] = [];

  for (const { bills: vendorBills, credits: vendorCredits } of byVendor.values()) {
    const orderedBills = [...vendorBills].sort(
      (a, b) => b.amountDueCents - a.amountDueCents || a.id - b.id,
    );
    const orderedCredits = [...vendorCredits].sort(
      (a, b) => a.date.localeCompare(b.date) || a.id - b.id,
    );

    const unspent = new Map<number, number>();
    for (const c of orderedCredits) unspent.set(c.id, c.remaining_cents);

    for (const bill of orderedBills) {
      let due = bill.amountDueCents;
      for (const credit of orderedCredits) {
        if (due <= 0) break;
        const available = unspent.get(credit.id) ?? 0;
        if (available <= 0) continue;
        const take = Math.min(available, due);
        out.push({ creditId: credit.id, billId: bill.id, amountCents: take });
        unspent.set(credit.id, available - take);
        due -= take;
      }
    }
  }

  return out;
}

/**
 * Set how much of a credit goes on one bill, clamped to what is applicable.
 * An amount of zero (or anything that clamps to zero) removes the allocation.
 * Other bills drawing on the same credit are left alone.
 */
export function setCreditAmount(
  allocations: CreditAllocation[],
  credits: AllocatableCredit[],
  bills: AllocatableBill[],
  creditId: number,
  billId: number,
  amountCents: number,
): CreditAllocation[] {
  const without = allocations.filter(
    (a) => !(a.creditId === creditId && a.billId === billId),
  );
  const bill = bills.find((b) => b.id === billId);
  if (!bill) return without;

  const max = maxApplicableCents(without, credits, bill, creditId);
  const clamped = Math.min(max, Math.max(0, Math.floor(amountCents)));
  if (clamped <= 0) return without;

  return [...without, { creditId, billId, amountCents: clamped }];
}

/**
 * Parse a user-typed dollar amount into cents. Tolerant of "$75.35", "75.35",
 * "75", "1,234.56". Returns NaN when the input holds no number at all.
 *
 * Non-digits are stripped rather than rejected, so a leading "-" is dropped and
 * "-5" reads as $5. That is what the single-bill modal has always done; the
 * batch modal matches it rather than inventing a second rule.
 */
export function parseCents(input: string): number {
  const cleaned = input.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num)) return NaN;
  return Math.round(num * 100);
}

/** One bill's resolved contribution to a batch run. */
export interface BatchPaymentRow {
  billId: number;
  /** Outstanding balance — the "of $X" hint and the ceiling for this row. */
  amountDueCents: number;
  /** Net cash to send as amount_cents. */
  cashCents: number;
  /** Vendor credit applied to this bill across all credits. */
  creditCents: number;
  /** cashCents + creditCents — what actually settles against the bill. */
  totalCents: number;
  /** Nothing is being paid: leave this bill out of the run entirely. */
  skip: boolean;
  /** Why this row cannot be submitted, or null when it is fine. */
  error: string | null;
}

export interface BatchPaymentPlan {
  rows: BatchPaymentRow[];
  /** The rows that will actually be POSTed, in `bills` order. */
  payable: BatchPaymentRow[];
  totalDueCents: number;
  totalCashCents: number;
  totalCreditCents: number;
  /** Any row is invalid, or there is nothing left to pay. */
  blocked: boolean;
}

/**
 * Resolve the typed amounts and the credit allocation into what a run will send.
 *
 * The typed amount is NET CASH, matching the single-bill modal: credits sit
 * alongside it and the pair may not exceed the bill's balance, because the pay
 * endpoint rejects credits + cash > outstanding with amount_exceeds_balance.
 *
 * A row settling nothing is skipped rather than rejected — a $0 payment would
 * post to QBO as a real (empty) BillPayment, and zeroing a row is the natural
 * way to drop one bill from a batch without reopening the modal.
 */
export function buildBatchPaymentPlan(
  bills: AllocatableBill[],
  amounts: Map<number, string>,
  allocations: CreditAllocation[],
): BatchPaymentPlan {
  const rows: BatchPaymentRow[] = bills.map((bill) => {
    const raw = amounts.get(bill.id) ?? "";
    const creditCents = allocatedCentsForBill(allocations, bill.id);
    // A cleared field reads as "don't pay this one", not as a typo.
    const parsed = raw.trim() === "" ? 0 : parseCents(raw);

    if (Number.isNaN(parsed)) {
      return {
        billId: bill.id,
        amountDueCents: bill.amountDueCents,
        cashCents: 0,
        creditCents,
        totalCents: creditCents,
        skip: false,
        error: "Enter a valid amount.",
      };
    }

    const totalCents = parsed + creditCents;
    const error =
      totalCents > bill.amountDueCents
        ? `Can't exceed the $${(bill.amountDueCents / 100).toFixed(2)} balance.`
        : null;

    return {
      billId: bill.id,
      amountDueCents: bill.amountDueCents,
      cashCents: parsed,
      creditCents,
      totalCents,
      skip: error === null && totalCents === 0,
      error,
    };
  });

  const payable = rows.filter((r) => r.error === null && !r.skip);

  return {
    rows,
    payable,
    totalDueCents: bills.reduce((sum, b) => sum + b.amountDueCents, 0),
    totalCashCents: payable.reduce((sum, r) => sum + r.cashCents, 0),
    totalCreditCents: payable.reduce((sum, r) => sum + r.creditCents, 0),
    blocked: rows.some((r) => r.error !== null) || payable.length === 0,
  };
}

/**
 * Tick or untick a credit on a bill. Ticking applies as much as the pair allows;
 * unticking removes only this bill's share, leaving the credit's other bills
 * intact.
 */
export function toggleCredit(
  allocations: CreditAllocation[],
  credits: AllocatableCredit[],
  bills: AllocatableBill[],
  creditId: number,
  billId: number,
): CreditAllocation[] {
  const existing = allocations.find(
    (a) => a.creditId === creditId && a.billId === billId,
  );
  if (existing) {
    return allocations.filter((a) => !(a.creditId === creditId && a.billId === billId));
  }
  const bill = bills.find((b) => b.id === billId);
  if (!bill) return allocations;
  return setCreditAmount(
    allocations,
    credits,
    bills,
    creditId,
    billId,
    maxApplicableCents(allocations, credits, bill, creditId),
  );
}
