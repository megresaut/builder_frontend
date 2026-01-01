import { useState, useEffect } from "react";
import {
  CompactDateField,
  CompactSelectField,
} from "@/components/forms/compact";

interface EditCustomFieldsInlineProps {
  initialData: {
    managementAgreementDate?: string;
    inspectionFrequency?: string;
  };
  onSave: (data: {
    managementAgreementDate: string;
    inspectionFrequency: string;
  }) => void;
  onCancel: () => void;
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
 * @param onSave - Callback with validated data
 * @param onCancel - Callback to cancel editing
 */
export const EditCustomFieldsInline: React.FC<
  EditCustomFieldsInlineProps
> = ({ initialData, onSave, onCancel }) => {
  const [managementAgreementDate, setManagementAgreementDate] = useState<
    string | null
  >(null);
  const [inspectionFrequency, setInspectionFrequency] = useState("Monthly");

  useEffect(() => {
    if (initialData) {
      setManagementAgreementDate(initialData.managementAgreementDate || null);
      setInspectionFrequency(initialData.inspectionFrequency || "Monthly");
    }
  }, [initialData]);

  const handleSave = () => {
    onSave({
      managementAgreementDate: managementAgreementDate || "",
      inspectionFrequency,
    });
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
          value={managementAgreementDate}
          onChange={(value) =>
            setManagementAgreementDate(
              typeof value === "string"
                ? value
                : value?.toISOString().split("T")[0] || null
            )
          }
          returnFormat="ISO"
          placeholder="MM/DD/YYYY"
        />

        {/* Inspection Frequency */}
        <CompactSelectField
          label="Inspection Frequency"
          value={inspectionFrequency}
          onChange={(value) => setInspectionFrequency(value)}
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
