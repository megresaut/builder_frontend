export const PROPERTY_LEVEL_UNIT_ID = 0;
export const PROPERTY_LEVEL_LABEL = "Property Level";
export const PROPERTY_LEVEL_SHORT_LABEL = "PL";

/** Standard placeholder when unit is missing, 0, or property-level. Use everywhere for consistency. */
export const UNIT_EMPTY_DISPLAY = "—";

const EMPTY_UNIT_VALUES = ["", "0", "n/a", "property level", "—"];
const EMPTY_NORMALIZED = new Set(EMPTY_UNIT_VALUES);

function isConsideredEmptyUnit(value: string | null | undefined): boolean {
  if (value == null || value === "") return true;
  const normalized = value.trim().toLowerCase();
  return EMPTY_NORMALIZED.has(normalized) || normalized === PROPERTY_LEVEL_LABEL.toLowerCase();
}

/**
 * Use for displaying unit in tables and detail views. Returns UNIT_EMPTY_DISPLAY when
 * there is no unit, unit is 0, or unit is property-level; otherwise the unit label.
 */
export function formatUnitDisplayForTable(
  unit?: string | null,
  unitId?: number | string | null,
  unitName?: string | null,
): string {
  if (isPropertyLevelUnitId(unitId)) return UNIT_EMPTY_DISPLAY;
  const raw = (unit && unit.trim()) || formatUnitLabel({ unitId, unitName, fallback: "" });
  if (isConsideredEmptyUnit(raw) || raw === PROPERTY_LEVEL_LABEL) return UNIT_EMPTY_DISPLAY;
  return raw;
}

export const isPropertyLevelUnitId = (
  unitId: number | string | null | undefined,
): boolean => {
  if (unitId === null || unitId === undefined || unitId === "") {
    return false;
  }
  const normalized = typeof unitId === "string" ? Number(unitId) : unitId;
  return !Number.isNaN(normalized) && normalized === PROPERTY_LEVEL_UNIT_ID;
};

export const formatUnitLabel = ({
  unitId,
  unitName,
  short = false,
  fallback = "",
}: {
  unitId?: number | string | null;
  unitName?: string | null;
  short?: boolean;
  fallback?: string;
}): string => {
  if (isPropertyLevelUnitId(unitId)) {
    return short ? PROPERTY_LEVEL_SHORT_LABEL : PROPERTY_LEVEL_LABEL;
  }
  if (unitName && unitName.trim()) {
    return unitName;
  }
  if (unitId !== null && unitId !== undefined && unitId !== "") {
    const normalized = typeof unitId === "string" ? Number(unitId) : unitId;
    if (!Number.isNaN(normalized) && normalized > 0) {
      return `Unit #${normalized}`;
    }
  }
  return fallback;
};
