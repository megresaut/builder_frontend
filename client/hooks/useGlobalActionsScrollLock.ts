import { RefObject, useEffect } from "react";

let lockCount = 0;
let savedOverflow: string | null = null;
let savedPaddingRight: string | null = null;

const isScrollableKey = (key: string) =>
  key === "ArrowUp" ||
  key === "ArrowDown" ||
  key === "PageUp" ||
  key === "PageDown" ||
  key === "Home" ||
  key === "End" ||
  key === " " ||
  key === "Spacebar";

const shouldAllowEvent = (
  target: EventTarget | null,
  allowRefs: Array<RefObject<HTMLElement>>,
) => {
  const el = target as HTMLElement | null;
  if (!el) return false;

  // Don't block scroll/keys while typing in inputs
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;

  // Allow interactions inside the trigger/menu elements
  return allowRefs.some((ref) => ref.current?.contains(el));
};

/**
 * Locks scrolling while an actions popover is open.
 *
 * This app scrolls inside the main content container (ShellLayout's
 * data-testid="main-content" element), not document.body.
 */
export function useGlobalActionsScrollLock(
  open: boolean,
  opts?: { allowRefs?: Array<RefObject<HTMLElement>> },
) {
  const allowRefs = opts?.allowRefs ?? [];

  useEffect(() => {
    if (!open) return;

    // Detect if on mobile/touch device
    const isMobile = window.innerWidth < 1024 ||
                     ('ontouchstart' in window) ||
                     navigator.maxTouchPoints > 0;

    // On mobile, skip scroll locking entirely to avoid focus scroll issues
    if (isMobile) {
      return;
    }

    const scrollContainer = document.querySelector(
      '[data-testid="main-content"]',
    ) as HTMLElement | null;

    const container = scrollContainer ?? (document.scrollingElement as HTMLElement | null);

    const lock = () => {
      lockCount += 1;
      if (lockCount !== 1) return;

      if (container) {
        savedOverflow = container.style.overflow;
        savedPaddingRight = container.style.paddingRight;

        // Compensate for disappearing scrollbar to avoid layout shift
        const scrollbarWidth = container.offsetWidth - container.clientWidth;
        if (scrollbarWidth > 0) {
          container.style.paddingRight = `${scrollbarWidth}px`;
        }

        container.style.overflow = "hidden";
      }
    };

    const unlock = () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount !== 0) return;

      if (container) {
        container.style.overflow = savedOverflow ?? "";
        container.style.paddingRight = savedPaddingRight ?? "";
      }

      savedOverflow = null;
      savedPaddingRight = null;
    };

    const onWheel = (e: WheelEvent) => {
      if (shouldAllowEvent(e.target, allowRefs)) return;
      e.preventDefault();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (shouldAllowEvent(e.target, allowRefs)) return;
      e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isScrollableKey(e.key)) return;
      if (shouldAllowEvent(e.target, allowRefs)) return;
      e.preventDefault();
    };

    lock();

    // Capture + passive:false ensures we can preventDefault reliably.
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchmove", onTouchMove, {
      passive: false,
      capture: true,
    });
    window.addEventListener("keydown", onKeyDown, { capture: true });

    return () => {
      window.removeEventListener("wheel", onWheel, true);
      window.removeEventListener("touchmove", onTouchMove, true);
      window.removeEventListener("keydown", onKeyDown, true);
      unlock();
    };
  }, [open, allowRefs]);
}
