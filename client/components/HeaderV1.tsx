import React from "react";
import PageHeader from "@/components/PageHeader";

interface HeaderV1Props {
  title: string;
  subtitle: string;
  actionLabel: string;
  actionIcon: React.ReactNode;
  onActionClick: () => void;
  children?: React.ReactNode;
}

/**
 * HeaderV1 - Reusable page header template with PageHeader component
 *
 * Provides consistent layout for pages with title, subtitle, and primary action button
 */
export const HeaderV1: React.FC<HeaderV1Props> = ({
  title,
  subtitle,
  actionLabel,
  actionIcon,
  onActionClick,
  children,
}) => {
  return (
    <div className="flex flex-col gap-6 w-fit min-w-full">
      {/* Header with title, subtitle, and action button */}
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={{
          label: actionLabel,
          onClick: onActionClick,
          icon: actionIcon,
        }}
      />

      {/* Content section */}
      <div className="flex flex-col gap-6">
        {children}
      </div>
    </div>
  );
};

HeaderV1.displayName = "HeaderV1";

export default HeaderV1;
