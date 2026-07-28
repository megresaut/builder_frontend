/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { VendorPicker } from "../VendorPicker";

// The bug this component exists to prevent: pickers that fetched a fixed slice
// of /vendors (200 / 500 / 1000) and filtered client-side hid every vendor past
// the cut-off — with ~2.5k active vendors, everything from "Gu…" to "Z" was
// unreachable. These tests pin the server-side search + paging contract.

vi.mock("@/api/fetchJSON", () => ({
  fetchJSON: vi.fn(),
  authFetch: vi.fn(),
  API_BASE: "http://localhost:8080",
}));

import { fetchJSON } from "@/api/fetchJSON";

const mockFetch = fetchJSON as unknown as ReturnType<typeof vi.fn>;

/** A full page (50) of synthetic vendors starting at `start`. */
function page(start: number, count = 50) {
  return Array.from({ length: count }, (_, i) => ({
    id: start + i,
    name: `Vendor ${String(start + i).padStart(4, "0")}`,
  }));
}

/** URLs the component requested, in order. */
function requestedUrls(): string[] {
  return mockFetch.mock.calls.map((c) => String(c[0]));
}

describe("VendorPicker", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(page(1));
  });

  it("does not hit the API until the dropdown is opened", () => {
    render(<VendorPicker value="" onChange={() => {}} />);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("requests a bounded first page (not the whole table) on open", async () => {
    render(<VendorPicker value="" onChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /select a vendor/i }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(requestedUrls()[0]).toBe("/vendors?limit=50");
  });

  it("pushes the search term to the server instead of filtering locally", async () => {
    render(<VendorPicker value="" onChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /select a vendor/i }));
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/type to search/i), {
      target: { value: "zephyr" },
    });

    await waitFor(() =>
      expect(requestedUrls()).toContain("/vendors?limit=50&search=zephyr"),
    );
  });

  it("pages in the next 50 when the list is scrolled to the bottom", async () => {
    render(<VendorPicker value="" onChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /select a vendor/i }));
    await waitFor(() => expect(screen.getByText("Vendor 0001")).toBeInTheDocument());

    mockFetch.mockResolvedValue(page(51));
    const list = screen.getByText("Vendor 0001").closest("div[class*='overflow-y-auto']")!;
    Object.defineProperty(list, "scrollHeight", { value: 1600, configurable: true });
    Object.defineProperty(list, "clientHeight", { value: 240, configurable: true });
    Object.defineProperty(list, "scrollTop", { value: 1360, configurable: true });
    fireEvent.scroll(list);

    await waitFor(() =>
      expect(requestedUrls()).toContain("/vendors?limit=50&offset=50"),
    );
    // Both pages stay in the list — page 2 appends, it doesn't replace.
    await waitFor(() => expect(screen.getByText("Vendor 0051")).toBeInTheDocument());
    expect(screen.getByText("Vendor 0001")).toBeInTheDocument();
  });

  it("reports the picked vendor's id and name", async () => {
    const onChange = vi.fn();
    render(<VendorPicker value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /select a vendor/i }));
    await waitFor(() => expect(screen.getByText("Vendor 0003")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Vendor 0003"));
    expect(onChange).toHaveBeenCalledWith(3, "Vendor 0003");
  });

  it("keeps options out of the tab order — arrows drive the list, not Tab", async () => {
    render(<VendorPicker value="" onChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /select a vendor/i }));
    await waitFor(() => expect(screen.getByText("Vendor 0001")).toBeInTheDocument());

    // Queried by attribute, not getAllByRole: Radix's popper keeps its content
    // `visibility: hidden` until it has measured a position, which jsdom (no
    // layout engine) never provides — so the whole popover is invisible to
    // role-based queries here, though not in a real browser.
    const options = document.querySelectorAll('[role="option"]');
    expect(options.length).toBe(50);
    for (const opt of options) expect(opt).toHaveAttribute("tabindex", "-1");
  });

  it("resolves the label of a preselected vendor outside the first page", async () => {
    mockFetch.mockImplementation((url: string) =>
      url === "/vendors/2400"
        ? Promise.resolve({ id: 2400, name: "Zephyr Mechanical" })
        : Promise.resolve(page(1)),
    );

    render(<VendorPicker value={2400} onChange={() => {}} />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /zephyr mechanical/i })).toBeInTheDocument(),
    );
  });
});
