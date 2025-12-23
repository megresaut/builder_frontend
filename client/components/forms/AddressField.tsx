import React, { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { FieldShell } from "./FieldShell";

export interface AddressValue {
  street: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

interface AddressFieldProps {
  label?: string;
  required?: boolean;
  description?: string;
  error?: string;
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  disabled?: boolean;
  includeCountry?: boolean;
  showLabel?: boolean;
}

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

export const AddressField: React.FC<AddressFieldProps> = ({
  label = "Address",
  required = false,
  description,
  error,
  value,
  onChange,
  disabled = false,
  includeCountry = false,
  showLabel = true,
}) => {
  const [stateOpen, setStateOpen] = useState(false);

  const inputBaseStyle: React.CSSProperties = {
    borderRadius: "8px",
    backgroundColor: "white",
    borderColor: error ? "#ef4444" : "var(--color-border-light)",
    borderStyle: "solid",
    borderWidth: error ? "2px" : "1px",
    padding: "8px 12px",
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: 1.43,
    fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
    color: "#303030",
    width: "100%",
    boxSizing: "border-box",
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? "not-allowed" : "auto",
    minHeight: "44px",
    outline: "none",
  };

  const stateTriggerStyle: React.CSSProperties = {
    ...inputBaseStyle,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  };

  const handleStreetChange = (newStreet: string) => {
    onChange({ ...value, street: newStreet });
  };

  const handleStreet2Change = (newStreet2: string) => {
    onChange({ ...value, street2: newStreet2 });
  };

  const handleCityChange = (newCity: string) => {
    onChange({ ...value, city: newCity });
  };

  const handleStateChange = (newState: string) => {
    onChange({ ...value, state: newState });
  };

  const handleZipChange = (newZip: string) => {
    const normalized = newZip.replace(/\D/g, "");
    onChange({ ...value, zipCode: normalized });
  };

  const handleCountryChange = (newCountry: string) => {
    onChange({ ...value, country: newCountry });
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "#000000";
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = error ? "#ef4444" : "var(--color-border-light)";
  };

  const stateButtonRef = React.useRef<HTMLButtonElement>(null);
  const [stateButtonWidth, setStateButtonWidth] = React.useState(0);

  React.useEffect(() => {
    if (stateButtonRef.current) {
      setStateButtonWidth(stateButtonRef.current.offsetWidth);
    }
  }, []);

  const StatePopover = useMemo(
    () => (
      <Popover open={stateOpen} onOpenChange={setStateOpen}>
        <PopoverTrigger asChild>
          <button
            ref={stateButtonRef}
            disabled={disabled}
            style={{
              ...stateTriggerStyle,
              flex: 0.5,
              borderColor: error ? "#ef4444" : stateOpen ? "#000000" : "var(--color-border-light)",
            }}
            type="button"
          >
            <span
              style={{
                color: value.state ? "#303030" : "#303030",
                fontSize: "14px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {value.state || "State"}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "#303030" }} />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={4}
          avoidCollisions={true}
          className="p-0"
          style={{
            width: stateButtonWidth > 0 ? `${stateButtonWidth}px` : "auto",
            minWidth: "100px",
            padding: "0",
            maxHeight: "300px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              maxHeight: "280px",
              overflowY: "auto",
              padding: "4px 0",
            }}
          >
            {US_STATES.map((state) => {
              const isSelected = state === value.state;
              return (
                <button
                  key={state}
                  type="button"
                  onClick={() => {
                    handleStateChange(state);
                    setStateOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    textAlign: "left",
                    backgroundColor: isSelected ? "rgba(36, 99, 235, 0.15)" : "transparent",
                    color: "#303030",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    transition: "background-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isSelected
                      ? "rgba(36, 99, 235, 0.15)"
                      : "rgba(36, 99, 235, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isSelected
                      ? "rgba(36, 99, 235, 0.15)"
                      : "transparent";
                  }}
                >
                  {state}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    ),
    [disabled, handleStateChange, stateOpen, stateTriggerStyle, value.state, error],
  );

  const content = (
    <div className="flex flex-col gap-3">
      {includeCountry && (
        <input
          type="text"
          value={value.country || ""}
          onChange={(e) => handleCountryChange(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Country"
          disabled={disabled}
          style={inputBaseStyle}
        />
      )}

      <input
        type="text"
        value={value.street}
        onChange={(e) => handleStreetChange(e.target.value)}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder="Street Address"
        disabled={disabled}
        style={inputBaseStyle}
      />

      <input
        type="text"
        value={value.street2 || ""}
        onChange={(e) => handleStreet2Change(e.target.value)}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder="Street Address 2 (Apt, Suite, etc.)"
        disabled={disabled}
        style={inputBaseStyle}
      />

      <div className="flex gap-3">
        <input
          type="text"
          value={value.city}
          onChange={(e) => handleCityChange(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="City"
          disabled={disabled}
          style={{ ...inputBaseStyle, flex: 1 }}
        />

        <div style={{ flex: 0.5 }}>{StatePopover}</div>

        <input
          type="text"
          value={value.zipCode}
          onChange={(e) => handleZipChange(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="ZIP"
          disabled={disabled}
          style={{ ...inputBaseStyle, flex: 0.5, maxWidth: "120px" }}
          maxLength={5}
        />
      </div>
    </div>
  );

  if (!showLabel) return content;

  return (
    <FieldShell
      label={label}
      required={required}
      description={description}
      error={error}
      disabled={disabled}
    >
      {content}
    </FieldShell>
  );
};

AddressField.displayName = "AddressField";
