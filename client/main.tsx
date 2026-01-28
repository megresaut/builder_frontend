import { createRoot } from "react-dom/client";
import App from "./App";

// Suppress CORS errors from Cursor telemetry/debugging endpoint
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
  if (url.includes('127.0.0.1:7242') || url.includes('/ingest/')) {
    // Silently ignore requests to Cursor debugging endpoint
    return Promise.reject(new Error('Suppressed Cursor telemetry request'));
  }
  try {
    return await originalFetch.apply(window, args);
  } catch (error: any) {
    // Suppress CORS errors for Cursor telemetry endpoint
    if (error?.message?.includes('CORS') && (url.includes('127.0.0.1:7242') || url.includes('/ingest/'))) {
      return Promise.reject(new Error('Suppressed Cursor telemetry CORS error'));
    }
    throw error;
  }
};

// Suppress console errors for Cursor telemetry
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const message = args.join(' ');
  if (message.includes('127.0.0.1:7242') || 
      message.includes('/ingest/') || 
      message.includes('CORS policy') && message.includes('7242')) {
    // Suppress Cursor telemetry errors
    return;
  }
  originalConsoleError.apply(console, args);
};

createRoot(document.getElementById("root")!).render(<App />);
