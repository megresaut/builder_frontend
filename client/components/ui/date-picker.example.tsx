import { useState } from "react";
import { DatePicker } from "./date-picker";

/**
 * DatePicker Component Usage Examples
 *
 * A reusable, accessible date picker with calendar dropdown.
 * No new visual styles - uses existing Tailwind classes and global ra-* components.
 */

export function DatePickerBasicExample() {
  const [date, setDate] = useState<Date | null>(null);

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Basic DatePicker</h2>
      <DatePicker
        value={date}
        onChange={setDate}
        placeholder="mm/dd/yyyy"
      />
      {date && (
        <p className="mt-2 text-sm text-[#303030]">
          Selected: {date.toLocaleDateString("en-US")}
        </p>
      )}
    </div>
  );
}

export function DatePickerWithLabelExample() {
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(null);

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">DatePicker with Label</h2>
      <label className="text-[#303030] text-sm font-medium leading-[1.43]">
        Invoice Date <span style={{ color: "rgb(255, 0, 0)" }}>&nbsp;*</span>
      </label>
      <DatePicker
        value={invoiceDate}
        onChange={setInvoiceDate}
        placeholder="mm/dd/yyyy"
      />
    </div>
  );
}

export function DatePickerWithErrorExample() {
  const [date, setDate] = useState<Date | null>(null);
  const [error, setError] = useState(false);

  const handleDateChange = (newDate: Date | null) => {
    setDate(newDate);
    setError(newDate === null && date !== null);
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">DatePicker with Error State</h2>
      <label className="text-[#303030] text-sm font-medium leading-[1.43]">
        Due Date
      </label>
      <DatePicker
        value={date}
        onChange={handleDateChange}
        error={error}
        placeholder="mm/dd/yyyy"
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">Invalid date format</p>
      )}
    </div>
  );
}

export function DatePickerDisabledExample() {
  const [date] = useState<Date | null>(new Date(2024, 0, 15));

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Disabled DatePicker</h2>
      <label className="text-[#303030] text-sm font-medium leading-[1.43]">
        Read-Only Date
      </label>
      <DatePicker
        value={date}
        onChange={() => {}}
        disabled={true}
        placeholder="mm/dd/yyyy"
      />
    </div>
  );
}

export function DatePickerInFormExample() {
  const [formData, setFormData] = useState({
    invoiceDate: null as Date | null,
    dueDate: null as Date | null,
  });

  const handleInvoiceDateChange = (date: Date | null) => {
    setFormData((prev) => ({ ...prev, invoiceDate: date }));
  };

  const handleDueDateChange = (date: Date | null) => {
    setFormData((prev) => ({ ...prev, dueDate: date }));
  };

  return (
    <div className="p-6 max-w-md">
      <h2 className="text-lg font-semibold mb-6">Bill Form with DatePicker</h2>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <label className="text-[#303030] text-sm font-medium leading-[1.43]">
            Invoice Date <span className="text-red-600">*</span>
          </label>
          <DatePicker
            value={formData.invoiceDate}
            onChange={handleInvoiceDateChange}
            placeholder="mm/dd/yyyy"
          />
        </div>

        <div className="flex-1">
          <label className="text-[#303030] text-sm font-medium leading-[1.43]">
            Due Date <span className="text-red-600">*</span>
          </label>
          <DatePicker
            value={formData.dueDate}
            onChange={handleDueDateChange}
            placeholder="mm/dd/yyyy"
          />
        </div>
      </div>

      <button className="flex h-9 w-full items-center justify-center gap-2 px-4 rounded-lg border border-white bg-[#013764] hover:bg-[#003a73] transition-colors text-white font-medium text-base">
        Save Bill
      </button>

      {(formData.invoiceDate || formData.dueDate) && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-[#303030]">
            <strong>Form Data:</strong>
          </p>
          {formData.invoiceDate && (
            <p className="text-sm text-[#303030]">
              Invoice Date: {formData.invoiceDate.toLocaleDateString("en-US")}
            </p>
          )}
          {formData.dueDate && (
            <p className="text-sm text-[#303030]">
              Due Date: {formData.dueDate.toLocaleDateString("en-US")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * QUICK START
 *
 * 1. Import the component:
 *    import { DatePicker } from "@/components/ui/date-picker";
 *
 * 2. Use in your component:
 *    const [date, setDate] = useState<Date | null>(null);
 *    return <DatePicker value={date} onChange={setDate} />;
 *
 * 3. All styles are defined in global.css with ra-date-picker-* classes
 *
 * PROPS:
 * - value: Date | null - The selected date
 * - onChange: (date: Date | null) => void - Callback when date changes
 * - onInputChange?: (input: string) => void - Callback for raw input changes
 * - placeholder?: string - Input placeholder (default: "mm/dd/yyyy")
 * - disabled?: boolean - Disable the input (default: false)
 * - error?: boolean - Show error state (default: false)
 * - className?: string - Additional CSS classes for the input
 *
 * FEATURES:
 * - Calendar dropdown portal (rendered at document.body)
 * - Month navigation with prev/next buttons
 * - Date validation (mm/dd/yyyy format)
 * - Auto-formatting as user types
 * - Click-outside to close calendar
 * - Selected date highlighting
 * - Keyboard accessible
 * - No new visual styles (uses existing Tailwind + ra-* classes)
 */
