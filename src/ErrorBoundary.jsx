/**
 * @fileoverview React Error Boundary for EcoSense AI.
 * Catches unhandled render errors and displays a graceful fallback UI
 * instead of a blank white screen.
 */

import React from "react";

/**
 * @typedef {Object} ErrorBoundaryState
 * @property {boolean}    hasError - Whether an error has been caught
 * @property {Error|null} error    - The caught error object
 */

/**
 * Application-level error boundary.
 * Wraps the entire app to prevent crashes from propagating to a blank screen.
 * @extends {React.Component}
 */
class ErrorBoundary extends React.Component {
  /** @type {ErrorBoundaryState} */
  state = { hasError: false, error: null };

  /**
   * Updates state when a descendant throws during render.
   * @param {Error} error - The thrown error
   * @returns {ErrorBoundaryState}
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Logs error details for debugging.
   * @param {Error} error - The thrown error
   * @param {React.ErrorInfo} info - Component stack trace
   */
  componentDidCatch(error, info) {
    // In production, replace with a real logging service (e.g. Sentry)
    if (typeof console !== "undefined") {
      console.error("[EcoSense AI] Render error:", error, info.componentStack);
    }
  }

  /** Resets error state so the user can retry. */
  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight:      "100vh",
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            background:     "#070D14",
            color:          "#EAF2F0",
            fontFamily:     "Inter, sans-serif",
            padding:        "24px",
            textAlign:      "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">🌱</div>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "#8FA3A0", fontSize: 14, maxWidth: 400, marginBottom: 24 }}>
            EcoSense AI encountered an unexpected error. Your saved data is safe —
            refreshing the page should restore everything.
          </p>
          {this.state.error && (
            <pre
              style={{
                background:   "#111B2E",
                border:       "1px solid rgba(255,255,255,0.09)",
                borderRadius: 10,
                padding:      "12px 16px",
                fontSize:     11,
                color:        "#F87171",
                maxWidth:     500,
                overflow:     "auto",
                marginBottom: 24,
                textAlign:    "left",
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            style={{
              background:   "linear-gradient(135deg,#34D399,#38BDF8)",
              color:        "#06251D",
              border:       "none",
              borderRadius: 10,
              padding:      "10px 24px",
              fontWeight:   700,
              fontSize:     14,
              cursor:       "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
