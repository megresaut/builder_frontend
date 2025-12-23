import React, { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { FieldShell } from "./FieldShell";

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
}

/**
 * Validates phone number format
 * Accepts various formats:
 * - 1234567890 (10 digits)
 * - (123) 456-7890
 * - 123-456-7890
 * - +1 234 567 8900 (with optional country code)
 * - +441234567890
 */
function validatePhoneNumber(phoneNumber: string): boolean {
  // Extract only digits and + sign
  const cleaned = phoneNumber.replace(/[^\d+]/g, "");

  // Must have at least 10 digits (minimum valid phone number)
  const digitCount = cleaned.replace(/\D/g, "").length;
  return digitCount >= 10 && digitCount <= 15;
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
      setCountryCodeOpen(false);
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
            open={countryCodeOpen}
            onOpenChange={setCountryCodeOpen}
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
