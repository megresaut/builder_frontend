/**
 * Captures recent console output and uncaught errors into a bounded ring buffer
 * so bug reports can include the last few moments of client-side activity.
 */

export type CapturedLevel = "log" | "info" | "warn" | "error" | "uncaught" | "unhandledrejection";

export interface CapturedEntry {
  ts: string;
  level: CapturedLevel;
  message: string;
  stack?: string;
}

const MAX_ENTRIES = 50;
const SECRET_KEY_PATTERN = /(password|token|secret|authorization|api[_-]?key|bearer)/i;

const buffer: CapturedEntry[] = [];
let initialized = false;

function safeStringify(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Error) return value.message;
  try {
    return JSON.stringify(value, (key, val) => {
      if (typeof key === "string" && SECRET_KEY_PATTERN.test(key)) return "[redacted]";
      if (typeof val === "string" && val.length > 500) return val.slice(0, 500) + "…";
      return val;
    });
  } catch {
    return "[unserializable]";
  }
}

function push(entry: CapturedEntry) {
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) buffer.shift();
}

function wrap(level: CapturedLevel, original: (...args: unknown[]) => void) {
  return (...args: unknown[]) => {
    try {
      push({
        ts: new Date().toISOString(),
        level,
        message: args.map(safeStringify).join(" "),
      });
    } catch {
      // never let capture break the app
    }
    original.apply(console, args);
  };
}

export function initConsoleCapture() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  console.log = wrap("log", console.log.bind(console));
  console.info = wrap("info", console.info.bind(console));
  console.warn = wrap("warn", console.warn.bind(console));
  console.error = wrap("error", console.error.bind(console));

  window.addEventListener("error", (event) => {
    push({
      ts: new Date().toISOString(),
      level: "uncaught",
      message: event.message || "Uncaught error",
      stack: event.error?.stack,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason: unknown = event.reason;
    push({
      ts: new Date().toISOString(),
      level: "unhandledrejection",
      message: reason instanceof Error ? reason.message : safeStringify(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
}

export function getCapturedLogs(): CapturedEntry[] {
  return [...buffer];
}

export function clearCapturedLogs() {
  buffer.length = 0;
}
