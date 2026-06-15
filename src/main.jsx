import React from "react";
import { createRoot } from "react-dom/client";
import "./storage-polyfill.js";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
