import { useCallback, useEffect, useState } from "react";

export type NavLayoutMode = "side" | "top";

const NAV_LAYOUT_MODE_KEY = "nav-layout-mode";
const NAV_LAYOUT_MODE_EVENT = "nav-layout-mode-change";

const readNavLayoutMode = (): NavLayoutMode => {
  if (typeof window === "undefined") return "side";
  return localStorage.getItem(NAV_LAYOUT_MODE_KEY) === "top" ? "top" : "side";
};

/**
 * Shared, localStorage-backed toggle between the left sidebar and a
 * horizontal top nav. The custom event keeps every mounted consumer
 * (Sidebar, TopNav, ShellLayout) in sync within the same tab; `storage`
 * covers other tabs.
 */
export function useNavLayoutMode(): [NavLayoutMode, (mode: NavLayoutMode) => void] {
  const [mode, setMode] = useState<NavLayoutMode>(readNavLayoutMode);

  useEffect(() => {
    const handleChange = () => setMode(readNavLayoutMode());
    window.addEventListener("storage", handleChange);
    window.addEventListener(NAV_LAYOUT_MODE_EVENT, handleChange);
    return () => {
      window.removeEventListener("storage", handleChange);
      window.removeEventListener(NAV_LAYOUT_MODE_EVENT, handleChange);
    };
  }, []);

  const updateMode = useCallback((next: NavLayoutMode) => {
    localStorage.setItem(NAV_LAYOUT_MODE_KEY, next);
    setMode(next);
    window.dispatchEvent(new Event(NAV_LAYOUT_MODE_EVENT));
  }, []);

  return [mode, updateMode];
}
