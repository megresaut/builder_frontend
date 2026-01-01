import { useState, useEffect } from "react";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { CurrencyField } from "@/components/forms";

interface EditPropertyRatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    monthlyRate?: string;
    defaultRate?: string;
    emergencyRate?: string;
  };
  onSave?: (data: {
    monthlyRate: string;
    defaultRate: string;
    emergencyRate: string;
  }) => void;
}

export default function EditPropertyRatesModal({
  open,
  onOpenChange,
  initialData,
  onSave,
}: EditPropertyRatesModalProps) {
  const [monthlyRate, setMonthlyRate] = useState("");
  const [defaultRate, setDefaultRate] = useState("");
  const [emergencyRate, setEmergencyRate] = useState("");

  useEffect(() => {
    if (!open) {
      setMonthlyRate("");
      setDefaultRate("");
      setEmergencyRate("");
    } else if (initialData) {
      setMonthlyRate(initialData.monthlyRate?.replace(/[^0-9.]/g, "") || "");
      setDefaultRate(initialData.defaultRate?.replace(/[^0-9.]/g, "") || "");
      setEmergencyRate(initialData.emergencyRate?.replace(/[^0-9.]/g, "") || "");
    }
  }, [open, initialData]);

  const handleSave = () => {
    const formatMonthly = (val: string) => {
      const num = parseFloat(val) || 0;
      return `$${num.toFixed(2)} / month`;
    };
    const formatHourly = (val: string) => {
      const num = parseFloat(val) || 0;
      return `$${num} / hour`;
    };

    onSave?.({
      monthlyRate: formatMonthly(monthlyRate),
      defaultRate: formatHourly(defaultRate),
      emergencyRate: formatHourly(emergencyRate),
    });
    onOpenChange(false);
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Rates"
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
          <CurrencyField
            label="Monthly Rate"
            value={monthlyRate}
            onChange={setMonthlyRate}
            placeholder="0.00"
          />
          <CurrencyField
            label="Default Rate"
            value={defaultRate}
            onChange={setDefaultRate}
            placeholder="0.00"
          />
          <CurrencyField
            label="Emergency Rate"
            value={emergencyRate}
            onChange={setEmergencyRate}
            placeholder="0.00"
          />
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
}
