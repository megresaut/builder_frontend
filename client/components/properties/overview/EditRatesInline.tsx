import { useState, useEffect } from "react";
import { CurrencyField } from "@/components/forms/CurrencyField";

export interface EditRatesInlineProps {
  initialData: {
    monthlyRate?: string;
    defaultRate?: string;
    emergencyRate?: string;
  };
  monthlyRate?: string;
  defaultRate?: string;
  emergencyRate?: string;
  onMonthlyRateChange?: (value: string) => void;
  onDefaultRateChange?: (value: string) => void;
  onEmergencyRateChange?: (value: string) => void;
}

/**
 * EditRatesInline - Inline edit form for rates
 *
 * Renders editable rate fields in the same layout structure as the view mode.
 * Fields are positioned in the same grid cells where values were displayed.
 *
 * Features:
 * - Matches view mode layout exactly (horizontal field grid with gap-14)
 * - Uses standard CurrencyField with compact variant
 * - Typography matches view mode (same label sizes/styles)
 * - Two sections: Management Fee and Field Team Rates
 * - Fields laid out horizontally in grid pattern, not stacked vertically
 */
export const EditRatesInline: React.FC<EditRatesInlineProps> = ({
  initialData,
  monthlyRate,
  defaultRate,
  emergencyRate,
  onMonthlyRateChange,
  onDefaultRateChange,
  onEmergencyRateChange,
}) => {
  // Parse string values to numbers for storage
  const parseRateValue = (val?: string): number => {
    if (!val) return 0;
    const numStr = typeof val === "string" ? val.replace(/[^0-9.]/g, "") : val;
    return parseFloat(numStr) || 0;
  };

  const [localMonthlyRate, setLocalMonthlyRate] = useState<number>(
    parseRateValue(monthlyRate || initialData?.monthlyRate)
  );
  const [localDefaultRate, setLocalDefaultRate] = useState<number>(
    parseRateValue(defaultRate || initialData?.defaultRate)
  );
  const [localEmergencyRate, setLocalEmergencyRate] = useState<number>(
    parseRateValue(emergencyRate || initialData?.emergencyRate)
  );

  useEffect(() => {
    if (initialData) {
      setLocalMonthlyRate(parseRateValue(initialData.monthlyRate));
      setLocalDefaultRate(parseRateValue(initialData.defaultRate));
      setLocalEmergencyRate(parseRateValue(initialData.emergencyRate));
    }
  }, [initialData]);

  const formatCurrencyDisplay = (num: number): string => {
    return `$${num.toFixed(0)}`;
  };

  const handleMonthlyRateChange = (value: number | string) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    setLocalMonthlyRate(numValue);
    onMonthlyRateChange?.(formatCurrencyDisplay(numValue));
  };

  const handleDefaultRateChange = (value: number | string) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    setLocalDefaultRate(numValue);
    onDefaultRateChange?.(formatCurrencyDisplay(numValue));
  };

  const handleEmergencyRateChange = (value: number | string) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    setLocalEmergencyRate(numValue);
    onEmergencyRateChange?.(formatCurrencyDisplay(numValue));
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
      {/* Management Fee Section */}
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
          Management Fee
        </div>

        {/* Fields laid out horizontally in grid, matching view layout */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "56px",
          }}
        >
          {/* Monthly Rate Field */}
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
              Monthly Rate
            </label>
            <CurrencyField
              value={localMonthlyRate}
              onChange={handleMonthlyRateChange}
              placeholder="$0.00"
              compact
            />
          </div>
        </div>
      </div>

      {/* Field Team Rates Section */}
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
          Field Team Rates
        </div>

        {/* Fields laid out horizontally in grid, matching view layout */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "56px",
          }}
        >
          {/* Default Rate Field */}
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
              Default Rate
            </label>
            <CurrencyField
              value={localDefaultRate}
              onChange={handleDefaultRateChange}
              placeholder="$0.00"
              compact
            />
          </div>

          {/* Emergency Rate Field */}
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
              Emergency Rate
            </label>
            <CurrencyField
              value={localEmergencyRate}
              onChange={handleEmergencyRateChange}
              placeholder="$0.00"
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
};

EditRatesInline.displayName = "EditRatesInline";
