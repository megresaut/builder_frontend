/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/api/fetchJSON", () => ({
  fetchJSON: vi.fn().mockResolvedValue([]),
  authFetch: vi.fn(),
  API_BASE: "http://localhost:8080",
}));

vi.mock("react-router-dom", () => ({
  useParams: () => ({ id: "1" }),
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/hooks/PropertyBreadcrumbContext", () => ({
  usePropertyBreadcrumb: () => ({ setPropertyName: vi.fn() }),
}));

vi.mock("@/layout/PageTemplate", () => ({
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

import { ProjectInvoiceDetailModal } from "../ProjectDetail";
import type { ProjectInvoice } from "@/data/projects";

// Base fixture for a sent invoice. paid_cents is overridden per test — it is
// the single field that drives the Edit/Delete disabled+tooltip gate
// (canMutate = paid_cents === 0), mirroring the server-side rule exactly.
function makeInvoice(paidCents: number): ProjectInvoice {
  return {
    id: 4,
    project_id: 1,
    invoice_number: "PI-1-004",
    status: "sent",
    title: "Foundation — phase 2",
    issue_date: "2026-07-01",
    due_date: null,
    paid_cents: paidCents,
    total_amount_cents: 150000,
    qbo_push_status: null,
    sent_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    client_email: null,
    lines: [],
    payments: [],
  } as unknown as ProjectInvoice;
}

const noop = () => {};
const noopAsync = async () => {};

// Spread from `any` deliberately: this file exercises only the Edit/Delete
// gate, which is independent of the modal's send/email plumbing. Passing
// props via a typed spread (rather than listing them as JSX attributes)
// keeps this test decoupled from that unrelated, still-evolving prop surface.
function detailProps(paidCents: number) {
  return {
    invoice: makeInvoice(paidCents),
    onSend: noop,
    onRecordPayment: noop,
    onVoid: noop,
    onVoidPayment: noopAsync,
    onEdit: noop,
    onDelete: noop,
    onClose: noop,
  } as any;
}

describe("ProjectInvoiceDetailModal — Edit/Delete discoverability gate", () => {
  it("disables Edit and Delete with the void-payment tooltip when paid_cents > 0", () => {
    render(<ProjectInvoiceDetailModal {...detailProps(50000)} />);
    const editButton = screen.getByRole("button", { name: "Edit" });
    const deleteButton = screen.getByRole("button", { name: "Delete" });
    expect(editButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
    expect(editButton).toHaveAttribute("title", "Void the recorded payment first");
    expect(deleteButton).toHaveAttribute("title", "Void the recorded payment first");
  });

  it("enables Edit and Delete when paid_cents is 0", () => {
    render(<ProjectInvoiceDetailModal {...detailProps(0)} />);
    const editButton = screen.getByRole("button", { name: "Edit" });
    const deleteButton = screen.getByRole("button", { name: "Delete" });
    expect(editButton).not.toBeDisabled();
    expect(deleteButton).not.toBeDisabled();
    expect(editButton).not.toHaveAttribute("title");
    expect(deleteButton).not.toHaveAttribute("title");
  });
});
