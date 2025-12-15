import React from "react";

interface BareLayoutProps {
  children?: React.ReactNode;
}

export default function BareLayout({ children }: BareLayoutProps) {
  return (
    <div className="w-full h-screen bg-white overflow-hidden">{children}</div>
  );
}
