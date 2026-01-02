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
  const [localMonthlyRate, setLocalMonthlyRate] = useState<string>(
    monthlyRate || initialData?.monthlyRate || "$0"
  );
  const [localDefaultRate, setLocalDefaultRate] = useState<string>(
    defaultRate || initialData?.defaultRate || "$0"
  );
  const [localEmergencyRate, setLocalEmergencyRate] = useState<string>(
    emergencyRate || initialData?.emergencyRate || "$0"
  );

  useEffect(() => {
    if (initialData) {
      setLocalMonthlyRate(initialData.monthlyRate || "$0");
      setLocalDefaultRate(initialData.defaultRate || "$0");
      setLocalEmergencyRate(initialData.emergencyRate || "$0");
    }
  }, [initialData]);

  const handleMonthlyRateChange = (value: string) => {
    setLocalMonthlyRate(value);
    onMonthlyRateChange?.(value);
  };

  const handleDefaultRateChange = (value: string) => {
    setLocalDefaultRate(value);
    onDefaultRateChange?.(value);
  };

  const handleEmergencyRateChange = (value: string) => {
    setLocalEmergencyRate(value);
    onEmergencyRateChange?.(value);
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
