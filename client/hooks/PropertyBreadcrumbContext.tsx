import React, { createContext, useContext, useState, useCallback } from "react";

interface PropertyBreadcrumbContextValue {
  /** Display name for the current property (e.g. "1 Woodland Road"). Null when not on a property or before load. */
  propertyDisplayName: string | null;
  setPropertyDisplayName: (name: string | null) => void;
  /** Display name for the current vendor (e.g. "4Ever Products"). Null when not on a vendor or before load. */
  vendorDisplayName: string | null;
  setVendorDisplayName: (name: string | null) => void;
  /** Display name for the current task (e.g. "Fix Plumbing and Heating"). Null when not on a task or before load. */
  taskDisplayName: string | null;
  setTaskDisplayName: (name: string | null) => void;
  /** Display name for the current project (e.g. "45 Husted Lane Pergola"). Null when not on a project or before load. */
  projectDisplayName: string | null;
  setProjectDisplayName: (name: string | null) => void;
}

const PropertyBreadcrumbContext = createContext<PropertyBreadcrumbContextValue | null>(null);

export function PropertyBreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [propertyDisplayName, setPropertyDisplayName] = useState<string | null>(null);
  const propertySetter = useCallback((name: string | null) => setPropertyDisplayName(name), []);
  const [vendorDisplayName, setVendorDisplayName] = useState<string | null>(null);
  const vendorSetter = useCallback((name: string | null) => setVendorDisplayName(name), []);
  const [taskDisplayName, setTaskDisplayName] = useState<string | null>(null);
  const taskSetter = useCallback((name: string | null) => setTaskDisplayName(name), []);
  const [projectDisplayName, setProjectDisplayName] = useState<string | null>(null);
  const projectSetter = useCallback((name: string | null) => setProjectDisplayName(name), []);
  return (
    <PropertyBreadcrumbContext.Provider
      value={{
        propertyDisplayName,
        setPropertyDisplayName: propertySetter,
        vendorDisplayName,
        setVendorDisplayName: vendorSetter,
        taskDisplayName,
        setTaskDisplayName: taskSetter,
        projectDisplayName,
        setProjectDisplayName: projectSetter,
      }}
    >
      {children}
    </PropertyBreadcrumbContext.Provider>
  );
}

export function usePropertyBreadcrumb() {
  const ctx = useContext(PropertyBreadcrumbContext);
  return ctx ?? {
    propertyDisplayName: null,
    setPropertyDisplayName: () => {},
    vendorDisplayName: null,
    setVendorDisplayName: () => {},
    taskDisplayName: null,
    setTaskDisplayName: () => {},
    projectDisplayName: null,
    setProjectDisplayName: () => {},
  };
}
