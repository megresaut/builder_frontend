import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import { ClockIcon, DollarIcon, PlusIcon, DeleteIcon, CloseIcon } from "@/components/icons";
import { ChevronRight, ChevronDown } from "lucide-react";
import {
  DateField,
  SelectField,
  NumberField,
  CurrencyField,
  TextAreaField,
} from "@/components/forms";
import {
  PROPERTIES,
  CHARGE_TYPES,
  TASKS,
  YES_NO_OPTIONS,
} from "@/data/fto/properties";
import { VENDORS } from "@/data/fto/vendors";

interface HourEntry {
  id: string;
  isExpanded: boolean;
  date: string | null;
  propertyId: string | null;
  unitId: string | null;
  taskId: string | null;
  hours: number | string;
  emergencyRate: string | null;
  nonBillableHours: string | null;
  note: string;
}

interface ExpenseEntry {
  id: string;
  isExpanded: boolean;
  date: string | null;
  propertyId: string | null;
  unitId: string | null;
  taskId: string | null;
  amount: number | string;
  chargeType: string | null;
  vendorId: string | null;
  note: string;
}

interface HourEntryErrors {
  [key: string]: {
    date?: string;
    propertyId?: string;
    unitId?: string;
    taskId?: string;
    hours?: string;
    emergencyRate?: string;
    nonBillableHours?: string;
    note?: string;
  };
}

interface ExpenseEntryErrors {
  [key: string]: {
    date?: string;
    propertyId?: string;
    unitId?: string;
    taskId?: string;
    amount?: string;
    chargeType?: string;
    vendorId?: string;
    note?: string;
  };
}

