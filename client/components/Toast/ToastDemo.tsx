import React from "react";
import { useToastNotification } from "@/hooks/useToastNotification";

/**
 * ToastDemo - Demonstration component for testing all toast variants
 *
 * This component showcases all 4 toast types with various options.
 * Use it for visual testing and demonstration purposes.
 *
 * Simply import and render:
 * ```tsx
 * import { ToastDemo } from '@/components/Toast/ToastDemo';
 * <ToastDemo />
 * ```
 */
export const ToastDemo: React.FC = () => {
  const toast = useToastNotification();

  return (
    <div
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        maxWidth: "400px",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "8px" }}>
        Toast Notification Demo
      </h2>
      <p
        style={{
          fontSize: "14px",
          color: "#666",
          marginBottom: "16px",
        }}
      >
        Click buttons below to test all toast variants. Each notification will
        auto-dismiss after 3 seconds or when you click the X button.
      </p>

      <button
        onClick={() => toast.showSuccess("Success!")}
        style={{
          padding: "10px 16px",
          backgroundColor: "#059669",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        Show Success Toast
      </button>

      <button
        onClick={() =>
          toast.showSuccess("Task created", {
            message: "Your new task has been added to the list",
          })
        }
        style={{
          padding: "10px 16px",
          backgroundColor: "#059669",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        Show Success Toast with Message
      </button>

      <button
        onClick={() => toast.showError("Error!")}
        style={{
          padding: "10px 16px",
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        Show Error Toast
      </button>

      <button
        onClick={() =>
          toast.showError("Failed to save", {
            message: "Please check your connection and try again",
          })
        }
        style={{
          padding: "10px 16px",
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        Show Error Toast with Message
      </button>

      <button
        onClick={() => toast.showWarning("Warning!")}
        style={{
          padding: "10px 16px",
          backgroundColor: "#f59e0b",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        Show Warning Toast
      </button>

      <button
        onClick={() =>
          toast.showWarning("This action cannot be undone", {
            message:
              "Please confirm before proceeding with the deletion",
          })
        }
        style={{
          padding: "10px 16px",
          backgroundColor: "#f59e0b",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        Show Warning Toast with Message
      </button>

      <button
        onClick={() => toast.showInfo("Information")}
        style={{
          padding: "10px 16px",
          backgroundColor: "#2463eb",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        Show Info Toast
      </button>

      <button
        onClick={() =>
          toast.showInfo("Processing your request...", {
            message: "This may take a few moments",
            duration: 5000,
          })
        }
        style={{
          padding: "10px 16px",
          backgroundColor: "#2463eb",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        Show Info Toast with Custom Duration (5s)
      </button>

      <button
        onClick={() => {
          toast.showSuccess("Multiple toasts!");
          setTimeout(() => toast.showWarning("Second toast"), 300);
          setTimeout(() => toast.showInfo("Third toast"), 600);
        }}
        style={{
          padding: "10px 16px",
          backgroundColor: "#6366f1",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        Show Multiple Toasts
      </button>
    </div>
  );
};

ToastDemo.displayName = "ToastDemo";
