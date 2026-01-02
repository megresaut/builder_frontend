import { useState, useEffect } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
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
    string | null
  >(null);
  const [inspectionFrequency, setInspectionFrequency] = useState("Monthly");

  useEffect(() => {
    if (open && initialData) {
      setManagementAgreementDate(initialData.managementAgreementDate || null);
      setInspectionFrequency(initialData.inspectionFrequency || "Monthly");
    }
  }, [open, initialData]);

  const handleSave = () => {
    onSave?.({
      managementAgreementDate: managementAgreementDate || "",
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
            onChange={(value) =>
              setManagementAgreementDate(
                typeof value === "string"
                  ? value
                  : value?.toISOString().split("T")[0] || null,
              )
            }
            returnFormat="ISO"
            placeholder="mm/dd/yyyy"
          />
          <SelectField
            label="Inspection Frequency"
            value={inspectionFrequency}
            onChange={(value) => setInspectionFrequency(value as string)}
            options={[
              { value: "Weekly", label: "Weekly" },
              { value: "Biweekly", label: "Biweekly" },
              { value: "Monthly", label: "Monthly" },
              { value: "Bi-Monthly", label: "Bi-Monthly" },
            ]}
            placeholder="Select frequency"
          />
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
}
