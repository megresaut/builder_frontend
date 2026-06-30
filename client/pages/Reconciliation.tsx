import PageTemplate from "@/layout/PageTemplate";
import CreditCardReconciliation from "@/pages/CreditCardReconciliation";

export default function Reconciliation() {
  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full">
        <CreditCardReconciliation />
      </div>
    </PageTemplate>
  );
}
