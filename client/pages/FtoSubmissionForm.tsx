import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import {
  TextField,
  SelectField,
  TextAreaField,
  DateField,
  CurrencyField,
  NumberField,
} from "@/components/forms";
import { FormLayout, FormSection, FormFieldRow } from "@/components/ui/form-layout";
import { PROPERTIES, CHARGE_TYPES, TASKS, YES_NO_OPTIONS } from "@/data/fto/properties";
import {
  ClockIcon,
  DollarIcon,
  CalendarIcon,
  BuildingIcon,
  DocumentIcon,
  NoteIcon,
} from "@/components/icons";
import { AttachmentUploader, UploadedFile } from "@/components/ui/attachment-uploader";

interface HourEntry {
  id: string;
  date: Date | null;
  property: string;
  unit: string;
  task: string;
  hours: number;
  emergencyRate: string;
  nonBillableHours: string;
  note: string;
  isExpanded: boolean;
}

interface ExpenseEntry {
  id: string;
  date: Date | null;
  property: string;
  unit: string;
  task: string;
  amount: string;
  chargeType: string;
  vendor: string;
  note: string;
  receipts: UploadedFile[];
  isExpanded: boolean;
}

interface FormState {
  hourEntries: HourEntry[];
  expenseEntries: ExpenseEntry[];
}

interface RowData {
  property?: string;
  unit?: string;
  description?: string;
}

export default function FtoSubmissionForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ftoId } = useParams();
  const rowData = location.state as RowData | undefined;

  const [formState, setFormState] = useState<FormState>({
    hourEntries: [],
    expenseEntries: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form
  useEffect(() => {
    const today = new Date();

    // If navigating from row click (prepopulate), initialize with one expanded hour and expense entry
    if (ftoId && rowData) {
      setFormState({
        hourEntries: [
          {
            id: "hour-1",
            date: null,
            property: rowData.property || "",
            unit: rowData.unit || "",
            task: "",
            hours: 0,
            emergencyRate: "no",
            nonBillableHours: "no",
            note: "",
            isExpanded: true,
          },
        ],
        expenseEntries: [
          {
            id: "expense-1",
            date: null,
            property: rowData.property || "",
            unit: rowData.unit || "",
            task: "",
            amount: "",
            chargeType: "client-expense",
            vendor: "",
            note: "",
            receipts: [],
            isExpanded: true,
          },
        ],
      });
    } else {
      // If navigating from Submit button (blank), initialize with empty entries
      setFormState({
        hourEntries: [
          {
            id: "hour-1",
            date: null,
            property: "",
            unit: "",
            task: "",
            hours: 0,
            emergencyRate: "no",
            nonBillableHours: "no",
            note: "",
            isExpanded: true,
          },
        ],
        expenseEntries: [
          {
            id: "expense-1",
            date: null,
            property: "",
            unit: "",
            task: "",
            amount: "",
            chargeType: "client-expense",
            vendor: "",
            note: "",
            receipts: [],
            isExpanded: true,
          },
        ],
      });
    }
  }, [ftoId, rowData]);

  const getPropertyUnits = (propertyId: string) => {
    const property = PROPERTIES.find((p) => p.id === propertyId);
    return property ? property.units : [];
  };

  const updateHourEntry = (id: string, updates: Partial<HourEntry>) => {
    setFormState((prev) => ({
      ...prev,
      hourEntries: prev.hourEntries.map((entry) =>
        entry.id === id ? { ...entry, ...updates } : entry
      ),
    }));
  };

  const updateExpenseEntry = (id: string, updates: Partial<ExpenseEntry>) => {
    setFormState((prev) => ({
      ...prev,
      expenseEntries: prev.expenseEntries.map((entry) =>
        entry.id === id ? { ...entry, ...updates } : entry
      ),
    }));
  };

  const addHourEntry = () => {
    const newEntry: HourEntry = {
      id: `hour-${Date.now()}`,
      date: null,
      property: "",
      unit: "",
      task: "",
      hours: 0,
      emergencyRate: "no",
      nonBillableHours: "no",
      note: "",
      isExpanded: true,
    };
    setFormState((prev) => ({
      ...prev,
      hourEntries: [...prev.hourEntries, newEntry],
    }));
  };

  const addExpenseEntry = () => {
    const newEntry: ExpenseEntry = {
      id: `expense-${Date.now()}`,
      date: null,
      property: "",
      unit: "",
      task: "",
      amount: "",
      chargeType: "client-expense",
      vendor: "",
      note: "",
      receipts: [],
      isExpanded: true,
    };
    setFormState((prev) => ({
      ...prev,
      expenseEntries: [...prev.expenseEntries, newEntry],
    }));
  };

  const removeHourEntry = (id: string) => {
    setFormState((prev) => ({
      ...prev,
      hourEntries: prev.hourEntries.filter((entry) => entry.id !== id),
    }));
  };

  const removeExpenseEntry = (id: string) => {
    setFormState((prev) => ({
      ...prev,
      expenseEntries: prev.expenseEntries.filter((entry) => entry.id !== id),
    }));
  };

  const toggleHourEntryExpanded = (id: string) => {
    updateHourEntry(id, {
      isExpanded: !formState.hourEntries.find((e) => e.id === id)?.isExpanded,
    });
  };

  const toggleExpenseEntryExpanded = (id: string) => {
    updateExpenseEntry(id, {
      isExpanded: !formState.expenseEntries.find((e) => e.id === id)?.isExpanded,
    });
  };

  const handleSubmit = () => {
    console.log("Form submitted:", formState);
    navigate("/fto/submission-history");
  };

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Submission Summary</h1>
        </div>

        <FormLayout>
          {/* Hours Section */}
          <FormSection title="Hours" showDivider={false}>
            <div className="flex flex-col gap-4">
              {formState.hourEntries.map((entry, index) => (
                <HourEntryCard
                  key={entry.id}
                  entry={entry}
                  index={index + 1}
                  properties={PROPERTIES}
                  tasks={TASKS}
                  yesNoOptions={YES_NO_OPTIONS}
                  onUpdate={(updates) => updateHourEntry(entry.id, updates)}
                  onToggleExpanded={() => toggleHourEntryExpanded(entry.id)}
                  onRemove={() => removeHourEntry(entry.id)}
                  canRemove={formState.hourEntries.length > 1}
                  getPropertyUnits={getPropertyUnits}
                />
              ))}

              <button
                onClick={addHourEntry}
                className="flex items-center justify-center gap-2 py-2 text-blue-600 font-medium border border-dashed border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <span>+</span>
                <span>Add hour Entry</span>
              </button>
            </div>
          </FormSection>

          {/* Expenses Section */}
          <FormSection title="Expense Entry" showDivider={false}>
            <div className="flex flex-col gap-4">
              {formState.expenseEntries.map((entry, index) => (
                <ExpenseEntryCard
                  key={entry.id}
                  entry={entry}
                  index={index + 1}
                  properties={PROPERTIES}
                  tasks={TASKS}
                  chargeTypes={CHARGE_TYPES}
                  yesNoOptions={YES_NO_OPTIONS}
                  onUpdate={(updates) => updateExpenseEntry(entry.id, updates)}
                  onToggleExpanded={() => toggleExpenseEntryExpanded(entry.id)}
                  onRemove={() => removeExpenseEntry(entry.id)}
                  canRemove={formState.expenseEntries.length > 1}
                  getPropertyUnits={getPropertyUnits}
                />
              ))}

              <button
                onClick={addExpenseEntry}
                className="flex items-center justify-center gap-2 py-2 text-blue-600 font-medium border border-dashed border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <span>+</span>
                <span>Add Expense</span>
              </button>
            </div>
          </FormSection>
        </FormLayout>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Submit
          </button>
        </div>
      </div>
    </PageTemplate>
  );
}

