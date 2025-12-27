import { useEffect } from "react";

/**
 * useScrollLock - Prevents page scrolling when a popover/dropdown is open
 *
 * This hook disables scrolling on the body element while the component
 * using it has an open popover. Useful for modals and dropdowns that
 * should lock the background from scrolling.
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

    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);
};
