import React, { useState } from "react";
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
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

/**
 * AddressField - Multi-line address input with state/zip normalization
 *
 * Provides structured fields for street, city, state, and zip code.
 * Automatically normalizes ZIP codes to numeric format.
 * Includes state selector with validation.
 *
 * @param label - Field label (if showLabel is true)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param value - Address object with street, city, state, zipCode
 * @param onChange - Change handler
 * @param disabled - Disable all fields
 * @param includeCountry - Show country field (default: false)
 * @param showLabel - Show main label above fields (default: true)
 *
 * Example:
 * ```tsx
 * <AddressField
 *   label="Property Address"
 *   required
 *   value={address}
 *   onChange={setAddress}
 *   error={errors.address}
 * />
 * ```
 */
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
  const inputBaseStyle = {
    borderRadius: "8px",
    backgroundColor: "white",
    borderColor: error ? "#ef4444" : "var(--color-border-light)",
    borderStyle: "solid",
    borderWidth: error ? "2px" : "1px",
    padding: "8px 12px",
    fontSize: "16px",
    fontWeight: 400,
    lineHeight: 1.4,
    fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
    color: "#303030",
    width: "100%",
    boxSizing: "border-box" as const,
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? "not-allowed" : "auto",
  };

  const selectStyle = {
    ...inputBaseStyle,
    appearance: "none" as const,
    paddingRight: "32px",
    backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 8px center",
    backgroundSize: "20px",
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
    // Normalize to numeric only
    const normalized = newZip.replace(/\D/g, "");
    onChange({ ...value, zipCode: normalized });
  };

  const handleCountryChange = (newCountry: string) => {
    onChange({ ...value, country: newCountry });
  };

  if (!showLabel) {
    return (
      <div className="flex flex-col gap-3">
        {includeCountry && (
          <input
            type="text"
            value={value.country || ""}
            onChange={(e) => handleCountryChange(e.target.value)}
            placeholder="Country"
            disabled={disabled}
            style={inputBaseStyle}
          />
        )}
        <input
          type="text"
          value={value.street}
          onChange={(e) => handleStreetChange(e.target.value)}
          placeholder="Street Address"
          disabled={disabled}
          style={inputBaseStyle}
        />
        <input
          type="text"
          value={value.street2 || ""}
          onChange={(e) => handleStreet2Change(e.target.value)}
          placeholder="Street Address 2 (Apt, Suite, etc.)"
          disabled={disabled}
          style={inputBaseStyle}
        />
        <div className="flex gap-3">
          <input
            type="text"
            value={value.city}
            onChange={(e) => handleCityChange(e.target.value)}
            placeholder="City"
            disabled={disabled}
            style={{ ...inputBaseStyle, flex: 1 }}
          />
          <select
            value={value.state}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={disabled}
            style={{ ...selectStyle, flex: 0.5 }}
          >
            <option value="">State</option>
            {US_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={value.zipCode}
            onChange={(e) => handleZipChange(e.target.value)}
            placeholder="ZIP"
            disabled={disabled}
            style={{ ...inputBaseStyle, flex: 0.5, maxWidth: "100px" }}
            maxLength={5}
          />
        </div>
      </div>
    );
  }

  return (
    <FieldShell
      label={label}
      required={required}
      description={description}
      error={error}
      disabled={disabled}
    >
      <div className="flex flex-col gap-3">
        {includeCountry && (
          <input
            type="text"
            value={value.country || ""}
            onChange={(e) => handleCountryChange(e.target.value)}
            placeholder="Country"
            disabled={disabled}
            style={inputBaseStyle}
          />
        )}
        <input
          type="text"
          value={value.street}
          onChange={(e) => handleStreetChange(e.target.value)}
          placeholder="Street Address"
          disabled={disabled}
          style={inputBaseStyle}
        />
        <input
          type="text"
          value={value.street2 || ""}
          onChange={(e) => handleStreet2Change(e.target.value)}
          placeholder="Street Address 2 (Apt, Suite, etc.)"
          disabled={disabled}
          style={inputBaseStyle}
        />
        <div className="flex gap-3">
          <input
            type="text"
            value={value.city}
            onChange={(e) => handleCityChange(e.target.value)}
            placeholder="City"
            disabled={disabled}
            style={{ ...inputBaseStyle, flex: 1 }}
          />
          <select
            value={value.state}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={disabled}
            style={{ ...selectStyle, flex: 0.5 }}
          >
            <option value="">State</option>
            {US_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={value.zipCode}
            onChange={(e) => handleZipChange(e.target.value)}
            placeholder="ZIP"
            disabled={disabled}
            style={{ ...inputBaseStyle, flex: 0.5, maxWidth: "100px" }}
            maxLength={5}
          />
        </div>
      </div>
    </FieldShell>
  );
};

AddressField.displayName = "AddressField";
