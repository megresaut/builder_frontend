import { useMemo } from "react";
import { useToastContext } from "@/components/Toast/ToastContainer";

interface ToastOptions {
  message?: string;
  duration?: number;
}

/**
 * useToastNotification - Hook for easy toast notification display
 *
 * Provides convenient methods for showing different types of notifications.
 * Auto-dismisses after 3 seconds by default.
 *
 * Must be used within a ToastProvider.
 *
 * @returns Object with methods: showSuccess, showError, showWarning, showInfo
 *
 * Example:
 * ```tsx
 * const toast = useToastNotification();
 *
 * // Simple notification
 * toast.showSuccess("Task created");
 *
 * // With detailed message
 * toast.showError("Failed to save", "Please try again later");
 *
 * // With custom duration
 * toast.showInfo("Processing", { duration: 5000 });
 * ```
 */
export const useToastNotification = () => {
  const { addToast } = useToastContext();

  // Memoize the return object so it only changes when addToast changes
  return useMemo(
    () => ({
      /**
       * Show a success notification
       * @param title - Main message
       * @param options - Optional message and duration
       */
      showSuccess: (title: string, options?: ToastOptions) => {
        return addToast({
          type: "success",
          title,
          message: options?.message,
          duration: options?.duration || 3000,
        });
      },

      /**
       * Show an error notification
       * @param title - Main message
       * @param options - Optional message and duration
       */
      showError: (title: string, options?: ToastOptions) => {
        return addToast({
          type: "error",
          title,
          message: options?.message,
          duration: options?.duration || 3000,
        });
      },

      /**
       * Show a warning notification
       * @param title - Main message
       * @param options - Optional message and duration
       */
      showWarning: (title: string, options?: ToastOptions) => {
        return addToast({
          type: "warning",
          title,
          message: options?.message,
          duration: options?.duration || 3000,
        });
      },

      /**
       * Show an info notification
       * @param title - Main message
       * @param options - Optional message and duration
       */
      showInfo: (title: string, options?: ToastOptions) => {
        return addToast({
          type: "info",
          title,
          message: options?.message,
          duration: options?.duration || 3000,
        });
      },
    }),
    [addToast]
  );
};
