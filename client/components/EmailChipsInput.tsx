import { useEffect, useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { isValidEmailAddress } from "@/lib/emailRecipients";

// Gmail-style chip entry for the To/Cc fields on the invoice email modals.
// The public value is still a single comma-separated string — exactly what
// parseRecipients (and the server's own splitAddresses) already expect — so
// this is a drop-in replacement for a plain <input>, not a new data shape.
// Chips are cosmetic: what gets validated on submit is the same serialized
// string a comma-separated input would have produced.

function splitEmails(text: string): string[] {
  return text
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function serialize(chips: string[], draft: string): string {
  const trimmedDraft = draft.trim();
  return trimmedDraft ? [...chips, trimmedDraft].join(", ") : chips.join(", ");
}

export interface EmailChipsInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  // Enter pressed with no in-progress chip text — mirrors the old plain-input
  // behavior where Enter submitted the surrounding form.
  onEnterWithNoDraft?: () => void;
  className?: string;
}

export default function EmailChipsInput({
  value,
  onChange,
  placeholder,
  autoFocus,
  disabled,
  onEnterWithNoDraft,
  className = "",
}: EmailChipsInputProps) {
  const [chips, setChips] = useState<string[]>(() => splitEmails(value));
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  // Tracks the last string we ourselves emitted so an external reset of
  // `value` (autofill running after this mounts, or a parent clearing the
  // field) is picked up without clobbering the draft on every keystroke.
  const lastEmittedRef = useRef(value);

  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    setChips(splitEmails(value));
    setDraft("");
  }, [value]);

  const emit = (nextChips: string[], nextDraft: string) => {
    const serialized = serialize(nextChips, nextDraft);
    lastEmittedRef.current = serialized;
    onChange(serialized);
  };

  const commitDraft = () => {
    const token = draft.trim();
    if (!token) return;
    const next = [...chips, token];
    setChips(next);
    setDraft("");
    emit(next, "");
  };

  const removeChip = (index: number) => {
    const next = chips.filter((_, i) => i !== index);
    setChips(next);
    emit(next, draft);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      if (draft.trim()) {
        e.preventDefault();
        commitDraft();
        return;
      }
      if (e.key === "Enter") onEnterWithNoDraft?.();
      return;
    }
    if (e.key === "Tab" && draft.trim()) {
      commitDraft();
      return;
    }
    if (e.key === "Backspace" && draft === "" && chips.length > 0) {
      e.preventDefault();
      const next = chips.slice(0, -1);
      setChips(next);
      emit(next, "");
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (!/[,;\s]/.test(text.trim())) return; // single token — let normal paste happen
    e.preventDefault();
    const tokens = splitEmails(`${draft} ${text}`.replace(/\s+/g, ","));
    if (tokens.length === 0) return;
    const next = [...chips, ...tokens];
    setChips(next);
    setDraft("");
    emit(next, "");
  };

  return (
    <div
      className={`flex w-full flex-wrap items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2 py-1.5 focus-within:border-[#013764] ${
        disabled ? "bg-gray-50 opacity-70" : ""
      } ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      {chips.map((email, i) => {
        const invalid = !isValidEmailAddress(email);
        return (
          <span
            key={`${email}-${i}`}
            className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-sm ${
              invalid
                ? "border border-red-200 bg-red-50 text-red-700"
                : "bg-[#E8EEF9] text-[#013764]"
            }`}
          >
            <span className="truncate">{email}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeChip(i);
                }}
                aria-label={`Remove ${email}`}
                className="shrink-0 rounded-full leading-none hover:bg-black/10"
              >
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </span>
        );
      })}
      <input
        ref={inputRef}
        type="text"
        value={draft}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={commitDraft}
        placeholder={chips.length === 0 ? placeholder : ""}
        className="min-w-[120px] flex-1 border-none bg-transparent py-0.5 text-sm outline-none disabled:cursor-not-allowed"
      />
    </div>
  );
}