// Hour Entry Card Component
interface HourEntryCardProps {
  entry: HourEntry;
  index: number;
  properties: typeof PROPERTIES;
  tasks: typeof TASKS;
  yesNoOptions: typeof YES_NO_OPTIONS;
  onUpdate: (updates: Partial<HourEntry>) => void;
  onToggleExpanded: () => void;
  onRemove: () => void;
  canRemove: boolean;
  getPropertyUnits: (propertyId: string) => typeof PROPERTIES[0]["units"];
}

function HourEntryCard({
  entry,
  index,
  properties,
  tasks,
  yesNoOptions,
  onUpdate,
  onToggleExpanded,
  onRemove,
  canRemove,
  getPropertyUnits,
}: HourEntryCardProps) {
  const propertyUnits = getPropertyUnits(entry.property).map((unit) => ({
    value: unit.id,
    label: unit.name,
  }));

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100" onClick={onToggleExpanded}>
        <div className="flex items-center gap-3">
          <span>{entry.isExpanded ? "▼" : "▶"}</span>
          <ClockIcon width={16} height={16} />
          <span className="font-medium text-gray-900">Hours Entry {index}</span>
          {entry.hours > 0 && (
            <span className="ml-2 text-gray-600">{entry.hours}h</span>
          )}
        </div>
        {canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-gray-500 hover:text-red-600 transition-colors"
            title="Remove entry"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Content */}
      {entry.isExpanded && (
        <div className="p-4 space-y-4">
          <FormFieldRow columns={2}>
            <div>
              <SelectField
                label="Property"
                required
                value={entry.property}
                onChange={(value) => onUpdate({ property: value, unit: "" })}
                options={properties.map((p) => ({ value: p.id, label: p.name }))}
                placeholder="Select Property"
              />
            </div>
            <div>
              <SelectField
                label="Unit"
                value={entry.unit}
                onChange={(value) => onUpdate({ unit: value })}
                options={propertyUnits}
                placeholder="Select Unit If Applicable"
                disabled={!entry.property}
              />
            </div>
          </FormFieldRow>

          <SelectField
            label="Task"
            required
            value={entry.task}
            onChange={(value) => onUpdate({ task: value })}
            options={tasks}
            placeholder="Select Task Or N/A"
          />

          <FormFieldRow columns={2}>
            <div>
              <DateField
                label="Date"
                required
                value={entry.date}
                onChange={(value) => onUpdate({ date: value as Date | null })}
                placeholder="MM/DD/YYYY"
              />
            </div>
            <div>
              <NumberField
                label="Hours"
                required
                value={entry.hours}
                onChange={(value) => onUpdate({ hours: value })}
                placeholder="0"
                min={0}
                max={99}
              />
            </div>
          </FormFieldRow>

          <FormFieldRow columns={2}>
            <div>
              <SelectField
                label="Emergency Rate?"
                required
                value={entry.emergencyRate}
                onChange={(value) => onUpdate({ emergencyRate: value })}
                options={yesNoOptions}
              />
            </div>
            <div>
              <SelectField
                label="Non-Billable Hours?"
                required
                value={entry.nonBillableHours}
                onChange={(value) => onUpdate({ nonBillableHours: value })}
                options={yesNoOptions}
              />
            </div>
          </FormFieldRow>

          <TextAreaField
            label="Note"
            value={entry.note}
            onChange={(e) => onUpdate({ note: e.target.value })}
            placeholder="Notes for Hour entry"
            rows={3}
          />
        </div>
      )}
    </div>
  );
}

