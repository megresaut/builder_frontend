import "@testing-library/jest-dom/vitest";

// jsdom ships neither of these; Radix popovers/selects (and anything that syncs
// width to a trigger) construct them on mount.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {};
}
