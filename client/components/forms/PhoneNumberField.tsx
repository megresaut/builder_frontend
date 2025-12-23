import React, { forwardRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { FieldShell } from "./FieldShell";
import { Dropdown } from "@/components/ui/dropdown";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhoneNumberFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  defaultCountryCode?: string;
}

// Common country codes for phone numbers
const COUNTRY_CODES = [
  { value: "+1", label: "United States/Canada (+1)" },
  { value: "+44", label: "United Kingdom (+44)" },
  { value: "+33", label: "France (+33)" },
  { value: "+49", label: "Germany (+49)" },
  { value: "+39", label: "Italy (+39)" },
  { value: "+34", label: "Spain (+34)" },
  { value: "+31", label: "Netherlands (+31)" },
  { value: "+32", label: "Belgium (+32)" },
  { value: "+41", label: "Switzerland (+41)" },
  { value: "+43", label: "Austria (+43)" },
  { value: "+45", label: "Denmark (+45)" },
  { value: "+46", label: "Sweden (+46)" },
  { value: "+47", label: "Norway (+47)" },
  { value: "+48", label: "Poland (+48)" },
  { value: "+86", label: "China (+86)" },
  { value: "+81", label: "Japan (+81)" },
  { value: "+82", label: "South Korea (+82)" },
  { value: "+91", label: "India (+91)" },
  { value: "+61", label: "Australia (+61)" },
  { value: "+64", label: "New Zealand (+64)" },
  { value: "+55", label: "Brazil (+55)" },
  { value: "+52", label: "Mexico (+52)" },
  { value: "+1-242", label: "Bahamas (+1-242)" },
  { value: "+1-246", label: "Barbados (+1-246)" },
  { value: "+1-284", label: "British Virgin Islands (+1-284)" },
  { value: "+1-345", label: "Cayman Islands (+1-345)" },
  { value: "+1-441", label: "Bermuda (+1-441)" },
  { value: "+1-473", label: "Grenada (+1-473)" },
  { value: "+1-649", label: "Turks and Caicos (+1-649)" },
  { value: "+1-664", label: "Montserrat (+1-664)" },
  { value: "+1-758", label: "Saint Lucia (+1-758)" },
  { value: "+1-787", label: "Puerto Rico (+1-787)" },
  { value: "+1-868", label: "Trinidad and Tobago (+1-868)" },
  { value: "+1-876", label: "Jamaica (+1-876)" },
  { value: "+27", label: "South Africa (+27)" },
  { value: "+234", label: "Nigeria (+234)" },
  { value: "+256", label: "Uganda (+256)" },
  { value: "+966", label: "Saudi Arabia (+966)" },
  { value: "+971", label: "United Arab Emirates (+971)" },
  { value: "+972", label: "Israel (+972)" },
  { value: "+65", label: "Singapore (+65)" },
  { value: "+60", label: "Malaysia (+60)" },
  { value: "+66", label: "Thailand (+66)" },
  { value: "+62", label: "Indonesia (+62)" },
  { value: "+63", label: "Philippines (+63)" },
];

/**
 * Validates phone number format based on country code
 * Accepts various formats: 1234567890, (123) 456-7890, 123-456-7890, etc.
 */
function validatePhoneNumber(countryCode: string, phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, "");

  // Determine expected length based on country code
  let expectedLength = 10; // Default for most countries
  if (countryCode === "+1") {
    expectedLength = 10; // US/Canada
  } else if (countryCode === "+44") {
    expectedLength = 10; // UK (excluding country code)
  } else if (countryCode === "+86") {
    expectedLength = 11; // China
  } else if (countryCode === "+91") {
    expectedLength = 10; // India
  } else if (countryCode === "+81") {
    expectedLength = 10; // Japan
  } else if (countryCode.startsWith("+1-")) {
    // Caribbean numbers are 10 digits
    expectedLength = 10;
  }

  // Allow 1-3 digit variance for flexibility
  return cleaned.length >= expectedLength - 2 && cleaned.length <= expectedLength + 3;
}

