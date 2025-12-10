// Map from frontend readable → backend enum
export const PropertyTypeToEnum: Record<string, string> = {
    Commercial: "COMM",
    Residential: "R",
    Concierge: "C",
    OR: "OR",
    HOA: "HOA",
  };
  
  // Map from backend enum → frontend readable
  export const EnumToPropertyType: Record<string, string> = {
    COMM: "Commercial",
    R: "Residential",
    C: "Concierge",
    OR: "OR",
    HOA: "HOA",
  };
  