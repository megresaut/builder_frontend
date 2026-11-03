/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen, act } from "@testing-library/react";
import { useState } from "react";
import { flushSync } from "react-dom";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { TabContext } from "@/hooks/useTabContext";
import { RecordBill, recordBillFormDrafts } from "../RecordBill";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/api/fetchJSON", () => ({
  fetchJSON: vi.fn(() => Promise.resolve([])),
  authFetch: vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: "OK",
      blob: () => Promise.resolve(new Blob([], { type: "application/pdf" })),
    } as unknown as Response),
  ),
  API_BASE: "http://localhost:8080",
}));

vi.mock("@/data/chartOfAccounts", () => ({
  fetchChartOfAccounts: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/utils/convertFiletoPdf", () => ({
  convertFiletoPdf: vi.fn(() => Promise.resolve(new File([], "stub.pdf"))),
}));

vi.mock("@/utils/parseMsgFile", () => ({
  parseMsgFile: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/utils/parseEmlFile", () => ({
  parseEmlFile: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/components/MsgViewerModal", () => ({
  default: () => null,
}));

vi.mock("@/components/AddVendorModal", () => ({
  default: () => null,
}));

vi.mock("@/components/PayBillModal", () => ({
  default: () => null,
}));

vi.mock("@/components/ViewPaymentModal", () => ({
  default: () => null,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));


// ---------------------------------------------------------------------------
// Harness: two RA tabs sharing one router, switched the way Header does it
// (commit selectedTab with flushSync, then navigate to the tab's route).
// ---------------------------------------------------------------------------

const ROUTES: Record<string, string> = {
  a: "/bills/record",
  b: "/vendors",
};

function Controls({ setSelectedTab }: { setSelectedTab: (id: string) => void }) {
  const navigate = useNavigate();
  const switchTo = (id: string) => {
    flushSync(() => setSelectedTab(id));
    navigate(ROUTES[id], { replace: true });
  };
  return (
    <>
      <button onClick={() => switchTo("a")}>tab-a</button>
      <button onClick={() => switchTo("b")}>tab-b</button>
      <button onClick={() => navigate("/vendors")}>in-tab-nav</button>
      <button onClick={() => navigate("/bills/record")}>in-tab-record</button>
    </>
  );
}

function Harness() {
  const [selectedTab, setSelectedTab] = useState("a");
  const value = {
    selectedTab,
    setSelectedTab,
    tabMetadata: {},
    setTabMetadata: () => {},
    tabs: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ],
    setTabs: () => {},
    openTabs: new Set(["a", "b"]),
    setOpenTabs: () => {},
    nextNewTabId: 1,
    setNextNewTabId: () => {},
  };
  return (
    <TabContext.Provider value={value}>
      <MemoryRouter initialEntries={[ROUTES.a]}>
        <Controls setSelectedTab={setSelectedTab} />
        <Routes>
          <Route path="/bills/record" element={<RecordBill />} />
          <Route path="/vendors" element={<div>vendors page</div>} />
        </Routes>
      </MemoryRouter>
    </TabContext.Provider>
  );
}

const refInput = () =>
  screen.getByPlaceholderText("INV-2024-001") as HTMLInputElement;
const memoValue = () => refInput().value;

async function click(name: string) {
  await act(async () => {
    fireEvent.click(screen.getByText(name));
  });
}

describe("RecordBill — keeps entered data across RA tab switches", () => {
  beforeEach(() => recordBillFormDrafts.clear());

  it("restores the form after switching to another tab and back", async () => {
    render(<Harness />);
    fireEvent.change(refInput(), { target: { value: "INV-777" } });
    expect(memoValue()).toBe("INV-777");

    await click("tab-b");
    expect(screen.getByText("vendors page")).toBeInTheDocument();

    await click("tab-a");
    expect(memoValue()).toBe("INV-777");
  });

  it("starts blank after leaving Record Bill within the same tab", async () => {
    render(<Harness />);
    fireEvent.change(refInput(), { target: { value: "INV-777" } });

    await click("in-tab-nav");
    await click("in-tab-record");
    expect(memoValue()).toBe("");
    expect(recordBillFormDrafts.size).toBe(0);
  });
});
