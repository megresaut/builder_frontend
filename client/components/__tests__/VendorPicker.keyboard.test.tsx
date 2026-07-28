/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";

// Keyboard navigation for the vendor list. Focus deliberately stays in the
// search box so typing keeps narrowing the results, which means the highlight
// can't be DOM focus — it's state, surfaced to assistive tech through
// aria-activedescendant. These tests pin arrow/Home/End/Enter against that.

vi.mock("@/api/fetchJSON", () => ({
  fetchJSON: vi.fn(),
  authFetch: vi.fn(),
  API_BASE: "http://localhost:8080",
}));

import { fetchJSON } from "@/api/fetchJSON";
import { VendorPicker } from "../VendorPicker";

const mockFetch = fetchJSON as unknown as ReturnType<typeof vi.fn>;

// The screenshot case: searching "frank" returns a handful of near-identical names.
const FRANKS = [
  { id: 1, name: "Frank Clark Electric LLC" },
  { id: 2, name: "Frank Keller" },
  { id: 3, name: "Frank Sorge" },
  { id: 4, name: "Frank Talarico & Son Inc" },
];

/** Open the picker, type `term`, and wait for the results to land. */
async function openAndSearch(term: string, onChange = vi.fn()) {
  render(<VendorPicker value="" onChange={onChange} placeholder="No vendor" />);
  fireEvent.click(screen.getByRole("button", { name: /no vendor/i }));
  const input = await screen.findByPlaceholderText(/type to search/i);
  fireEvent.change(input, { target: { value: term } });
  await waitFor(() => expect(screen.getByText(FRANKS[0].name)).toBeInTheDocument());
  return { input, onChange };
}

/** The option currently armed for Enter, per aria-activedescendant. */
function activeOptionText(input: HTMLElement): string | null {
  const id = input.getAttribute("aria-activedescendant");
  return id ? document.getElementById(id)?.textContent?.trim() ?? null : null;
}

describe("VendorPicker — arrow-key navigation", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(FRANKS);
  });

  it("arms the top hit once a search term is typed", async () => {
    const { input } = await openAndSearch("frank");
    expect(activeOptionText(input)).toBe("Frank Clark Electric LLC");
  });

  it("walks down the list with ArrowDown", async () => {
    const { input } = await openAndSearch("frank");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(activeOptionText(input)).toBe("Frank Keller");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(activeOptionText(input)).toBe("Frank Sorge");
  });

  it("walks back up with ArrowUp", async () => {
    const { input } = await openAndSearch("frank");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(activeOptionText(input)).toBe("Frank Keller");
  });

  it("stops at both ends instead of wrapping", async () => {
    const { input } = await openAndSearch("frank");

    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(activeOptionText(input)).toBe("Frank Clark Electric LLC");

    for (let i = 0; i < 10; i++) fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(activeOptionText(input)).toBe("Frank Talarico & Son Inc");
  });

  it("jumps to the first and last hit with Home and End", async () => {
    const { input } = await openAndSearch("frank");

    fireEvent.keyDown(input, { key: "End" });
    expect(activeOptionText(input)).toBe("Frank Talarico & Son Inc");

    fireEvent.keyDown(input, { key: "Home" });
    expect(activeOptionText(input)).toBe("Frank Clark Electric LLC");
  });

  it("picks the highlighted vendor on Enter", async () => {
    const { input, onChange } = await openAndSearch("frank");
    fireEvent.keyDown(input, { key: "ArrowDown" });

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(2, "Frank Keller");
  });

  it("closes the list once Enter picks a vendor", async () => {
    const { input } = await openAndSearch("frank");
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() =>
      expect(screen.queryByPlaceholderText(/type to search/i)).not.toBeInTheDocument(),
    );
  });

  it("marks the highlighted row with aria-activedescendant, not DOM focus", async () => {
    const { input } = await openAndSearch("frank");
    fireEvent.keyDown(input, { key: "ArrowDown" });

    // Typing must keep working, so focus stays put.
    expect(document.activeElement).toBe(input);
  });

  it("arms nothing before a term is typed, so a stray Enter can't pick a vendor", async () => {
    const onChange = vi.fn();
    render(<VendorPicker value="" onChange={onChange} placeholder="No vendor" />);
    fireEvent.click(screen.getByRole("button", { name: /no vendor/i }));
    const input = await screen.findByPlaceholderText(/type to search/i);
    await waitFor(() => expect(screen.getByText(FRANKS[0].name)).toBeInTheDocument());

    expect(input).not.toHaveAttribute("aria-activedescendant");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();

    // …but one ArrowDown arms the top row.
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(activeOptionText(input)).toBe("Frank Clark Electric LLC");
  });

  it("re-arms the top hit when the term changes, never a stale row", async () => {
    const { input } = await openAndSearch("frank");
    fireEvent.keyDown(input, { key: "End" }); // sit on hit #4

    mockFetch.mockResolvedValue([{ id: 9, name: "Frankel & Berg" }]);
    fireEvent.change(input, { target: { value: "frankel" } });
    await waitFor(() => expect(screen.getByText("Frankel & Berg")).toBeInTheDocument());

    // Index 3 no longer exists — the highlight must not point past the end.
    expect(activeOptionText(input)).toBe("Frankel & Berg");
  });

  it("does not move the caret when arrowing (ArrowDown is claimed by the list)", async () => {
    const { input } = await openAndSearch("frank");
    const evt = fireEvent.keyDown(input, { key: "ArrowDown" });
    // fireEvent returns false when a handler called preventDefault().
    expect(evt).toBe(false);
  });
});
