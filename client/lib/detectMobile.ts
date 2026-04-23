// Threshold aligned with FtoShellLayout's desktop cutoff (1024px).
// Below this, we treat the device as "mobile/tablet" and route to the FTO portal.
const MOBILE_MAX_WIDTH = 1024;

const MOBILE_UA_RE =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  const viewportMobile = window.innerWidth < MOBILE_MAX_WIDTH;
  const uaMobile = MOBILE_UA_RE.test(navigator.userAgent || "");
  return viewportMobile || uaMobile;
}
