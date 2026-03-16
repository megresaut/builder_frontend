import React, { useState, useRef, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, Search, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldShell } from "./FieldShell";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { fetchJSON } from "@/api/fetchJSON";

interface LocationItem {
  id: number;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
}

interface PropertyItem {
  id: number;
  name?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  locations_count?: number;
}

interface PropertyLocationComboboxProps {
  label: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  properties: PropertyItem[];
  propertyId: number | null;
  locationId: number | null;
  onChange: (selection: { propertyId: number | null; locationId: number | null }) => void;
}

const renderPropertyLabel = (p: PropertyItem) =>
  p.name ||
  [p.address_line1, p.city, p.state].filter(Boolean).join(", ") ||
  `Property #${p.id}`;

const renderLocationLabel = (loc: LocationItem) =>
  [loc.address_line1, loc.city, loc.state].filter(Boolean).join(", ") ||
  `Location #${loc.id}`;

type View = "properties" | "locations";

export const PropertyLocationCombobox: React.FC<PropertyLocationComboboxProps> = ({
  label,
  required = false,
  error,
  disabled = false,
  placeholder = "Select Property",
  searchPlaceholder = "Search...",
  properties,
  propertyId,
  locationId,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("properties");
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [drillPropertyId, setDrillPropertyId] = useState<number | null>(null);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [selectedLocationLabel, setSelectedLocationLabel] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const locationsCache = useRef<Map<number, LocationItem[]>>(new Map());

  const fieldId = label.toLowerCase().replace(/\s+/g, "-");

  // Resolve trigger display label
  const selectedProperty = properties.find((p) => p.id === propertyId);
  const triggerLabel = (() => {
    if (!selectedProperty) return placeholder;
    const propLabel = renderPropertyLabel(selectedProperty);
    if (locationId && selectedLocationLabel) {
      return `${propLabel} > ${selectedLocationLabel}`;
    }
    return propLabel;
  })();

  // On mount (or when propertyId/locationId change externally), resolve location label for edit mode
  const fetchLocations = useCallback(async (propId: number): Promise<LocationItem[]> => {
    if (locationsCache.current.has(propId)) {
      return locationsCache.current.get(propId)!;
    }
    const data = await fetchJSON(`/properties/${propId}/locations`).catch(() => []);
    const locs: LocationItem[] = data || [];
    locationsCache.current.set(propId, locs);
    return locs;
  }, []);

  useEffect(() => {
    if (propertyId && locationId) {
      // Resolve location label for display
      fetchLocations(propertyId).then((locs) => {
        const loc = locs.find((l) => l.id === locationId);
        if (loc) {
          setSelectedLocationLabel(renderLocationLabel(loc));
        }
      });
    } else {
      setSelectedLocationLabel(null);
    }
  }, [propertyId, locationId, fetchLocations]);

  // Filter properties based on search
  const filteredProperties = searchTerm
    ? properties.filter((p) =>
        renderPropertyLabel(p).toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : properties;

  // Filter locations based on search
  const filteredLocations = searchTerm
    ? locations.filter((loc) =>
        renderLocationLabel(loc).toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : locations;

  // Reset highlighted index when search term or view changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm, view]);

  // Reset to properties view on popover close
  useEffect(() => {
    if (!open) {
      setView("properties");
      setSearchTerm("");
      setDrillPropertyId(null);
      setLocations([]);
      setLocationsLoading(false);
    }
  }, [open]);

  const handlePropertySelect = async (prop: PropertyItem) => {
    const hasLocations = (prop.locations_count ?? 0) > 0;
    if (!hasLocations) {
      // No locations — select property directly
      onChange({ propertyId: prop.id, locationId: null });
      setOpen(false);
    } else {
      // Drill into locations
      setDrillPropertyId(prop.id);
      setView("locations");
      setSearchTerm("");
      setLocationsLoading(true);
      try {
        const locs = await fetchLocations(prop.id);
        setLocations(locs);
      } catch {
        setLocations([]);
      } finally {
        setLocationsLoading(false);
      }
    }
  };

  const handleLocationSelect = (loc: LocationItem | null) => {
    if (!drillPropertyId) return;
    if (loc === null) {
      // "Property Level" selection
      onChange({ propertyId: drillPropertyId, locationId: null });
    } else {
      onChange({ propertyId: drillPropertyId, locationId: loc.id });
      setSelectedLocationLabel(renderLocationLabel(loc));
    }
    setOpen(false);
  };

  const handleBack = () => {
    setView("properties");
    setSearchTerm("");
    setDrillPropertyId(null);
    setLocations([]);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;

    if (view === "properties") {
      if (filteredProperties.length === 0) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredProperties.length - 1 ? prev + 1 : prev,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredProperties[highlightedIndex]) {
            handlePropertySelect(filteredProperties[highlightedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
      }
    } else {
      // Locations view: index 0 = "Property Level", 1+ = locations
      const totalItems = 1 + filteredLocations.length;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < totalItems - 1 ? prev + 1 : prev,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex === 0) {
            handleLocationSelect(null);
          } else {
            const loc = filteredLocations[highlightedIndex - 1];
            if (loc) handleLocationSelect(loc);
          }
          break;
        case "Escape":
          e.preventDefault();
          handleBack();
          break;
      }
    }
  };

  const isPropertySelected = (propId: number) =>
    propertyId === propId && locationId === null;

  const isLocationSelected = (locId: number) =>
    propertyId === drillPropertyId && locationId === locId;

  const isPropertyLevelSelected =
    propertyId === drillPropertyId && locationId === null;

  return (
    <FieldShell
      label={label}
      required={required}
      error={error}
      disabled={disabled}
      htmlFor={fieldId}
    >
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <button
            id={fieldId}
            disabled={disabled}
            className={cn(
              "h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal",
              "transition-colors flex items-center justify-between",
              "disabled:cursor-not-allowed disabled:opacity-60",
              error
                ? "border-red-600"
                : open
                  ? "border-black"
                  : "border-[var(--color-border-light)]",
            )}
            style={{
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              lineHeight: 1.43,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
            type="button"
          >
            <span
              className="overflow-hidden text-ellipsis whitespace-nowrap"
              style={{
                color: selectedProperty ? "var(--color-text-primary)" : "#303030",
                textAlign: "left",
                flex: 1,
              }}
            >
              {triggerLabel}
            </span>
            <ChevronsUpDown
              className="ml-2 h-4 w-4 shrink-0 flex-none"
              style={{ color: "#303030" }}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="p-0"
          style={{
            minWidth: "320px",
            width: "var(--radix-popover-trigger-width)",
          }}
          hideWhenDetached={false}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            requestAnimationFrame(() => {
              searchInputRef.current?.focus();
              searchInputRef.current?.select();
            });
          }}
          onInteractOutside={(e) => {
            const target = e.target as Node;
            if (contentRef.current?.contains(target)) {
              e.preventDefault();
            }
          }}
        >
          <div
            ref={contentRef}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "320px",
            }}
          >
            {/* Search input */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderBottom: "1px solid var(--color-border-light)",
                flexShrink: 0,
              }}
            >
              <Search className="h-4 w-4" style={{ color: "#717179" }} />
              <input
                ref={searchInputRef}
                type="text"
                inputMode="search"
                autoComplete="off"
                placeholder={
                  view === "locations" ? "Search locations..." : searchPlaceholder
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  padding: 0,
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  fontSize: "16px",
                  color: "var(--color-text-primary)",
                  backgroundColor: "transparent",
                }}
              />
            </div>

            {/* Content */}
            <div
              style={{
                maxHeight: "280px",
                overflowY: "auto",
                overflowX: "hidden",
                flexShrink: 1,
              }}
            >
              {view === "properties" ? (
                // --- Properties list ---
                filteredProperties.length === 0 ? (
                  <div
                    style={{
                      padding: "16px 8px",
                      textAlign: "center",
                      color: "var(--color-text-muted)",
                      fontSize: "14px",
                      minHeight: "100px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    No properties found
                  </div>
                ) : (
                  filteredProperties.map((prop, index) => {
                    const hasLocations = (prop.locations_count ?? 0) > 0;
                    const selected = isPropertySelected(prop.id);
                    return (
                      <button
                        key={prop.id}
                        type="button"
                        onClick={() => handlePropertySelect(prop)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "none",
                          textAlign: "left",
                          cursor: "pointer",
                          backgroundColor:
                            highlightedIndex === index
                              ? "rgba(36, 99, 235, 0.15)"
                              : selected
                                ? "rgba(36, 99, 235, 0.1)"
                                : "transparent",
                          color: "var(--color-text-primary)",
                          fontFamily:
                            "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          transition: "background-color 0.15s",
                        }}
                      >
                        {selected ? (
                          <Check className="h-4 w-4 shrink-0 text-blue-600" />
                        ) : (
                          <div className="h-4 w-4 shrink-0" />
                        )}
                        <span style={{ flex: 1 }}>{renderPropertyLabel(prop)}</span>
                        {hasLocations && (
                          <ChevronRight
                            className="h-4 w-4 shrink-0"
                            style={{ color: "#717179" }}
                          />
                        )}
                      </button>
                    );
                  })
                )
              ) : (
                // --- Locations list (drill-down) ---
                <>
                  {/* Back button */}
                  <button
                    type="button"
                    onClick={handleBack}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "none",
                      borderBottom: "1px solid var(--color-border-light)",
                      textAlign: "left",
                      cursor: "pointer",
                      backgroundColor: "transparent",
                      color: "var(--color-text-muted)",
                      fontFamily:
                        "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={() => {}}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Back to Properties</span>
                  </button>

                  {locationsLoading ? (
                    <div
                      style={{
                        padding: "24px 8px",
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        color: "var(--color-text-muted)",
                        fontSize: "14px",
                      }}
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading locations...
                    </div>
                  ) : (
                    <>
                      {/* "Property Level" option */}
                      <button
                        type="button"
                        onClick={() => handleLocationSelect(null)}
                        onMouseEnter={() => setHighlightedIndex(0)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "none",
                          textAlign: "left",
                          cursor: "pointer",
                          backgroundColor:
                            highlightedIndex === 0
                              ? "rgba(36, 99, 235, 0.15)"
                              : isPropertyLevelSelected
                                ? "rgba(36, 99, 235, 0.1)"
                                : "transparent",
                          color: "var(--color-text-primary)",
                          fontFamily:
                            "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          transition: "background-color 0.15s",
                        }}
                      >
                        {isPropertyLevelSelected ? (
                          <Check className="h-4 w-4 shrink-0 text-blue-600" />
                        ) : (
                          <div className="h-4 w-4 shrink-0" />
                        )}
                        <span>Property Level</span>
                      </button>

                      {/* Location rows */}
                      {filteredLocations.length === 0 && !locationsLoading ? (
                        <div
                          style={{
                            padding: "16px 8px",
                            textAlign: "center",
                            color: "var(--color-text-muted)",
                            fontSize: "14px",
                          }}
                        >
                          No locations found
                        </div>
                      ) : (
                        filteredLocations.map((loc, index) => {
                          const itemIndex = index + 1; // offset for "Property Level"
                          const selected = isLocationSelected(loc.id);
                          return (
                            <button
                              key={loc.id}
                              type="button"
                              onClick={() => handleLocationSelect(loc)}
                              onMouseEnter={() => setHighlightedIndex(itemIndex)}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "none",
                                textAlign: "left",
                                cursor: "pointer",
                                backgroundColor:
                                  highlightedIndex === itemIndex
                                    ? "rgba(36, 99, 235, 0.15)"
                                    : selected
                                      ? "rgba(36, 99, 235, 0.1)"
                                      : "transparent",
                                color: "var(--color-text-primary)",
                                fontFamily:
                                  "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                                fontSize: "14px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                transition: "background-color 0.15s",
                              }}
                            >
                              {selected ? (
                                <Check className="h-4 w-4 shrink-0 text-blue-600" />
                              ) : (
                                <div className="h-4 w-4 shrink-0" />
                              )}
                              <span>{renderLocationLabel(loc)}</span>
                            </button>
                          );
                        })
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </FieldShell>
  );
};

PropertyLocationCombobox.displayName = "PropertyLocationCombobox";
