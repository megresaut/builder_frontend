import { useEffect, useState } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { FieldRow, FieldRowItem } from "@/components/ui/ModalTemplate";
import { TextField } from "@/components/forms";
import type { LocationRow } from "./LocationsList";

export interface LocationFormValues {
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
}

interface LocationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Absent in create mode. */
  location?: LocationRow | null;
  onSubmit: (values: LocationFormValues) => Promise<void>;
}

const EMPTY: LocationFormValues = {
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
};

/** Wording for the warning line under the fields; empty when nothing links here. */
export const describeUsage = (loc?: LocationRow | null): string => {
  if (!loc) return "";
  const u = loc.usage;
  if (!u) return "";
  const parts: string[] = [];
  const add = (n: number, one: string, many: string) => {
    if (n > 0) parts.push(`${n} ${n === 1 ? one : many}`);
  };
  add(u.tasks, "task", "tasks");
  add(u.work_orders, "work order", "work orders");
  add(u.field_team_orders, "field team order", "field team orders");
  add(u.fto_submissions, "FTO submission", "FTO submissions");
  add(u.inspections, "inspection", "inspections");
  add(u.recurring_task_series, "recurring series", "recurring series");
  if (parts.length === 0) return "";
  return parts.join(", ");
};

/**
 * Create/edit form for a physical location. One component serves both modes:
 * the fields are identical, and a create is just an edit with no starting row.
 *
 * Validation runs inside onConfirm per the ModalTemplate contract — the primary
 * button always stays clickable and errors surface under the offending field.
 */
export const LocationFormModal: React.FC<LocationFormModalProps> = ({
  open,
  onOpenChange,
  location,
  onSubmit,
}) => {
  const isEdit = Boolean(location);
  const [values, setValues] = useState<LocationFormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof LocationFormValues, string>>>({});
  const [saving, setSaving] = useState(false);

  // Reset on every open/close so a cancelled edit never leaks into the next one.
  useEffect(() => {
    if (!open) {
      setValues(EMPTY);
      setErrors({});
      setSaving(false);
      return;
    }
    setValues(
      location
        ? {
            address_line1: location.address_line1 ?? "",
            address_line2: location.address_line2 ?? "",
            city: location.city ?? "",
            state: location.state ?? "",
            postal_code: location.postal_code ?? "",
          }
        : EMPTY,
    );
    setErrors({});
  }, [open, location]);

  const set = (key: keyof LocationFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleConfirm = async () => {
    if (saving) return;
    // Mirrors the server's own required-field check so the round trip is only
    // spent on submissions that can actually succeed.
    const next: Partial<Record<keyof LocationFormValues, string>> = {};
    if (!values.address_line1.trim()) next.address_line1 = "Address line 1 is required";
    if (!values.city.trim()) next.city = "City is required";
    if (!values.state.trim()) next.state = "State is required";
    if (!values.postal_code.trim()) next.postal_code = "Postal code is required";
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setSaving(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const usageSummary = isEdit ? describeUsage(location) : "";

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit location" : "Add location"}
      size="md"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleConfirm}
          cancelLabel="Cancel"
          confirmLabel={saving ? "Saving..." : isEdit ? "Save changes" : "Create location"}
          cancelDisabled={saving}
        />
      }
    >
      <FormLayout>
        <FormSection>
          <TextField
            label="Address line 1"
            required
            placeholder="19 West Elm Street"
            value={values.address_line1}
            error={errors.address_line1}
            onChange={set("address_line1")}
          />
          <TextField
            label="Address line 2"
            placeholder="2nd Fl"
            value={values.address_line2}
            onChange={set("address_line2")}
          />
          <FieldRow columns={2}>
            <FieldRowItem>
              <TextField
                label="City"
                required
                placeholder="Greenwich"
                value={values.city}
                error={errors.city}
                onChange={set("city")}
              />
            </FieldRowItem>
            <FieldRowItem>
              <TextField
                label="State"
                required
                placeholder="CT"
                value={values.state}
                error={errors.state}
                onChange={set("state")}
              />
            </FieldRowItem>
          </FieldRow>
          <TextField
            label="Postal code"
            required
            placeholder="06830"
            value={values.postal_code}
            error={errors.postal_code}
            onChange={set("postal_code")}
          />
        </FormSection>
      </FormLayout>

      {/* Editing rewrites the address on every record already pointing here, so
          say so plainly rather than letting it be a surprise. */}
      {usageSummary && (
        <p className="mt-4 rounded-md border border-[#e5e5e5] bg-[#fafafa] px-3 py-2 text-sm text-[#717179]">
          Used by {usageSummary}. Editing updates the address everywhere it appears.
        </p>
      )}
    </ModalTemplate>
  );
};

export default LocationFormModal;
