import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import BlueButton from "@/components/BlueButton";
import { CloseIcon } from "@/components/icons";
import { SelectField, DateField, ComboboxField } from "@/components/forms";
import { DateTimeField } from "@/components/forms/DateTimeField";
import { NumberField } from "@/components/forms/NumberField";
import { fetchJSON } from "@/api/fetchJSON";
import { useAuth } from "@/auth/useAuth";
import {
  BackendInspectionChecklist,
  createInspection,
  createRecurringInspection,
  listChecklists,
  InspectionFrequency,
} from "@/api/inspections";
import {
  PROPERTY_LEVEL_LABEL,
  PROPERTY_LEVEL_SHORT_LABEL,
  PROPERTY_LEVEL_UNIT_ID,
} from "@/utils/unitLabel";

export default function FtoInspectionCreate() {
  const navigate = useNavigate();
  const { userId: authUserId } = useAuth();

  // Resolve userId with localStorage fallback (useAuth is async)
  const userId = useMemo(() => {
    if (authUserId) return authUserId;
    const stored = localStorage.getItem("avm_user_id");
    if (stored) {
      const parsed = Number(stored);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }, [authUserId]);

  // ISO string "YYYY-MM-DDTHH:MM" — format used by DateTimeField.
  const initialDateTime = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }, []);
  const [dateTime, setDateTime] = useState<string>(initialDateTime);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [frequency, setFrequency] = useState<InspectionFrequency>("monthly");
  const [intervalCount, setIntervalCount] = useState<number>(1);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API State
  const [properties, setProperties] = useState<any[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [unitsByProperty, setUnitsByProperty] = useState<
    Record<string, any[]>
  >({});
  const [unitsLoading, setUnitsLoading] = useState<Record<string, boolean>>({});
  const [templatesByProperty, setTemplatesByProperty] = useState<
    Record<string, BackendInspectionChecklist[]>
  >({});
  const [templatesLoading, setTemplatesLoading] = useState<
    Record<string, boolean>
  >({});

  const [validationErrors, setValidationErrors] = useState<{
    date?: string;
    property?: string;
    template?: string;
  }>({});

  // Load properties
  useEffect(() => {
    let isMounted = true;
    const loadProperties = async () => {
      try {
        setPropertiesLoading(true);
        const data: any[] = await fetchJSON("/properties");
        if (!isMounted) return;
        setProperties(data.filter((p) => p.active));
      } catch (err) {
        console.error("Failed to load properties:", err);
      } finally {
        if (isMounted) setPropertiesLoading(false);
      }
    };
    loadProperties();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadUnitsForProperty = async (propId: string) => {
    if (unitsByProperty[propId]) return;
    try {
      setUnitsLoading((prev) => ({ ...prev, [propId]: true }));
      const data: any[] = await fetchJSON(`/properties/${propId}/units`);
      setUnitsByProperty((prev) => ({ ...prev, [propId]: data || [] }));
    } catch (err) {
      console.error("Failed to load units:", err);
      setUnitsByProperty((prev) => ({ ...prev, [propId]: [] }));
    } finally {
      setUnitsLoading((prev) => ({ ...prev, [propId]: false }));
    }
  };

  const loadTemplatesForProperty = async (propId: string) => {
    if (templatesByProperty[propId]) return;
    try {
      setTemplatesLoading((prev) => ({ ...prev, [propId]: true }));
      const data = await listChecklists(Number(propId));
      setTemplatesByProperty((prev) => ({ ...prev, [propId]: data || [] }));
    } catch (err) {
      console.error("Failed to load templates:", err);
      setTemplatesByProperty((prev) => ({ ...prev, [propId]: [] }));
    } finally {
      setTemplatesLoading((prev) => ({ ...prev, [propId]: false }));
    }
  };

  const getUnitOptions = (propId: string | null) => {
    if (!propId) return [];
    const units = (unitsByProperty[propId] || []).map((u: any) => ({
      value: String(u.id),
      label: u.unit_name
        ? `${u.unit_name}${u.address_1 ? ` — ${u.address_1}` : ""}`
        : `Unit #${u.id}`,
    }));
    return [
      {
        value: String(PROPERTY_LEVEL_UNIT_ID),
        label: PROPERTY_LEVEL_LABEL,
        displayLabel: PROPERTY_LEVEL_SHORT_LABEL,
      },
      ...units,
    ];
  };

  const getTemplateOptions = (propId: string | null) => {
    if (!propId) return [];
    return (templatesByProperty[propId] || []).map((t) => ({
      value: String(t.id),
      label: t.name,
    }));
  };

  const handleCreate = async () => {
    const errors: typeof validationErrors = {};
    if (!dateTime) errors.date = "Date and time are required";
    if (!propertyId) errors.property = "Property is required";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});

    const parsedPropertyId = Number(propertyId);
    const parsedTemplateId = templateId ? Number(templateId) : null;
    const parsedUnitId =
      unitId &&
      unitId !== "na" &&
      unitId !== String(PROPERTY_LEVEL_UNIT_ID) &&
      Number.isFinite(Number(unitId))
        ? Number(unitId)
        : null;

    const basePayload = {
      property_id: parsedPropertyId,
      unit_id: parsedUnitId,
      checklist_id: parsedTemplateId,
      assigned_field_team_member_id: userId ?? null,
      status: isRecurring ? "scheduled" : "draft",
      due_date: new Date(dateTime).toISOString(),
    };

    setIsSubmitting(true);
    try {
      if (isRecurring) {
        const result = await createRecurringInspection(basePayload, {
          frequency,
          interval_count: intervalCount,
          end_at: endDate ? endDate.toISOString() : null,
        });
        const first = result.occurrences?.[0];
        if (first) {
          navigate(`/fto/inspections/${first.id}`);
        } else {
          navigate("/fto/inspections");
        }
      } else {
        const created = await createInspection(basePayload);
        navigate(`/fto/inspections/${created.id}`);
      }
    } catch (error) {
      console.error("Failed to create inspection:", error);
      alert("Failed to create inspection. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const frequencyOptions: { value: InspectionFrequency; label: string }[] = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  return (
    <PageTemplate className="!px-4 !pt-6 !pb-24 max-w-none !min-w-0 lg:!px-6 lg:!py-9">
      <div className="flex flex-col items-center w-full">
        <div className="w-full lg:max-w-[600px] flex flex-col gap-7">
          {/* Header */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h1
                className="text-[28px] font-semibold text-[#303030] leading-[26px]"
                style={{ fontFamily: "Geist, sans-serif" }}
              >
                New Inspection
              </h1>
              <button
                onClick={() => navigate("/fto/inspections")}
                className="text-[#303030] hover:opacity-70 transition-opacity"
              >
                <CloseIcon width={20} height={20} />
              </button>
            </div>
            <div className="h-px w-full bg-[#E5E5E5]" />
          </div>

          {/* Details Card */}
          <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-6">
            <h2 className="text-lg font-medium text-gray-900">
              Inspection Details
            </h2>

            <div className="flex flex-col gap-4">
              <DateTimeField
                label="Date & Time"
                required
                value={dateTime}
                onChange={(v) => setDateTime(v)}
                error={validationErrors.date}
              />

              <ComboboxField
                label="Property"
                required
                options={properties.map((p) => ({
                  value: String(p.id),
                  label: p.name,
                }))}
                value={propertyId || ""}
                onChange={(value) => {
                  const newPropertyId =
                    typeof value === "string" ? value : value || null;
                  setPropertyId(newPropertyId);
                  setUnitId(null);
                  setTemplateId(null);
                  if (newPropertyId) {
                    loadUnitsForProperty(newPropertyId);
                    loadTemplatesForProperty(newPropertyId);
                  }
                }}
                placeholder={
                  propertiesLoading
                    ? "Loading properties..."
                    : "Select Property"
                }
                disabled={propertiesLoading}
                error={validationErrors.property}
              />

              <SelectField
                label="Unit"
                options={getUnitOptions(propertyId)}
                value={unitId || ""}
                onChange={(value) =>
                  setUnitId(
                    typeof value === "string" ? value : value[0] || null
                  )
                }
                placeholder={
                  !propertyId
                    ? "Select property first"
                    : unitsLoading[propertyId!]
                    ? "Loading units…"
                    : "Select Unit"
                }
                disabled={!propertyId || (!!propertyId && unitsLoading[propertyId])}
              />

              <SelectField
                label="Inspection Template (optional)"
                options={getTemplateOptions(propertyId)}
                value={templateId || ""}
                onChange={(value) =>
                  setTemplateId(
                    typeof value === "string" ? value : value[0] || null
                  )
                }
                placeholder={
                  !propertyId
                    ? "Select property first"
                    : templatesLoading[propertyId!]
                    ? "Loading templates…"
                    : "No template — photos only"
                }
                disabled={!propertyId || (!!propertyId && templatesLoading[propertyId])}
                error={validationErrors.template}
              />

              <label className="flex items-center gap-2 text-sm text-[#303030]">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="h-4 w-4"
                />
                Repeat this inspection
              </label>

              {isRecurring && (
                <div className="flex flex-col gap-4 pl-6 border-l-2 border-[#E5E5E5]">
                  <SelectField
                    label="Frequency"
                    options={frequencyOptions}
                    value={frequency}
                    onChange={(v) => setFrequency((typeof v === "string" ? v : v[0]) as InspectionFrequency)}
                    placeholder="Select frequency"
                  />
                  <NumberField
                    label={`Every N ${frequency === "daily" ? "days" : frequency === "weekly" ? "weeks" : "months"}`}
                    value={intervalCount}
                    onChange={(v) => setIntervalCount(typeof v === "number" ? v : 1)}
                    min={1}
                  />
                  <DateField
                    label="End Date (optional)"
                    value={endDate}
                    onChange={(d) => setEndDate(d instanceof Date ? d : d ? new Date(d) : null)}
                    placeholder="Leave blank to generate up to 52 occurrences"
                    returnFormat="Date"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => navigate("/fto/inspections")}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <BlueButton onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Inspection"}
            </BlueButton>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
