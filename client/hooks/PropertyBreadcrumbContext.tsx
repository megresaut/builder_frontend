import React, { createContext, useContext, useState, useCallback } from "react";

interface PropertyBreadcrumbContextValue {
  /** Display name for the current property (e.g. "1 Woodland Road"). Null when not on a property or before load. */
  propertyDisplayName: string | null;
  setPropertyDisplayName: (name: string | null) => void;
}

const PropertyBreadcrumbContext = createContext<PropertyBreadcrumbContextValue | null>(null);

export function PropertyBreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [propertyDisplayName, setPropertyDisplayName] = useState<string | null>(null);
  const setter = useCallback((name: string | null) => setPropertyDisplayName(name), []);
  return (
    <PropertyBreadcrumbContext.Provider
      value={{ propertyDisplayName, setPropertyDisplayName: setter }}
    >
      {children}
    </PropertyBreadcrumbContext.Provider>
  );
}

export function usePropertyBreadcrumb() {
  const ctx = useContext(PropertyBreadcrumbContext);
  return ctx ?? { propertyDisplayName: null, setPropertyDisplayName: () => {} };
}
