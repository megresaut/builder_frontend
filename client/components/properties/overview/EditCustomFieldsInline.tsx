import { useState, useEffect } from "react";
import {
  CompactDateField,
  CompactSelectField,
} from "@/components/forms/compact";

export interface EditCustomFieldsInlineProps {
  initialData: {
    managementAgreementDate?: string;
    inspectionFrequency?: string;
  };
  managementAgreementDate?: string;
  inspectionFrequency?: string;
  onManagementAgreementDateChange?: (value: string | null) => void;
  onInspectionFrequencyChange?: (value: string) => void;
}

/**
 * EditCustomFieldsInline - Inline edit form for custom fields
 *
 * Renders editable fields without modal wrapper.
 * Uses compact form field variants (32px height, 6px padding).
 * Manages local form state for the edit session.
 *
 * Features:
 * - Compact field styling (32px height, 6px padding)
 * - Custom spacing: 16px between sections, 12px between fields, 4px label gap
 * - Two sections: Agreement and Vendor Agreement
 * - NO ModalTemplate wrapper (stays inline within InlineEditWrapper)
 *
 * @param initialData - Pre-populated field values
 * @param managementAgreementDate - Controlled value
 * @param inspectionFrequency - Controlled value
 * @param onManagementAgreementDateChange - Change handler for date
 * @param onInspectionFrequencyChange - Change handler for frequency
 */
export const EditCustomFieldsInline: React.FC<
  EditCustomFieldsInlineProps
> = ({
  initialData,
  managementAgreementDate,
  inspectionFrequency,
  onManagementAgreementDateChange,
  onInspectionFrequencyChange,
}) => {
  const [localDate, setLocalDate] = useState<string | null>(
    managementAgreementDate || initialData?.managementAgreementDate || null
  );
  const [localFrequency, setLocalFrequency] = useState<string>(
    inspectionFrequency || initialData?.inspectionFrequency || "Monthly"
  );

  useEffect(() => {
    if (initialData) {
      setLocalDate(initialData.managementAgreementDate || null);
      setLocalFrequency(initialData.inspectionFrequency || "Monthly");
    }
  }, [initialData]);

  const handleDateChange = (value: string | null) => {
    setLocalDate(value);
    onManagementAgreementDateChange?.(value);
  };

  const handleFrequencyChange = (value: string) => {
    setLocalFrequency(value);
    onInspectionFrequencyChange?.(value);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
      }}
    >
      {/* Agreement Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: "rgba(113, 113, 121, 1)",
            lineHeight: 1.33,
            textTransform: "uppercase",
            letterSpacing: "-0.24px",
            fontFamily:
              "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          }}
        >
          Agreement
        </div>

        {/* Management Agreement Date */}
        <CompactDateField
          label="Management Agreement Date"
          value={localDate}
          onChange={handleDateChange}
          returnFormat="ISO"
          placeholder="MM/DD/YYYY"
        />

        {/* Inspection Frequency */}
        <CompactSelectField
          label="Inspection Frequency"
          value={localFrequency}
          onChange={handleFrequencyChange}
          options={[
            { value: "Weekly", label: "Weekly" },
            { value: "Biweekly", label: "Biweekly" },
            { value: "Monthly", label: "Monthly" },
            { value: "Bi-Monthly", label: "Bi-Monthly" },
          ]}
          placeholder="Select frequency"
        />
      </div>

      {/* Vendor Agreement Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: "rgba(113, 113, 121, 1)",
            lineHeight: 1.33,
            textTransform: "uppercase",
            letterSpacing: "-0.24px",
            fontFamily:
              "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          }}
        >
          Vendor Agreement
        </div>

        {/* HVAC Start */}
        <CompactDateField
          label="HVAC Start"
          value={null}
          onChange={() => {}}
          placeholder="MM/DD/YYYY"
          disabled
        />

        {/* HVAC End */}
        <CompactDateField
          label="HVAC End"
          value={null}
          onChange={() => {}}
          placeholder="MM/DD/YYYY"
          disabled
        />

        {/* Landscaping Start */}
        <CompactDateField
          label="Landscaping Start"
          value={null}
          onChange={() => {}}
          placeholder="MM/DD/YYYY"
          disabled
        />
      </div>
    </div>
  );
};

EditCustomFieldsInline.displayName = "EditCustomFieldsInline";
