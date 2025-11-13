import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { FrappeProvider } from "frappe-react-sdk";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FrappeProvider>
      <App />
    </FrappeProvider>
  </React.StrictMode>
);