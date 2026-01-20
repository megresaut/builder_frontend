import React from "react";

interface PageTemplateProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTemplate: React.FC<PageTemplateProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col px-4 pt-6 pb-12 bg-white sm:px-6 sm:pt-8 lg:px-6 lg:pt-9 lg:min-w-[1200px] overflow-y-auto max-h-screen ${className}`}
    >
      {children}
    </div>
  );
};

export default PageTemplate;
