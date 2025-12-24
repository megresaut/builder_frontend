import { useCallback } from "react";

interface UseDelayedActionProps {
  onClose: (value: boolean) => void;
  onAction: () => void;
  delayMs?: number;
}

/**
 * Hook for delayed state changes after modal closes.
 * Useful for confirming actions in modals without the state change
 * being visible before the modal closes.
 */
export function useDelayedAction({
  onClose,
  onAction,
  delayMs = 600,
}: UseDelayedActionProps) {
  return useCallback(() => {
    onClose(false);
    setTimeout(() => {
      onAction();
    }, delayMs);
  }, [onClose, onAction, delayMs]);
}
