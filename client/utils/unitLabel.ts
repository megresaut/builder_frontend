export const PROPERTY_LEVEL_UNIT_ID = 0;
export const PROPERTY_LEVEL_LABEL = "Property Level";
export const PROPERTY_LEVEL_SHORT_LABEL = "PL";

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
