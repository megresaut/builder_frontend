import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  usePopoverContext,
} from "@/components/ui/popover";
import { FieldShell } from "./FieldShell";
import { Input } from "@/components/ui/input";

interface MultiInputFieldProps {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  addButtonLabel?: string;
  addPlaceholder?: string;
}

/**
 * MultiInputField - Multi-input field for adding multiple free-text entries
 *
 * Allows users to add and remove multiple text entries with a popover interface.
 * Each entry is displayed as a tag with a remove button.
 */
export const MultiInputField: React.FC<MultiInputFieldProps> = ({
  label,
  required = false,
  description,
  error,
  id,
  disabled = false,
  value,
  onChange,
  placeholder = "Add items",
  addButtonLabel = "Add",
  addPlaceholder = "Enter text",
}) => {
  const [open, setOpen] = useState(false);
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <FieldShell
      label={label}
      required={required}
      description={description}
      error={error}
      disabled={disabled}
      htmlFor={fieldId}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <MultiInputFieldContent
          label={label}
          open={open}
          setOpen={setOpen}
          fieldId={fieldId}
          disabled={disabled}
          error={error}
          placeholder={placeholder}
          value={value}
          removeItem={removeItem}
          onChange={onChange}
          addButtonLabel={addButtonLabel}
          addPlaceholder={addPlaceholder}
        />
      </Popover>
    </FieldShell>
  );
};

interface MultiInputFieldContentProps {
  label: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  fieldId: string;
  disabled: boolean;
  error?: string;
  placeholder: string;
  value: string[];
  removeItem: (index: number) => void;
  onChange: (value: string[]) => void;
  addButtonLabel: string;
  addPlaceholder: string;
}

const MultiInputFieldContent: React.FC<MultiInputFieldContentProps> = ({
  label,
  open,
  setOpen,
  fieldId,
  disabled,
  error,
  placeholder,
  value,
  removeItem,
  onChange,
  addButtonLabel,
  addPlaceholder,
}) => {
  const [inputValue, setInputValue] = useState("");
  const popoverContext = usePopoverContext();
  const contentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      // Focus input when popover opens
      const input = contentRef.current?.querySelector(
        'input[type="text"]'
      ) as HTMLInputElement;
      input?.focus();
    }
  }, [open]);

  const handleAddItem = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !value.includes(trimmedValue)) {
      onChange([...value, trimmedValue]);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
    }
  };

  return (
    <>
      <PopoverTrigger asChild>
        <button
          id={fieldId}
          type="button"
          disabled={disabled}
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
            padding: "8px 12px",
            minHeight: "44px",
            width: "100%",
            borderRadius: "8px",
            backgroundColor: "rgba(255, 255, 255, 1)",
            borderColor: error ? "#ef4444" : "var(--color-border-light)",
            borderStyle: "solid",
            borderWidth: error ? "2px" : "1px",
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
            textAlign: "left",
            fontSize: "14px",
          }}
        >
          {value.length === 0 ? (
            <span
              style={{
                color: "#303030",
                fontSize: "14px",
              }}
            >
              {placeholder}
            </span>
          ) : (
            value.map((item, index) => (
              <span
                key={index}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 8px",
                  backgroundColor: "#f0f0f0",
                  borderRadius: "4px",
                  fontSize: "14px",
                  color: "var(--color-text-primary)",
                }}
              >
                {item}
              </span>
            ))
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        ref={contentRef}
        align="start"
        side="bottom"
        style={{
          padding: "12px",
          minWidth: "250px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Input
            type="text"
            placeholder={addPlaceholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              fontSize: "14px",
              padding: "8px 12px",
              height: "36px",
            }}
          />
          <button
            type="button"
            onClick={handleAddItem}
            style={{
              padding: "8px 12px",
              backgroundColor: "#013764",
              color: "white",
              borderRadius: "8px",
              border: "1px solid white",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              boxShadow: "0 0 0 1px #002D5A",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#003a73";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#013764";
            }}
          >
            {addButtonLabel}
          </button>

          {value.length > 0 && (
            <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "8px" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                  marginBottom: "8px",
                }}
              >
                Added items:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {value.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 8px",
                      backgroundColor: "#f9f9f9",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "20px",
                        height: "20px",
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        color: "#666",
                      }}
                      title="Remove item"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </>
  );
};
