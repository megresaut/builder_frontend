import PageTemplate from "@/layout/PageTemplate";
import { PageHeader } from "@/components/BillsPageHeader";
import CreditCardReconciliation from "@/pages/CreditCardReconciliation";

// Reconciliation is now solely credit-card reconciliation. The former
// cross-platform (Platform vs QBO vs Buildium) comparison tab was removed;
// this page is a thin chrome wrapper around the CC reconciliation workspace.
export default function Reconciliation() {
  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full">
        <PageHeader
          title="Reconciliation"
          description="Pre-flight and finalize QBO credit-card reconciliations."
        />
        <CreditCardReconciliation />
      </div>
    </PageTemplate>
  );
}
