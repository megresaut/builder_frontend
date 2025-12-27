import { useEffect } from "react";

/**
 * useScrollLock - Prevents page scrolling when a popover/dropdown is open
 *
 * This hook disables scrolling on the main content container while the
 * popover/dropdown is open. It finds the nearest scrollable parent element
 * (typically the main content div in ShellLayout) and locks it.
 *
 * @param isOpen - Boolean indicating if the popover/dropdown is currently open
 *
 * Example:
 * ```tsx
 * const MyComponent = () => {
 *   const [open, setOpen] = useState(false);
 *   useScrollLock(open);
 *
 *   return (
 *     <button onClick={() => setOpen(!open)}>Toggle Menu</button>
 *   );
 * };
 * ```
 */
export const useScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) return;

    // Find the main scrollable container (the overflow-auto div in ShellLayout)
    const scrollContainer = document.querySelector('[data-testid="main-content"]') as HTMLDivElement;

    if (!scrollContainer) return;

    const originalOverflow = scrollContainer.style.overflow;
    const originalHeight = scrollContainer.style.height;

    // Disable scrolling by setting overflow to hidden
    scrollContainer.style.overflow = "hidden";

    return () => {
      scrollContainer.style.overflow = originalOverflow;
      scrollContainer.style.height = originalHeight;
    };
  }, [isOpen]);
};