export default function FtoSubmissionForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ftoId } = useParams();

  const [hourEntries, setHourEntries] = useState<HourEntry[]>([
    {
      id: "hour-1",
      isExpanded: true,
      date: null,
      propertyId: null,
      unitId: null,
      taskId: null,
      hours: "",
      emergencyRate: null,
      nonBillableHours: null,
      note: "",
    },
  ]);

  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([
    {
      id: "expense-1",
      isExpanded: true,
      date: null,
      propertyId: null,
      unitId: null,
      taskId: null,
      amount: "",
      chargeType: null,
      vendorId: null,
      note: "",
    },
  ]);

  const [hourErrors, setHourErrors] = useState<HourEntryErrors>({});
  const [expenseErrors, setExpenseErrors] = useState<ExpenseEntryErrors>({});

  const toggleHourEntry = (id: string) => {
    setHourEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, isExpanded: !entry.isExpanded } : entry
      )
    );
  };

  const toggleExpenseEntry = (id: string) => {
    setExpenseEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, isExpanded: !entry.isExpanded } : entry
      )
    );
  };

  const addHourEntry = () => {
    setHourEntries((prev) => [
      ...prev,
      {
        id: `hour-${Date.now()}`,
        isExpanded: true,
        date: null,
        propertyId: null,
        unitId: null,
        taskId: null,
        hours: "",
        emergencyRate: null,
        nonBillableHours: null,
        note: "",
      },
    ]);
  };

  const addExpenseEntry = () => {
    setExpenseEntries((prev) => [
      ...prev,
      {
        id: `expense-${Date.now()}`,
        isExpanded: true,
        date: null,
        propertyId: null,
        unitId: null,
        taskId: null,
        amount: "",
        chargeType: null,
        vendorId: null,
        note: "",
      },
    ]);
  };

  const updateHourEntry = (id: string, field: keyof HourEntry, value: any) => {
    setHourEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const updateExpenseEntry = (
    id: string,
    field: keyof ExpenseEntry,
    value: any
  ) => {
    setExpenseEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const deleteHourEntry = (id: string) => {
    setHourEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const deleteExpenseEntry = (id: string) => {
    setExpenseEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const getPropertyUnits = (propertyId: string | null) => {
    if (!propertyId) return [];
    const property = PROPERTIES.find((p) => p.id === propertyId);
    return property?.units || [];
  };

  const vendorOptions = VENDORS.map((vendor) => ({
    value: vendor.id,
    label: vendor.name,
  }));

  const validateForm = (): boolean => {
    const newHourErrors: HourEntryErrors = {};
    const newExpenseErrors: ExpenseEntryErrors = {};
    let isValid = true;

    // Validate hour entries
    for (const entry of hourEntries) {
      const errors: any = {};

      if (!entry.date) {
        errors.date = "Date is required";
        isValid = false;
      }
      if (!entry.propertyId) {
        errors.propertyId = "Property is required";
        isValid = false;
      }
      if (!entry.unitId) {
        errors.unitId = "Unit is required";
        isValid = false;
      }
      if (!entry.taskId) {
        errors.taskId = "Task is required";
        isValid = false;
      }
      if (!entry.hours) {
        errors.hours = "Hours is required";
        isValid = false;
      }
      if (!entry.emergencyRate) {
        errors.emergencyRate = "Emergency Rate is required";
        isValid = false;
      }
      if (!entry.nonBillableHours) {
        errors.nonBillableHours = "Non-Billable Hours is required";
        isValid = false;
      }
      if (Object.keys(errors).length > 0) {
        newHourErrors[entry.id] = errors;
      }
    }

    // Validate expense entries
    for (const entry of expenseEntries) {
      const errors: any = {};

      if (!entry.date) {
        errors.date = "Date is required";
        isValid = false;
      }
      if (!entry.propertyId) {
        errors.propertyId = "Property is required";
        isValid = false;
      }
      if (!entry.unitId) {
        errors.unitId = "Unit is required";
        isValid = false;
      }
      if (!entry.taskId) {
        errors.taskId = "Task is required";
        isValid = false;
      }
      if (!entry.amount) {
        errors.amount = "Amount is required";
        isValid = false;
      }
      if (!entry.chargeType) {
        errors.chargeType = "Charge Type is required";
        isValid = false;
      }
      if (!entry.vendorId) {
        errors.vendorId = "Vendor is required";
        isValid = false;
      }

      if (Object.keys(errors).length > 0) {
        newExpenseErrors[entry.id] = errors;
      }
    }

    setHourErrors(newHourErrors);
    setExpenseErrors(newExpenseErrors);
    return isValid;
  };

  return (
    <PageTemplate>
      <div className="flex flex-col items-center w-full px-6 py-9">
        <div className="w-full max-w-[700px] flex flex-col gap-7">
          {/* Title and Divider */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h1
                className="text-[28px] font-semibold text-[#303030] leading-[26px]"
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                }}
              >
                Submission Summary
              </h1>
              <button
                onClick={() => navigate("/fto")}
                className="text-[#303030] hover:opacity-70 transition-opacity"
                aria-label="Close submission form"
              >
                <CloseIcon width={20} height={20} />
              </button>
            </div>
            <div className="h-px w-full bg-[#E5E5E5]" />
          </div>

          <div className="flex flex-col gap-6">
            {/* Hours Section */}
            <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col gap-4">
              {/* Hours Header */}
              <div className="flex items-center justify-between pr-3">
                <div className="flex items-center gap-2">
                  <ClockIcon width={16} height={16} />
                  <span
                    className="text-base font-medium text-[#303030]"
                    style={{
                      fontFamily:
                        "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    }}
                  >
                    Hours
                  </span>
                </div>
              </div>

              {/* Hour Entries */}
              <div className="flex flex-col gap-4">
                {hourEntries.map((entry, index) => (
                  <div key={entry.id}>
                    {/* Entry Header */}
                    <div className="flex items-center justify-between pr-3">
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => toggleHourEntry(entry.id)}
                      >
                        {entry.isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[#303030]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#303030]" />
                        )}
                        <span
                          className="text-base font-medium text-[#303030]"
                          style={{
                            fontFamily:
                              "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                          }}
                        >
                          Hours Entry
                        </span>
                        <div className="w-5 h-5 rounded bg-[#BEE9FF] flex items-center justify-center">
                          <span
                            className="text-base font-medium text-[#2463EB]"
                            style={{
                              fontFamily:
                                "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                            }}
                          >
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteHourEntry(entry.id)}
                        className="text-[#982740] hover:opacity-70 transition-opacity"
                      >
                        <DeleteIcon width={16} height={16} />
                      </button>
                    </div>

                    {index < hourEntries.length - 1 && (
                      <div className="h-px w-full bg-[#E5E5E5] mt-4" />
                    )}

                    {/* Expanded Content */}
                    {entry.isExpanded && (
                      <div className="flex flex-col gap-4 mt-4">
                        <DateField
                          label="Date"
                          required
                          error={hourErrors[entry.id]?.date}
                          value={entry.date}
                          onChange={(date) => {
                            setHourErrors((prev) => {
                              const newErrors = { ...prev };
                              if (newErrors[entry.id]) {
                                delete newErrors[entry.id].date;
                              }
                              return newErrors;
                            });
                            updateHourEntry(
                              entry.id,
                              "date",
                              date instanceof Date
                                ? date.toISOString().split("T")[0]
                                : date
                            );
                          }}
                          placeholder="mm/dd/yyyy"
                          returnFormat="ISO"
                        />

                        {/* Property and Unit Row */}
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <SelectField
                              label="Property"
                              required
                              error={hourErrors[entry.id]?.propertyId}
                              options={PROPERTIES.map((p) => ({
                                value: p.id,
                                label: p.name,
                              }))}
                              value={entry.propertyId || ""}
                              onChange={(value) => {
                                setHourErrors((prev) => {
                                  const newErrors = { ...prev };
                                  if (newErrors[entry.id]) {
                                    delete newErrors[entry.id].propertyId;
                                  }
                                  return newErrors;
                                });
                                updateHourEntry(entry.id, "propertyId", value);
                              }}
                              placeholder="Select Property"
                            />
                          </div>
                          <div className="flex-1">
                            <SelectField
                              label="Unit"
                              required
                              error={hourErrors[entry.id]?.unitId}
                              options={getPropertyUnits(entry.propertyId).map(
                                (u) => ({
                                  value: u.id,
                                  label: u.name,
                                })
                              )}
                              value={entry.unitId || ""}
                              onChange={(value) => {
                                setHourErrors((prev) => {
                                  const newErrors = { ...prev };
                                  if (newErrors[entry.id]) {
                                    delete newErrors[entry.id].unitId;
                                  }
                                  return newErrors;
                                });
                                updateHourEntry(entry.id, "unitId", value);
                              }}
                              placeholder="Select unit if applicable"
                              disabled={!entry.propertyId}
                            />
                          </div>
                        </div>

                        <SelectField
                          label="Task"
                          required
                          error={hourErrors[entry.id]?.taskId}
                          options={TASKS}
                          value={entry.taskId || ""}
                          onChange={(value) => {
                            setHourErrors((prev) => {
                              const newErrors = { ...prev };
                              if (newErrors[entry.id]) {
                                delete newErrors[entry.id].taskId;
                              }
                              return newErrors;
                            });
                            updateHourEntry(entry.id, "taskId", value);
                          }}
                          placeholder="Select Task Or N/A"
                        />

                        <NumberField
                          label="Hours"
                          required
                          error={hourErrors[entry.id]?.hours}
                          placeholder="0"
                          value={entry.hours}
                          onChange={(e) => {
                            setHourErrors((prev) => {
                              const newErrors = { ...prev };
                              if (newErrors[entry.id]) {
                                delete newErrors[entry.id].hours;
                              }
                              return newErrors;
                            });
                            updateHourEntry(
                              entry.id,
                              "hours",
                              e.target.value
                            );
                          }}
                          step="0.5"
                          min="0"
                        />

                        <SelectField
                          label="Emergency Rate?"
                          required
                          error={hourErrors[entry.id]?.emergencyRate}
                          options={YES_NO_OPTIONS}
                          value={entry.emergencyRate || ""}
                          onChange={(value) => {
                            setHourErrors((prev) => {
                              const newErrors = { ...prev };
                              if (newErrors[entry.id]) {
                                delete newErrors[entry.id].emergencyRate;
                              }
                              return newErrors;
                            });
                            updateHourEntry(
                              entry.id,
                              "emergencyRate",
                              value
                            );
                          }}
                          placeholder="Select an option"
                        />

                        <SelectField
                          label="Non-Billable Hours?"
                          required
                          error={hourErrors[entry.id]?.nonBillableHours}
                          options={YES_NO_OPTIONS}
                          value={entry.nonBillableHours || ""}
                          onChange={(value) => {
                            setHourErrors((prev) => {
                              const newErrors = { ...prev };
                              if (newErrors[entry.id]) {
                                delete newErrors[entry.id].nonBillableHours;
                              }
                              return newErrors;
                            });
                            updateHourEntry(
                              entry.id,
                              "nonBillableHours",
                              value
                            );
                          }}
                          placeholder="Select an option"
                        />

                        <TextAreaField
                          label="Note"
                          placeholder="Notes for Hour entry"
                          value={entry.note}
                          onChange={(e) =>
                            updateHourEntry(entry.id, "note", e.target.value)
                          }
                          autoGrow
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Hour Entry Button */}
                <button
                  onClick={addHourEntry}
                  className="rounded-lg bg-white border border-dashed border-[rgba(18,18,18,0.4)] px-3 py-2 flex items-center justify-center gap-2"
                >
                  <PlusIcon width={16} height={16} color="#2463EB" />
                  <span
                    className="text-base font-medium text-[#2463EB]"
                    style={{
                      fontFamily:
                        "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                      letterSpacing: "-0.32px",
                      lineHeight: "1.4",
                    }}
                  >
                    Add hour Entry
                  </span>
                </button>
              </div>
            </div>

            {/* Expense Entry Section */}
            <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col gap-4">
              {/* Expense Header */}
              <div className="flex items-center justify-between pr-3">
                <div className="flex items-center gap-2">
                  <DollarIcon width={16} height={16} />
                  <span
                    className="text-base font-medium text-[#303030]"
                    style={{
                      fontFamily:
                        "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    }}
                  >
                    Expense Entry
                  </span>
                </div>
              </div>

              {/* Expense Entries */}
              <div className="flex flex-col gap-4">
                {expenseEntries.map((entry, index) => (
                  <div key={entry.id}>
                    {/* Entry Header */}
                    <div className="flex items-center justify-between pr-3">
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => toggleExpenseEntry(entry.id)}
                      >
                        {entry.isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[#303030]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#303030]" />
                        )}
                        <span
                          className="text-base font-medium text-[#303030]"
                          style={{
                            fontFamily:
                              "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                          }}
                        >
                          Expense Entry
                        </span>
                        <div className="w-5 h-5 rounded bg-[#BEE9FF] flex items-center justify-center">
                          <span
                            className="text-base font-medium text-[#2463EB]"
                            style={{
                              fontFamily:
                                "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                            }}
                          >
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteExpenseEntry(entry.id)}
                        className="text-[#982740] hover:opacity-70 transition-opacity"
                      >
                        <DeleteIcon width={16} height={16} />
                      </button>
                    </div>

                    {index < expenseEntries.length - 1 && (
                      <div className="h-px w-full bg-[#E5E5E5] mt-4" />
                    )}

                    {/* Expanded Content */}
                    {entry.isExpanded && (
                      <div className="flex flex-col gap-4 mt-4">
                        <DateField
                          label="Date"
                          required
                          error={expenseErrors[entry.id]?.date}
                          value={entry.date}
                          onChange={(date) => {
                            setExpenseErrors((prev) => {
                              const newErrors = { ...prev };
                              if (newErrors[entry.id]) {
                                delete newErrors[entry.id].date;
                              }
                              return newErrors;
                            });
                            updateExpenseEntry(
                              entry.id,
                              "date",
                              date instanceof Date
                                ? date.toISOString().split("T")[0]
                                : date
                            );
                          }}
                          placeholder="mm/dd/yyyy"
                          returnFormat="ISO"
                        />

                        {/* Property and Unit Row */}
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <SelectField
                              label="Property"
                              required
                              error={expenseErrors[entry.id]?.propertyId}
                              options={PROPERTIES.map((p) => ({
                                value: p.id,
                                label: p.name,
                              }))}
                              value={entry.propertyId || ""}
                              onChange={(value) => {
                                setExpenseErrors((prev) => {
                                  const newErrors = { ...prev };
                                  if (newErrors[entry.id]) {
                                    delete newErrors[entry.id].propertyId;
                                  }
                                  return newErrors;
                                });
                                updateExpenseEntry(
                                  entry.id,
                                  "propertyId",
                                  value
                                );
                              }}
                              placeholder="Select Property"
                            />
                          </div>
                          <div className="flex-1">
                            <SelectField
                              label="Unit"
                              required
                              error={expenseErrors[entry.id]?.unitId}
                              options={getPropertyUnits(
                                entry.propertyId
                              ).map((u) => ({
                                value: u.id,
                                label: u.name,
                              }))}
                              value={entry.unitId || ""}
                              onChange={(value) => {
                                setExpenseErrors((prev) => {
                                  const newErrors = { ...prev };
                                  if (newErrors[entry.id]) {
                                    delete newErrors[entry.id].unitId;
                                  }
                                  return newErrors;
                                });
                                updateExpenseEntry(entry.id, "unitId", value);
                              }}
                              placeholder="Select unit if applicable"
                              disabled={!entry.propertyId}
                            />
                          </div>
                        </div>

                        <SelectField
                          label="Task"
                          required
                          error={expenseErrors[entry.id]?.taskId}
                          options={TASKS}
                          value={entry.taskId || ""}
                          onChange={(value) => {
                            setExpenseErrors((prev) => {
                              const newErrors = { ...prev };
                              if (newErrors[entry.id]) {
                                delete newErrors[entry.id].taskId;
                              }
                              return newErrors;
                            });
                            updateExpenseEntry(entry.id, "taskId", value);
                          }}
                          placeholder="Select Task Or N/A"
                        />

                        <CurrencyField
                          label="Amount"
                          required
                          error={expenseErrors[entry.id]?.amount}
                          placeholder="$0.00"
                          value={entry.amount}
                          onChange={(value) => {
                            setExpenseErrors((prev) => {
                              const newErrors = { ...prev };
                              if (newErrors[entry.id]) {
                                delete newErrors[entry.id].amount;
                              }
                              return newErrors;
                            });
                            updateExpenseEntry(entry.id, "amount", value);
                          }}
                        />

                        <SelectField
                          label="Charge Type"
                          required
                          error={expenseErrors[entry.id]?.chargeType}
                          options={CHARGE_TYPES}
                          value={entry.chargeType || ""}
                          onChange={(value) => {
                            setExpenseErrors((prev) => {
                              const newErrors = { ...prev };
                              if (newErrors[entry.id]) {
                                delete newErrors[entry.id].chargeType;
                              }
                              return newErrors;
                            });
                            updateExpenseEntry(entry.id, "chargeType", value);
                          }}
                          placeholder="Select an option"
                        />

                        <SelectField
                          label="Vendor"
                          required
                          error={expenseErrors[entry.id]?.vendorId}
                          options={vendorOptions}
                          value={entry.vendorId || ""}
                          onChange={(value) => {
                            setExpenseErrors((prev) => {
                              const newErrors = { ...prev };
                              if (newErrors[entry.id]) {
                                delete newErrors[entry.id].vendorId;
                              }
                              return newErrors;
                            });
                            updateExpenseEntry(entry.id, "vendorId", value);
                          }}
                          placeholder="Select Vendor Paid Or N/A"
                        />

                        <TextAreaField
                          label="Note"
                          placeholder="notes for Expense Entry"
                          value={entry.note}
                          onChange={(e) =>
                            updateExpenseEntry(entry.id, "note", e.target.value)
                          }
                          autoGrow
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Expense Button */}
                <button
                  onClick={addExpenseEntry}
                  className="rounded-lg bg-white border border-dashed border-[rgba(18,18,18,0.4)] px-3 py-2 flex items-center justify-center gap-2"
                >
                  <PlusIcon width={16} height={16} color="#2463EB" />
                  <span
                    className="text-base font-medium text-[#2463EB]"
                    style={{
                      fontFamily:
                        "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                      letterSpacing: "-0.32px",
                      lineHeight: "1.4",
                    }}
                  >
                    Add Expense
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 mt-9">
            <button
              onClick={() => navigate("/fto")}
              className="rounded-lg bg-[#FBFBFB] border border-[#DADADA] shadow-[0_1px_3px_rgba(0,0,0,0.03)] px-3 py-2 min-h-[36px] flex items-center justify-center"
            >
              <span
                className="text-base text-[#303030] font-normal"
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  letterSpacing: "-0.32px",
                  lineHeight: "1.4",
                }}
              >
                Back
              </span>
            </button>
            <button
              onClick={() => {
                if (validateForm()) {
                  navigate("/fto");
                }
              }}
              className="rounded-lg bg-[#013764] border border-white shadow-[0_0_0_1px_#002D5A] px-3 py-2 min-h-[36px] flex items-center justify-center"
            >
              <span
                className="text-base text-white font-medium"
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                }}
              >
                Submit
              </span>
            </button>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
