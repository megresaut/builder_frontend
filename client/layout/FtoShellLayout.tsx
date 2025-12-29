import React, { useEffect, useRef, useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

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

export default function FTOShellLayout() {
  const location = useLocation();
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(getFullscreenMode());
  const [forceCollapse, setForceCollapse] = useState(
    isModalLikePage(location.pathname),
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setIsFullscreen(getFullscreenMode());
    };

    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(() => {
      setIsFullscreen(getFullscreenMode());
    }, 100);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setForceCollapse(isModalLikePage(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar forceCollapse={forceCollapse} mode="fto" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header forceCollapse={forceCollapse} showTabs={false} />
        <div
          ref={mainContentRef}
          className="flex-1 overflow-auto bg-white"
          style={{
            paddingBottom: "150px",
            borderLeftWidth: "1px",
            borderLeftColor: "#d2d1cf",
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
