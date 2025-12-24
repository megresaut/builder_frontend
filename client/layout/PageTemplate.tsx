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
      className={`flex flex-col px-6 pt-9 pb-8 bg-white ${className}`}
      style={{ minWidth: "1200px" }}
    >
      {children}
    </div>
  );
};

export default PageTemplate;
