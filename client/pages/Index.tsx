import React from "react";
import { AlertBanner } from "@/components/AlertBanner";
import { InvoiceTable } from "@/components/InvoiceTable";
import { InvoiceHistoryTable } from "@/components/InvoiceHistoryTable";

export const Index: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        width: "100%",
      }}
    >
      {/* Alert Banner */}
      <AlertBanner
        title="Unapproved Expenses "
        message="There Are Unapproved Field Team Expenses Outstanding. Please Review Before Invoicing Client."
        actionText="View"
      />

      {/* Invoice Table */}
      <InvoiceTable items={[]} propertyAddress="" />

      {/* Invoice History Table */}
      <InvoiceHistoryTable items={[]} />
    </div>
  );
};

export default Index;
