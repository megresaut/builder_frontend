import { useState, useEffect } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompactInput } from "@/components/forms/compact";

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
 * Renders editable fields in the same layout structure as the view mode.
 * Fields are positioned in the same grid cells where values were displayed.
 *
 * Features:
 * - Matches view mode layout exactly (horizontal field grid with gap-14)
 * - Uses compact field variants (32px height, 6px padding)
 * - Typography matches view mode (same label sizes/styles)
 * - Two sections: Agreement and Vendor Agreement
 * - Fields laid out horizontally in grid pattern, not stacked vertically
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
        gap: "20px",
        width: "100%",
      }}
    >
      {/* Agreement Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: 500,
            color: "rgba(48, 48, 48, 1)",
            lineHeight: 1.38,
            fontFamily:
              "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            marginBottom: "12px",
          }}
        >
          Agreement
        </div>

        {/* Fields laid out horizontally in grid, matching view layout */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "56px",
          }}
        >
          {/* Management Agreement Date Field */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <label
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
              Management Agreement Date
            </label>
            <div
              style={{
                marginTop: "0px",
              }}
            >
              <CompactDateField
                label=""
                value={localDate}
                onChange={handleDateChange}
                returnFormat="ISO"
                placeholder="MM/DD/YYYY"
              />
            </div>
          </div>

          {/* Inspection Frequency Field */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <label
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
              Inspection Frequency
            </label>
            <div
              style={{
                marginTop: "0px",
              }}
            >
              <CompactSelectField
                label=""
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
          </div>
        </div>
      </div>

      {/* Vendor Agreement Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: 500,
            color: "rgba(48, 48, 48, 1)",
            lineHeight: 1.38,
            fontFamily:
              "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            marginBottom: "12px",
          }}
        >
          Vendor Agreement
        </div>

        {/* Fields laid out horizontally in grid, matching view layout */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "56px",
          }}
        >
          {/* HVAC Start Field */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <label
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
              HVAC Start
            </label>
            <div
              style={{
                marginTop: "0px",
              }}
            >
              <CompactDateField
                label=""
                value={null}
                onChange={() => {}}
                placeholder="MM/DD/YYYY"
                disabled
              />
            </div>
          </div>

          {/* HVAC End Field */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <label
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
              HVAC End
            </label>
            <div
              style={{
                marginTop: "0px",
              }}
            >
              <CompactDateField
                label=""
                value={null}
                onChange={() => {}}
                placeholder="MM/DD/YYYY"
                disabled
              />
            </div>
          </div>

          {/* Landscaping Start Field */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <label
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
              Landscaping Start
            </label>
            <div
              style={{
                marginTop: "0px",
              }}
            >
              <CompactDateField
                label=""
                value={null}
                onChange={() => {}}
                placeholder="MM/DD/YYYY"
                disabled
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

EditCustomFieldsInline.displayName = "EditCustomFieldsInline";
