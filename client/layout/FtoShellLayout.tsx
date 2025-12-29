import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import FtoTopNav from "@/components/FtoTopNav";

const FULLSCREEN_KEY = "app-fullscreen-mode";

const getFullscreenMode = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(FULLSCREEN_KEY) === "true";
  }
  return false;
};

const isModalLikePage = (pathname: string): boolean => {
  return (
    pathname.includes("/fto/record") ||
    pathname.includes("/fto/submission") ||
    pathname === "/utilities/view-bill"
  );
};

interface FtoShellLayoutProps {
  children?: React.ReactNode;
}

export default function FtoShellLayout({ children }: FtoShellLayoutProps) {
  const location = useLocation();
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(getFullscreenMode());
  const [forceCollapse, setForceCollapse] = useState(
    isModalLikePage(location.pathname),
  );

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

  // Detect modal-like pages and manage collapse state
  useEffect(() => {
    const isModal = isModalLikePage(location.pathname);
    setForceCollapse(isModal);
  }, [location.pathname]);

  // Reset scroll to top on route change
  useEffect(() => {
    const mainContent = mainContentRef.current;
    if (!mainContent) return;

    mainContent.scrollTop = 0;
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <FtoTopNav />
      <main className="flex-1 overflow-auto bg-white">
        <div
          ref={mainContentRef}
          data-testid="main-content"
          className="h-full"
          style={{ paddingBottom: "150px" }}
        >
          <div key={location.pathname}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
