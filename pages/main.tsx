// Entrada de la versión estática de KOVA (GitHub Pages).
// No usa el servidor de ChatGPT Sites: los datos se guardan en el dispositivo
// y, si el usuario quiere, en su Google Drive (Más → Guardar en Drive).
import React from "react";
import { createRoot } from "react-dom/client";
import "../app/globals.css";
import "../app/touch.css";
import "../app/retro.css";
import "../app/ios.css";
import TrainingApp from "../app/components/TrainingApp";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TrainingApp accountId="local" signedIn={false} />
  </React.StrictMode>,
);
