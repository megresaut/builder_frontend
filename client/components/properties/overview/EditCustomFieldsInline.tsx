import { useState, useEffect } from "react";
import { DateField } from "@/components/forms/DateField";
import { SelectField } from "@/components/forms/SelectField";

export interface EditCustomFieldsInlineProps {
  initialData: {
    managementAgreementDate?: string;
    inspectionFrequency?: string;
    hvacStart?: string | null;
    hvacEnd?: string | null;
    landscapingStart?: string | null;
  };
  managementAgreementDate?: string;
  inspectionFrequency?: string;
  hvacStart?: string | null;
  hvacEnd?: string | null;
  landscapingStart?: string | null;
  onManagementAgreementDateChange?: (value: string | null) => void;
  onInspectionFrequencyChange?: (value: string) => void;
  onHvacStartChange?: (value: string | null) => void;
  onHvacEndChange?: (value: string | null) => void;
  onLandscapingStartChange?: (value: string | null) => void;
}

/**
 * EditCustomFieldsInline - Inline edit form for custom fields
 *
 * Renders editable fields in the same layout structure as the view mode.
 * Fields are positioned in the same grid cells where values were displayed.
 *
 * Features:
 * - Matches view mode layout exactly (horizontal field grid with gap-14)
 * - Uses standard DateField and SelectField with compact=true variant
 * - Full popover functionality and keyboard navigation
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
  hvacStart,
  hvacEnd,
  landscapingStart,
  onManagementAgreementDateChange,
  onInspectionFrequencyChange,
  onHvacStartChange,
  onHvacEndChange,
  onLandscapingStartChange,
}) => {
  const [localDate, setLocalDate] = useState<string | null>(
    managementAgreementDate || initialData?.managementAgreementDate || null
  );
  const [localFrequency, setLocalFrequency] = useState<string>(
    inspectionFrequency || initialData?.inspectionFrequency || "Monthly"
  );
  const [localHvacStart, setLocalHvacStart] = useState<string | null>(
    hvacStart !== undefined ? hvacStart : initialData?.hvacStart || null
  );
  const [localHvacEnd, setLocalHvacEnd] = useState<string | null>(
    hvacEnd !== undefined ? hvacEnd : initialData?.hvacEnd || null
  );
  const [localLandscapingStart, setLocalLandscapingStart] = useState<
    string | null
  >(landscapingStart !== undefined ? landscapingStart : initialData?.landscapingStart || null);

  useEffect(() => {
    if (initialData) {
      setLocalDate(initialData.managementAgreementDate || null);
      setLocalFrequency(initialData.inspectionFrequency || "Monthly");
      setLocalHvacStart(initialData.hvacStart || null);
      setLocalHvacEnd(initialData.hvacEnd || null);
      setLocalLandscapingStart(initialData.landscapingStart || null);
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

  const handleHvacStartChange = (value: string | null) => {
    setLocalHvacStart(value);
    onHvacStartChange?.(value);
  };

  const handleHvacEndChange = (value: string | null) => {
    setLocalHvacEnd(value);
    onHvacEndChange?.(value);
  };

  const handleLandscapingStartChange = (value: string | null) => {
    setLocalLandscapingStart(value);
    onLandscapingStartChange?.(value);
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
              width: "180px",
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
                whiteSpace: "nowrap",
              }}
            >
              Management Agreement Date
            </label>
            <DateField
              value={localDate}
              onChange={handleDateChange}
              returnFormat="ISO"
              placeholder="MM/DD/YYYY"
              compact
            />
          </div>

          {/* Inspection Frequency Field */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              maxWidth: "180px",
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
                whiteSpace: "nowrap",
              }}
            >
              Inspection Frequency
            </label>
            <SelectField
              value={localFrequency}
              onChange={handleFrequencyChange}
              options={[
                { value: "Weekly", label: "Weekly" },
                { value: "Biweekly", label: "Biweekly" },
                { value: "Monthly", label: "Monthly" },
                { value: "Bi-Monthly", label: "Bi-Monthly" },
              ]}
              placeholder="Select frequency"
              compact
            />
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
              maxWidth: "180px",
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
                whiteSpace: "nowrap",
              }}
            >
              HVAC Start
            </label>
            <DateField
              value={localHvacStart}
              onChange={handleHvacStartChange}
              returnFormat="ISO"
              placeholder="MM/DD/YYYY"
              compact
            />
          </div>

          {/* HVAC End Field */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              maxWidth: "180px",
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
                whiteSpace: "nowrap",
              }}
            >
              HVAC End
            </label>
            <DateField
              value={localHvacEnd}
              onChange={handleHvacEndChange}
              returnFormat="ISO"
              placeholder="MM/DD/YYYY"
              compact
            />
          </div>

          {/* Landscaping Start Field */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              maxWidth: "180px",
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
                whiteSpace: "nowrap",
              }}
            >
              Landscaping Start
            </label>
            <DateField
              value={localLandscapingStart}
              onChange={handleLandscapingStartChange}
              returnFormat="ISO"
              placeholder="MM/DD/YYYY"
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
};

EditCustomFieldsInline.displayName = "EditCustomFieldsInline";