/**
 * PhoneNumberField - Phone number input with country code selector and validation
 *
 * Features:
 * - Dropdown to select country code (default: +1)
 * - Phone number input with format flexibility
 * - Real-time validation on blur
 * - Clear error messaging
 * - Accepts various formats: 1234567890, (123) 456-7890, 123-456-7890
 * - Optional validation callback
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - External error message
 * @param id - HTML id attribute
 * @param value - Full phone number with country code (e.g., "+1234567890")
 * @param onChange - Change handler (receives full number with country code)
 * @param onValidationChange - Callback when validation state changes
 * @param defaultCountryCode - Default country code (default: "+1")
 * @param disabled - Disable field
 *
 * Example:
 * ```tsx
 * <PhoneNumberField
 *   label="Phone Number"
 *   required
 *   value={phone}
 *   onChange={setPhone}
 *   onValidationChange={setIsPhoneValid}
 *   placeholder="(123) 456-7890"
 * />
 * ```
 */
export const PhoneNumberField = forwardRef<HTMLInputElement, PhoneNumberFieldProps>(
  (
    {
      label,
      required = false,
      description,
      error: externalError,
      id,
      disabled = false,
      value = "",
      onChange,
      onValidationChange,
      defaultCountryCode = "+1",
      placeholder = "(123) 456-7890",
      ...inputProps
    },
    ref,
  ) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
    const [countryCode, setCountryCode] = useState(defaultCountryCode);
    const [countryCodeOpen, setCountryCodeOpen] = useState(false);
    const [validationError, setValidationError] = React.useState<string>("");

    // Extract phone number from value (remove country code)
    const phoneNumberOnly = value.replace(/^\+[\d-]+/, "").trim();

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const phoneInput = e.target.value;
      const fullValue = countryCode + phoneInput;
      onChange?.(fullValue);
      setValidationError("");
    };

    const handleCountryCodeChange = (newCode: string) => {
      setCountryCode(newCode);
      setValidationError("");
      // Update value with new country code
      if (phoneNumberOnly) {
        onChange?.(newCode + phoneNumberOnly);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const phoneInput = e.target.value.trim();

      if (phoneInput === "") {
        setValidationError("");
        onValidationChange?.(false);
      } else if (!validatePhoneNumber(countryCode, phoneInput)) {
        setValidationError("Please enter a valid phone number");
        onValidationChange?.(false);
      } else {
        setValidationError("");
        onValidationChange?.(true);
      }

      inputProps.onBlur?.(e);
    };

    const displayError = externalError || validationError;

    return (
      <FieldShell
        label={label}
        required={required}
        description={description}
        error={displayError}
        disabled={disabled}
        htmlFor={fieldId}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
          <Dropdown
            open={false}
            onOpenChange={() => {}}
            initialPlacement="bottom"
            minSpaceBelow={300}
            syncTriggerWidth={false}
          >
            <Dropdown.Trigger
              disabled={disabled}
              className={cn(
                "h-11 rounded-lg border px-3 py-2",
                "bg-white text-sm font-normal",
                "flex items-center justify-between",
                "cursor-pointer transition-colors",
                "disabled:cursor-not-allowed disabled:opacity-60",
                "border-[var(--color-border-light)]"
              )}
              style={{
                fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                lineHeight: 1.43,
                flex: "0 0 auto",
                whiteSpace: "nowrap",
                color: "#303030",
              }}
            >
              <span>{countryCode}</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0" style={{ color: "#303030" }} />
            </Dropdown.Trigger>

            <Dropdown.Content
              closeOnOutsideClick={true}
              closeOnEscape={true}
              className="rounded-lg border border-[var(--color-border-light)] bg-white shadow-md"
            >
              <div style={{ maxHeight: "300px", overflowY: "auto", padding: "4px 0" }}>
                {COUNTRY_CODES.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      handleCountryCodeChange(option.value);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      textAlign: "left",
                      backgroundColor:
                        countryCode === option.value ? "rgba(36, 99, 235, 0.1)" : "transparent",
                      color: "var(--color-text-primary)",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "rgba(36, 99, 235, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        countryCode === option.value
                          ? "rgba(36, 99, 235, 0.1)"
                          : "transparent";
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Dropdown.Content>
          </Dropdown>

          <Input
            ref={ref}
            id={fieldId}
            type="tel"
            disabled={disabled}
            value={phoneNumberOnly}
            onChange={handlePhoneChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            style={{ flex: 1 }}
            {...inputProps}
          />
        </div>
      </FieldShell>
    );
  },
);

PhoneNumberField.displayName = "PhoneNumberField";
