import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/layout.css";
import "./styles/chat.css";
import "./styles/marketing.css";
import "./styles/theme-dark.css";

// Same guard as the previous build: ignore a noisy browser DataCloneError from PerformanceServerTiming.
window.addEventListener("error", (e) => {
  if (e.error instanceof DOMException && e.error.name === "DataCloneError" && e.message?.includes("PerformanceServerTiming")) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, true);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
