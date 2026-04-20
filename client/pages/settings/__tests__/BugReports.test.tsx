/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BugReports from "../BugReports";

vi.mock("@/data/bugs", async () => {
  const BUG_MODULES = ["properties", "tasks", "vendors"] as const;
  const BUG_STATUSES = ["open", "in_progress", "resolved"] as const;
  const BUG_SEVERITIES = ["low", "medium", "high"] as const;
  return {
    listBugs: vi.fn(() => Promise.resolve([])),
    BUG_MODULES,
    BUG_STATUSES,
    BUG_SEVERITIES,
  };
});

vi.mock("@/auth/useAuth", () => ({
  useAuth: () => ({
    token: "test-token",
    role: "admin",
    userId: 1,
    loading: false,
    isAuthenticated: true,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/bugs/ReportBugModal", () => ({
  default: () => null,
}));

function renderBugReports() {
  return render(
    <MemoryRouter initialEntries={["/settings/bugs"]}>
      <BugReports />
    </MemoryRouter>
  );
}

describe("BugReports page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the search input with the correctly spelled 'title' placeholder", async () => {
    renderBugReports();

    const input = await waitFor(() =>
      screen.getByPlaceholderText(/Search bug title/i)
    );
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "Search bug title…");
  });

  it("does not contain the 'titel' misspelling in the search placeholder", async () => {
    renderBugReports();

    await waitFor(() =>
      expect(screen.getByPlaceholderText(/Search bug title/i)).toBeInTheDocument()
    );

    expect(screen.queryByPlaceholderText(/titel/i)).not.toBeInTheDocument();
  });
});
