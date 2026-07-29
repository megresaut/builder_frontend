# Vendor Card Refund — Frontend Implementation Report

Branch: `vendor-card-refund-ui`

## Files created

- `client/components/RecordCardRefundModal.tsx` — new modal component. Amount /
  date / memo inputs only; card, vendor, and amount-paid shown read-only for
  context. Client-side caps the amount at what's left refundable on the
  payment. Posts `POST /vendors/bill-payments/{paymentId}/refunds`, surfaces
  server error messages verbatim (they're written to be read directly), and
  toasts `buildium_instructions` on success.

## Files modified

- `client/pages/properties/ViewBillV2.tsx`
  - `ApiPayment` gained `paid_from_account_type` and `refunds: BillPaymentRefund[]`.
  - New state: `showRefundModal`, `refundTargetPayment`, `deletingRefundId`,
    `totalRefundedCents`, `netCostCents`.
  - `loadBill()` and the initial-load effect now also capture
    `total_refunded_cents` / `net_cost_cents` from the payments response.
  - New `handleDeleteRefund` — `DELETE /vendors/bill-payments/{id}/refunds/{refundId}`,
    confirms via `window.confirm` (matches the existing attachment-delete
    convention in this file), surfaces the server's message as-is (including
    the "refund left in place" case on a 502 from QBO).
  - Payment history table: each payment row gained a "Refund to card" button,
    disabled with a visible caption ("Card payments only") plus a title
    tooltip when `paid_from_account_type !== "Credit Card"`. Recorded refunds
    render as nested `<tr>` rows directly under the payment they reverse
    (muted background, `↳ Card refund`, date, memo, negative amount, Delete),
    never as free-floating rows.
  - "Bill amount" panel gained `Refunded` / `Net cost` lines, shown only when
    `totalRefundedCents > 0`. Paid/Remaining are untouched — refunding never
    reopens the bill.
  - `RecordCardRefundModal` is rendered once at the bottom, driven by
    `refundTargetPayment`; `onRecorded` calls `loadBill()` so nested refunds
    and totals refresh together.

No files under `client/components/ui/` were touched. No backend files were
touched — the contract was read from
`avm-backend/api/modules/vendors/http/bill_payment_refunds.go`,
`handlers.go` (`handleListBillPayments`), and
`avm-backend/api/modules/vendors/repository/bill_payment_refunds.go` to
confirm field names (`card_name`, `expense_name`, `paid_from_account_type`,
`total_refunded_cents`, `net_cost_cents`, `requires_manual_buildium_update`,
`buildium_instructions`) before writing any code — all matched the spec
exactly, no deviations needed.

## Design decisions

- **Card-only gate lives on `paid_from_account_type`, not a client guess.**
  The backend resolves "is this a card" via a `chart_of_accounts.qbo_account_type`
  join and the payments list endpoint now returns that same resolved value per
  payment — so the UI's enable/disable test can never disagree with what the
  POST would accept or reject. Comment in the code calls this out explicitly.
- **Disabled-but-visible, not hidden.** Per the brief, a non-card payment
  still shows the "Refund to card" button (disabled) plus a short caption,
  because the vendor-credit-vs-refund confusion is the expensive mistake this
  feature exists to prevent — a visible disabled control teaches the
  distinction, a missing one doesn't.
- **Refunds nest under their payment via `<Fragment>` rows in the same
  `<table>`**, rather than a separate list/section, so the "this refund
  reverses THIS specific payment/card" relationship is visually unambiguous.
- **No picker for card / expense account / vendor in the modal** — by design,
  per the spec. The modal shows vendor name, paying card, and amount paid as
  plain read-only rows; the expense account is never picked (or shown) client-side
  since it's resolved from the bill's line items only at submit time on the
  server.
- **Client-side cap** on refund amount mirrors `payment.amount_cents -
  already-refunded-on-this-payment` exactly, but the server's row-locked
  409 `refund_exceeds_payment` is still the real backstop (surfaced verbatim if
  a race loses).
- **Toast, not a banner**, for the Buildium manual-entry instruction —
  `res.buildium_instructions` is shown via `toast.info` with an 10s duration
  on record, and a fixed reminder toast on delete (delete's response has the
  flag but no bespoke instruction string).
- Reused `ModalTemplate` / `ModalButtons` / `FieldShell` / `Input` / `Textarea`
  and the `fetchJSON` error-body convention (`err.message` / `err.body?.code`)
  exactly as `PayBillModal.tsx` and `EditPaymentModal.tsx` do — no new modal
  idiom introduced.

## Verification

```
$ npm run typecheck 2>&1 | grep -iE "ViewBillV2|Refund"
(no output — clean)

$ npx vitest run 2>&1 | tail -5
 Test Files  3 failed | 20 passed (23)
      Tests  6 failed | 235 passed (241)
   Start at  20:16:01
   Duration  5.29s (transform 2.01s, setup 1.75s, collect 12.98s, tests 7.25s, environment 14.43s, prepare 1.80s)
```

The 3 failing files (`projects.contract.test.ts`,
`RecordBill.payBill.test.tsx`, `RecordBill.upcharge.test.tsx`) and 6 failing
tests are exactly the pre-existing baseline called out in the task brief
(the `TabProvider` harness issue) — unchanged by this work. Full typecheck
output was inspected (`/tmp/tc_full.txt`, 361 lines) and contains only
pre-existing errors in unrelated files (`TaskSummaryModals.tsx`,
`WorkOrderDetailsV2.tsx`, `VendorDetail.tsx`, `Vendors.tsx`,
`convertFiletoPdf.ts`, etc.) — nothing referencing `ViewBillV2` or
`RecordCardRefundModal`.

## Commit

See `git log -1` on `vendor-card-refund-ui` for the SHA of the commit this
report was included in.
