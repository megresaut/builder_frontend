import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { Toast, type ToastType } from "./Toast";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * ToastProvider - Manages global toast state and display
 *
 * Features:
 * - Manages multiple toasts with unique IDs
 * - Provides addToast and removeToast methods
 * - Renders ToastDisplay component for UI
 *
 * Usage:
 * ```tsx
 * <ToastProvider>
 *   <YourApp />
 * </ToastProvider>
 * ```
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ toasts, addToast, removeToast }),
    [toasts, addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastDisplay />
    </ToastContext.Provider>
  );
};

/**
 * useToastContext - Hook to access toast context
 *
 * @returns Toast context with toasts, addToast, removeToast
 * @throws Error if used outside ToastProvider
 */
export const useToastContext = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
};

/**
 * ToastDisplay - Renders the toast container and toast items
 *
 * Positioned in the top-right corner, stacking vertically downward
 */
const ToastDisplay: React.FC = () => {
  const { toasts, removeToast } = useToastContext();

  return (
    <div
      className="fixed top-0 right-0 z-[100] pointer-events-none"
      style={{
        padding: "16px",
        maxWidth: "420px",
        width: "100%",
      }}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
    >
      <div
        className="flex flex-col gap-3"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto"
            style={{ pointerEvents: "auto" }}
          >
            <Toast
              id={toast.id}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              duration={toast.duration || 3000}
              onClose={removeToast}
              autoClose={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

ToastProvider.displayName = "ToastProvider";
