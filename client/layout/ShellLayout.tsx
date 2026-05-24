import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useTabContext } from "@/hooks/useTabContext";
import { PropertyBreadcrumbProvider } from "@/hooks/PropertyBreadcrumbContext";

const FULLSCREEN_KEY = "app-fullscreen-mode";

const getFullscreenMode = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(FULLSCREEN_KEY) === "true";
  }
  return false;
};

const isModalLikePage = (pathname: string): boolean => {
  return pathname.includes("/bills/record") || pathname === "/utilities/view-bill";
};

interface ShellLayoutProps {
  children?: React.ReactNode;
}

/**
 * Scroll persistence:
 *   - Keyed by (selectedTab, pathname+search).
 *   - Stored in tabMetadata.pageState under the reserved key `__scroll`.
 *   - Saved debounced (200ms) on scroll, and immediately on tab/route change.
 *   - Restored on (tab change OR pathname change); default 0 if no value.
 *
 * The old implementation had TWO competing effects — one that reset scrollTop
 * to 0 on every pathname change and one that restored saved scroll on tab
 * change. They could both fire on the same render, with non-deterministic
 * winner. Manifested as "sometimes remembers, sometimes doesn't."
 */
const SCROLL_KEY_PREFIX = "__scroll:";

export default function ShellLayout({ children }: ShellLayoutProps) {
  const location = useLocation();
  const { selectedTab, tabMetadata, setTabMetadata } = useTabContext();
  const mainContentRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const [isFullscreen, setIsFullscreen] = useState(getFullscreenMode());
  const [forceCollapse, setForceCollapse] = useState(isModalLikePage(location.pathname));

  // Listen for fullscreen mode changes
  useEffect(() => {
    const handleStorageChange = () => {
      setIsFullscreen(getFullscreenMode());
    };
    window.addEventListener("storage", handleStorageChange);
    // Periodic check in case storage was updated in this tab (browser tab, not app tab)
    const interval = setInterval(() => {
      setIsFullscreen(getFullscreenMode());
    }, 100);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Detect modal-like pages and collapse the sidebar.
  useEffect(() => {
    setForceCollapse(isModalLikePage(location.pathname));
  }, [location.pathname]);

  const scrollKey = `${SCROLL_KEY_PREFIX}${location.pathname}${location.search}`;
  const savedScroll = (tabMetadata[selectedTab]?.pageState?.[scrollKey] as number | undefined) ?? 0;

  // Refs to avoid effect re-runs on every metadata write.
  const scrollKeyRef = useRef(scrollKey);
  scrollKeyRef.current = scrollKey;
  const selectedTabRef = useRef(selectedTab);
  selectedTabRef.current = selectedTab;

  // Save scroll position on scroll (debounced 200ms).
  useEffect(() => {
    const main = mainContentRef.current;
    if (!main) return;
    const handler = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        const top = main.scrollTop;
        setTabMetadata(selectedTabRef.current, { pageState: { [scrollKeyRef.current]: top } });
      }, 200);
    };
    main.addEventListener("scroll", handler, { passive: true });
    return () => {
      main.removeEventListener("scroll", handler);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [setTabMetadata]);

  // Restore scroll position when (tab OR URL) changes.
  useEffect(() => {
    const main = mainContentRef.current;
    if (!main) return;
    // requestAnimationFrame so the layout has actually rendered before we jump.
    const raf = requestAnimationFrame(() => {
      main.scrollTop = savedScroll;
    });
    return () => cancelAnimationFrame(raf);
  }, [scrollKey, selectedTab, savedScroll]);

  return (
    <PropertyBreadcrumbProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar forceCollapse={forceCollapse} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header forceCollapse={forceCollapse} />
          <div
            ref={mainContentRef}
            data-testid="main-content"
            className="flex-1 overflow-auto bg-white flex flex-col"
            style={{ borderLeftWidth: "1px", borderLeftColor: "#d2d1cf" }}
          >
            <div className="flex-1">{children}</div>
          </div>
        </main>
      </div>
    </PropertyBreadcrumbProvider>
  );
}
