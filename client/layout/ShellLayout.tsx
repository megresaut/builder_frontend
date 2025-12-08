import React from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

interface ShellLayoutProps {
  children?: React.ReactNode;
}

export default function ShellLayout({ children }: ShellLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div
          data-testid="main-content"
          className="flex-1 overflow-auto bg-white"
        >
          {children}
        </div>
      </main>
    </div>
  );
}
