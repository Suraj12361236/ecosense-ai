import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock window.storage for all tests
const storageMock = {
  get: vi.fn().mockRejectedValue(new Error("not found")),
  set: vi.fn().mockResolvedValue(null),
  delete: vi.fn().mockResolvedValue(null),
  list: vi.fn().mockResolvedValue({ keys: [] }),
};

Object.defineProperty(window, "storage", {
  value: storageMock,
  writable: true,
});

// Mock IntersectionObserver (needed by some recharts internals)
global.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock ResizeObserver
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Suppress recharts/jsdom SVG warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === "string" && (args[0].includes("SVGElement") || args[0].includes("ResizeObserver") || args[0].includes("ReactDOM.render"))) return;
    originalError(...args);
  };
});
afterAll(() => { console.error = originalError; });
