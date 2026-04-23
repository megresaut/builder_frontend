import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Lazy initializer so first render already has the correct value on the
  // client — otherwise synchronous consumers (e.g. submit handlers) read
  // `false` on mobile until the first effect runs.
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
