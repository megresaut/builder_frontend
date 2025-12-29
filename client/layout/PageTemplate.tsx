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
      className={`flex flex-col px-6 pt-9 pb-8 bg-white lg:min-w-[1200px] ${className}`}
    >
      {children}
    </div>
  );
};

export default PageTemplate;
