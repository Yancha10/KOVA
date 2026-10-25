// Versión abierta de KOVA (GitHub Pages). Sin servidor ni cuentas: ver docs/GITHUB_PAGES.md.
import React from "react";
import { createRoot } from "react-dom/client";
import "../../app/ios.css";
import "./theme.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Funciona sin conexión una vez abierta (solo en producción, no en desarrollo).
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* sin modo offline */
    });
  });
}
