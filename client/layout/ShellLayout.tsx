import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useTabContext } from "@/hooks/useTabContext";

interface ShellLayoutProps {
  children?: React.ReactNode;
}

export default function ShellLayout({ children }: ShellLayoutProps) {
  const location = useLocation();
  const { tabMetadata, setTabMetadata } = useTabContext();
  const mainContentRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

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

  // Save scroll position when scrolling
  useEffect(() => {
    const mainContent = mainContentRef.current;
    if (!mainContent) return;

    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        const scrollPos = mainContent.scrollTop;
        setTabMetadata(currentTabId, {
          ...currentMetadata,
          scrollPosition: scrollPos,
        });
      }, 100); // Debounce scroll updates
    };

    mainContent.addEventListener("scroll", handleScroll);
    return () => {
      mainContent.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [currentTabId, currentMetadata, setTabMetadata]);

  // Restore scroll position when tab changes
  useEffect(() => {
    const mainContent = mainContentRef.current;
    if (!mainContent) return;

    const scrollPos = currentMetadata?.scrollPosition ?? 0;
    mainContent.scrollTop = scrollPos;
  }, [currentTabId, currentMetadata?.scrollPosition]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
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
