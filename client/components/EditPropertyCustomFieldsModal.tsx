import { useState, useEffect } from "react";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { DateField, SelectField } from "@/components/forms";

interface EditPropertyCustomFieldsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    managementAgreementDate?: string;
    inspectionFrequency?: string;
  };
  onSave?: (data: {
    managementAgreementDate: string;
    inspectionFrequency: string;
  }) => void;
}

export default function EditPropertyCustomFieldsModal({
  open,
  onOpenChange,
  initialData,
  onSave,
}: EditPropertyCustomFieldsModalProps) {
  const [managementAgreementDate, setManagementAgreementDate] = useState<
    Date | null
  >(null);
  const [inspectionFrequency, setInspectionFrequency] = useState("Monthly");

  useEffect(() => {
    if (!open) {
      setManagementAgreementDate(null);
      setInspectionFrequency("Monthly");
    } else if (initialData) {
      if (initialData.managementAgreementDate) {
        setManagementAgreementDate(
          new Date(initialData.managementAgreementDate)
        );
      }
      if (initialData.inspectionFrequency) {
        setInspectionFrequency(initialData.inspectionFrequency);
      }
    }
  }, [open, initialData]);

  const handleSave = () => {
    onSave?.({
      managementAgreementDate: managementAgreementDate
        ? managementAgreementDate.toISOString().split("T")[0]
        : "",
      inspectionFrequency,
    });
    onOpenChange(false);
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Custom Fields"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSave}
          cancelLabel="Cancel"
          confirmLabel="Save"
        />
      }
    >
      <FormLayout>
        <FormSection showDivider={false}>
          <DateField
            label="Management Agreement Date"
            value={managementAgreementDate}
            onChange={setManagementAgreementDate}
            placeholder="MM/DD/YYYY"
          />
          <SelectField
            label="Inspection Frequency"
            value={inspectionFrequency}
            onChange={setInspectionFrequency}
            options={[
              { value: "Weekly", label: "Weekly" },
              { value: "Biweekly", label: "Biweekly" },
              { value: "Monthly", label: "Monthly" },
              { value: "Bi-Monthly", label: "Bi-Monthly" },
            ]}
          />
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
}
