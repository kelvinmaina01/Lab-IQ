import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize Dependency Injection Container
import { registerServices, getLogger } from "./lib/di";

// Register all services at startup
registerServices();

const logger = getLogger();
logger.info("LabIQ Health starting...");
logger.debug("DI container initialized");

createRoot(document.getElementById("root")!).render(<App />);
