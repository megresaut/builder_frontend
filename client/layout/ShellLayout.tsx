import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useTabContext } from "@/hooks/useTabContext";

const FULLSCREEN_KEY = "app-fullscreen-mode";
const getFullscreenMode = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(FULLSCREEN_KEY) === "true";
  }
  return false;
};

interface ShellLayoutProps {
  children?: React.ReactNode;
}

export default function ShellLayout({ children }: ShellLayoutProps) {
  const location = useLocation();
  const { tabMetadata, setTabMetadata } = useTabContext();
  const mainContentRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const lastTabIdRef = useRef<string>();
  const [isFullscreen, setIsFullscreen] = useState(getFullscreenMode());

  // Listen for fullscreen mode changes
  useEffect(() => {
    const handleStorageChange = () => {
      setIsFullscreen(getFullscreenMode());
    };

    window.addEventListener("storage", handleStorageChange);
    // Also check periodically in case storage was updated in the same tab
    const interval = setInterval(() => {
      setIsFullscreen(getFullscreenMode());
    }, 100);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Get the current tab ID based on the route
  const getCurrentTabId = (): string => {
    const path = location.pathname;

    if (path.includes("/tasks/")) {
      const match = path.match(/\/tasks\/(\d+)/);
      if (match) return `task-${match[1]}`;
    }

    if (path.includes("/property/")) {
      const match = path.match(/\/property\/(\d+)(?:\/(\w+))?/);
      if (match) {
        const propertyId = match[1];
        const tab = match[2];
        return tab ? `property-${propertyId}-${tab}` : `property-${propertyId}`;
      }
    }

    return path;
  };

  const currentTabId = getCurrentTabId();
  const currentMetadata = tabMetadata[currentTabId];

  // Save scroll position immediately when leaving a tab
  useEffect(() => {
    const prevTabId = lastTabIdRef.current;
    if (prevTabId && prevTabId !== currentTabId) {
      const mainContent = mainContentRef.current;
      if (mainContent) {
        // Save scroll position for the previous tab immediately
        const prevMetadata = tabMetadata[prevTabId];
        setTabMetadata(prevTabId, {
          ...prevMetadata,
          scrollPosition: mainContent.scrollTop,
        });
      }
    }
    lastTabIdRef.current = currentTabId;
  }, [currentTabId, tabMetadata, setTabMetadata]);

  // Save scroll position when scrolling (debounced)
  useEffect(() => {
    const mainContent = mainContentRef.current;
    if (!mainContent) return;

    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        const scrollPos = mainContent.scrollTop;
        const prevMetadata = tabMetadata[currentTabId] || {};
        setTabMetadata(currentTabId, {
          ...prevMetadata,
          scrollPosition: scrollPos,
        });
      }, 200); // Debounce scroll updates
    };

    mainContent.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      mainContent.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [currentTabId, setTabMetadata]);

  // Restore scroll position when tab changes or metadata updates
  useEffect(() => {
    const mainContent = mainContentRef.current;
    if (!mainContent) return;

    const scrollPos = currentMetadata?.scrollPosition ?? 0;
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      mainContent.scrollTop = scrollPos;
    });
  }, [currentTabId]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {!isFullscreen && <Header />}
        <div
          ref={mainContentRef}
          data-testid="main-content"
          className="flex-1 overflow-auto bg-white"
        >
          {children}
        </div>
      </main>
    </div>
  );
}
