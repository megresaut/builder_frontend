import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * When true (default), the textarea grows vertically to fit its content
   * instead of introducing an internal scrollbar.
   */
  autoGrow?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      autoGrow = true,
      onChange,
      style,
      value,
      defaultValue,
      "aria-invalid": ariaInvalid,
      ...props
    },
    forwardedRef,
  ) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

    const setRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;

        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          (
            forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>
          ).current = node;
        }
      },
      [forwardedRef],
    );

    const resizeToFit = React.useCallback(() => {
      const el = innerRef.current;
      if (!autoGrow || !el) return;

      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }, [autoGrow]);

    React.useLayoutEffect(() => {
      resizeToFit();
    }, [resizeToFit, value]);

    return (
      <textarea
        ref={setRef}
        value={value}
        defaultValue={defaultValue}
        aria-invalid={ariaInvalid}
        onChange={(e) => {
          onChange?.(e);
          resizeToFit();
        }}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-[var(--color-text-placeholder)] focus-visible:outline-none focus-visible:border-black disabled:cursor-not-allowed disabled:opacity-50",
          ariaInvalid === true && "border-red-500 border-2",
          autoGrow ? "overflow-hidden" : "",
          className,
        )}
        style={{
          ...style,
          overflowY: autoGrow ? "hidden" : style?.overflowY,
        }}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