// Expense Entry Card Component
interface ExpenseEntryCardProps {
  entry: ExpenseEntry;
  index: number;
  properties: typeof PROPERTIES;
  tasks: typeof TASKS;
  chargeTypes: typeof CHARGE_TYPES;
  yesNoOptions: typeof YES_NO_OPTIONS;
  onUpdate: (updates: Partial<ExpenseEntry>) => void;
  onToggleExpanded: () => void;
  onRemove: () => void;
  canRemove: boolean;
  getPropertyUnits: (propertyId: string) => typeof PROPERTIES[0]["units"];
}

function ExpenseEntryCard({
  entry,
  index,
  properties,
  tasks,
  chargeTypes,
  yesNoOptions,
  onUpdate,
  onToggleExpanded,
  onRemove,
  canRemove,
  getPropertyUnits,
}: ExpenseEntryCardProps) {
  const propertyUnits = getPropertyUnits(entry.property).map((unit) => ({
    value: unit.id,
    label: unit.name,
  }));

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100" onClick={onToggleExpanded}>
        <div className="flex items-center gap-3">
          <span>{entry.isExpanded ? "▼" : "▶"}</span>
          <DollarIcon width={16} height={16} />
          <span className="font-medium text-gray-900">Expense Entry {index}</span>
          {entry.amount && (
            <span className="ml-2 text-gray-600">${parseFloat(entry.amount).toFixed(2)}</span>
          )}
        </div>
        {canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-gray-500 hover:text-red-600 transition-colors"
            title="Remove entry"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Content */}
      {entry.isExpanded && (
        <div className="p-4 space-y-4">
          <FormFieldRow columns={2}>
            <div>
              <DateField
                label="Date"
                required
                value={entry.date}
                onChange={(value) => onUpdate({ date: value as Date | null })}
                placeholder="MM/DD/YYYY"
              />
            </div>
            <div>
              <SelectField
                label="Property"
                required
                value={entry.property}
                onChange={(value) => onUpdate({ property: value, unit: "" })}
                options={properties.map((p) => ({ value: p.id, label: p.name }))}
                placeholder="Select Property"
              />
            </div>
          </FormFieldRow>

          <FormFieldRow columns={2}>
            <div>
              <SelectField
                label="Unit"
                value={entry.unit}
                onChange={(value) => onUpdate({ unit: value })}
                options={propertyUnits}
                placeholder="Select Unit If Applicable"
                disabled={!entry.property}
              />
            </div>
            <div>
              <SelectField
                label="Task"
                required
                value={entry.task}
                onChange={(value) => onUpdate({ task: value })}
                options={tasks}
                placeholder="Select Task Or N/A"
              />
            </div>
          </FormFieldRow>

          <FormFieldRow columns={2}>
            <div>
              <CurrencyField
                label="Amount"
                required
                value={entry.amount}
                onChange={(value) => onUpdate({ amount: value })}
                placeholder="$0.00"
              />
            </div>
            <div>
              <SelectField
                label="Charge Type"
                required
                value={entry.chargeType}
                onChange={(value) => onUpdate({ chargeType: value })}
                options={chargeTypes}
              />
            </div>
          </FormFieldRow>

          <SelectField
            label="Vendor"
            required
            value={entry.vendor}
            onChange={(value) => onUpdate({ vendor: value })}
            placeholder="Select Vendor Paid Or N/A"
            options={[{ value: "na", label: "N/A" }]}
          />

          <TextAreaField
            label="Note"
            value={entry.note}
            onChange={(e) => onUpdate({ note: e.target.value })}
            placeholder="notes for Expense Entry"
            rows={3}
          />

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Receipts
            </label>
            <AttachmentUploader
              files={entry.receipts}
              onFilesAdded={(files) => onUpdate({ receipts: [...entry.receipts, ...files] })}
              onFileRemoved={(fileId) =>
                onUpdate({
                  receipts: entry.receipts.filter((f) => f.id !== fileId),
                })
              }
              maxSize={500 * 1024 * 1024}
            />
          </div>
        </div>
      )}
    </div>
  );
}
