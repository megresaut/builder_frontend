import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  onClose: (id: string) => void;
  duration?: number;
  autoClose?: boolean;
}

const TOAST_CONFIG: Record<
  ToastType,
  {
    bgColor: string;
    borderColor: string;
    textColor: string;
    progressBarColor: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-900",
    progressBarColor: "bg-emerald-600",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-2 15l-5-5 1.41-1.41L8 12.17l7.59-7.59L17 6l-9 9z"
          fill="#059669"
        />
      </svg>
    ),
  },
  error: {
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-900",
    progressBarColor: "bg-red-600",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15h-2v-2h2v2zm0-4h-2V5h2v6z"
          fill="#ef4444"
        />
      </svg>
    ),
  },
  warning: {
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-900",
    progressBarColor: "bg-amber-500",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15h-2v-2h2v2zm0-4h-2V5h2v6z"
          fill="#f59e0b"
        />
      </svg>
    ),
  },
  info: {
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-900",
    progressBarColor: "bg-blue-600",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15h-2v-2h2v2zm0-4h-2V5h2v6z"
          fill="#2463eb"
        />
      </svg>
    ),
  },
};

/**
 * Toast Component - Display notification messages with auto-dismiss
 *
 * Features:
 * - 4 variants: success, error, warning, info
 * - Auto-dismiss after configurable duration (default 3000ms)
 * - Manual close via X button
 * - Animated progress bar showing remaining time
 * - Smooth slide-in and fade-out animations
 *
 * @param id - Unique identifier for the toast
 * @param type - Toast variant (success, error, warning, info)
 * @param title - Toast title/heading
 * @param message - Optional detailed message
 * @param onClose - Callback when toast is dismissed
 * @param duration - Auto-dismiss duration in ms (default: 3000)
 * @param autoClose - Enable auto-dismiss (default: true)
 */
export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  onClose,
  duration = 3000,
  autoClose = true,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const config = TOAST_CONFIG[type];

  useEffect(() => {
    if (!autoClose) return;

    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        onClose(id);
      }, 300); // Match animation duration
    }, duration);

    return () => clearTimeout(timer);
  }, [autoClose, duration, id, onClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match animation duration
  };

  return (
    <div
      className={cn(
        "animate-in slide-in-from-top-full fade-in-0 duration-300",
        isClosing && "animate-out fade-out-0 slide-out-to-right-full duration-300"
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div
        className={cn(
          "relative flex items-start gap-3 rounded-lg border p-4 pr-12 shadow-lg",
          config.bgColor,
          config.borderColor,
          config.textColor
        )}
      >
        {/* Icon */}
        <div className="flex-shrink-0 pt-0.5">{config.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold leading-5"
            style={{
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            }}
          >
            {title}
          </p>
          {message && (
            <p
              className="text-sm font-normal leading-5 opacity-90 mt-1"
              style={{
                fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              }}
            >
              {message}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className={cn(
            "absolute right-3 top-3 p-1 hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 rounded",
            {
              "focus:ring-emerald-500": type === "success",
              "focus:ring-red-500": type === "error",
              "focus:ring-amber-500": type === "warning",
              "focus:ring-blue-500": type === "info",
            }
          )}
          aria-label="Dismiss notification"
        >
          <X
            width={18}
            height={18}
            className="opacity-60"
            style={{
              color:
                type === "success"
                  ? "#059669"
                  : type === "error"
                    ? "#ef4444"
                    : type === "warning"
                      ? "#f59e0b"
                      : "#2463eb",
            }}
          />
        </button>

        {/* Progress Bar */}
        {autoClose && (
          <div
            className="absolute bottom-0 left-0 h-1 rounded-b-lg"
            style={{
              width: "100%",
              animation: `shrink ${duration}ms linear forwards`,
              backgroundColor:
                type === "success"
                  ? "#059669"
                  : type === "error"
                    ? "#ef4444"
                    : type === "warning"
                      ? "#f59e0b"
                      : "#2463eb",
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

Toast.displayName = "Toast";
