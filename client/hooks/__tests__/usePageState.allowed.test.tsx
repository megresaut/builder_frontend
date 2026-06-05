/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCallback, useState } from "react";
import { TabContext, TabMetadata } from "@/hooks/useTabContext";
import { usePageState } from "@/hooks/usePageState";

// Minimal real provider mirroring App.tsx's deep-merge setTabMetadata so the
// hook runs against actual React state (not a no-op store).
function makeWrapper(seed: Record<string, TabMetadata>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    const [tabMetadata, setTabMetadataState] = useState(seed);
    const setTabMetadata = useCallback((tabId: string, metadata: Partial<TabMetadata>) => {
      setTabMetadataState((prev) => {
        const existing = prev[tabId] || { label: "" };
        return {
          ...prev,
          [tabId]: {
            ...existing,
            ...metadata,
            pageState: { ...(existing.pageState || {}), ...(metadata.pageState || {}) },
          },
        };
      });
    }, []);
    const value = {
      selectedTab: "field-team-orders",
      setSelectedTab: () => {},
      tabMetadata,
      setTabMetadata,
      tabs: [],
      setTabs: () => {},
      openTabs: [],
      setOpenTabs: () => {},
      nextNewTabId: 0,
      setNextNewTabId: () => {},
    } as any;
    return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
  };
}

describe("usePageState — allowed whitelist (tab-default robustness)", () => {
  it("falls back to initialValue when the persisted value is not in `allowed`", () => {
    // Regression for the blank-tab bug: a stale/garbage persisted tab value
    // (here "") must not be honored — the page should default to its first tab.
    const wrapper = makeWrapper({
      "field-team-orders": {
        label: "Field Team Orders",
        pageState: { selectedTab: "" },
      },
    });
    const { result } = renderHook(
      () => usePageState<"ftos" | "misc">("selectedTab", "ftos", { allowed: ["ftos", "misc"] }),
      { wrapper },
    );
    expect(result.current[0]).toBe("ftos");
  });

  it("honors a persisted value that IS in `allowed`", () => {
    const wrapper = makeWrapper({
      "field-team-orders": {
        label: "Field Team Orders",
        pageState: { selectedTab: "misc" },
      },
    });
    const { result } = renderHook(
      () => usePageState<"ftos" | "misc">("selectedTab", "ftos", { allowed: ["ftos", "misc"] }),
      { wrapper },
    );
    expect(result.current[0]).toBe("misc");
  });

  it("without `allowed`, a defined falsy value is still honored (no behavior change for existing callers)", () => {
    const wrapper = makeWrapper({
      "field-team-orders": {
        label: "Field Team Orders",
        pageState: { searchValue: "" },
      },
    });
    const { result } = renderHook(
      () => usePageState<string>("searchValue", "fallback"),
      { wrapper },
    );
    // "" is a legitimate stored value for free-text keys → must be preserved.
    expect(result.current[0]).toBe("");
  });

  it("setter still round-trips a valid value", () => {
    const wrapper = makeWrapper({
      "field-team-orders": { label: "Field Team Orders" },
    });
    const { result } = renderHook(
      () => usePageState<"ftos" | "misc">("selectedTab", "ftos", { allowed: ["ftos", "misc"] }),
      { wrapper },
    );
    expect(result.current[0]).toBe("ftos");
    act(() => result.current[1]("misc"));
    expect(result.current[0]).toBe("misc");
  });
});
