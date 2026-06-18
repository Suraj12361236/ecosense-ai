/**
 * @fileoverview React application entry point for EcoSense AI.
 * Initialises the window.storage polyfill and mounts the root component
 * wrapped in an error boundary.
 */

import React from "react";
import { createRoot } from "react-dom/client";
import "./storage-polyfill.js";
import ErrorBoundary from "./ErrorBoundary.jsx";
import App from "./App.jsx";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element #root not found. Check index.html.");
}

createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
