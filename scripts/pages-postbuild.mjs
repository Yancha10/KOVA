// Ajustes tras construir la versión de GitHub Pages:
// manifest con rutas relativas, 404.html para enlaces directos y .nojekyll.
import fs from "node:fs";
import path from "node:path";

const out = path.resolve("dist-pages");
const manifest = {
  name: "KOVA Training",
  short_name: "KOVA",
  description: "Tu centro de entrenamiento adaptativo",
  start_url: "./",
  scope: "./",
  display: "standalone",
  background_color: "#F6F0F6",
  theme_color: "#62407B",
  icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  shortcuts: [
    { name: "Sesión de hoy", short_name: "Hoy", url: "./#train" },
    { name: "Cronómetro", short_name: "Reloj", url: "./#timer" },
    { name: "Registrar agua", short_name: "Agua", url: "./#nutrition" },
    { name: "Mi progreso", short_name: "Progreso", url: "./#progress" },
  ],
};
fs.writeFileSync(path.join(out, "manifest.webmanifest"), JSON.stringify(manifest));
fs.copyFileSync(path.join(out, "index.html"), path.join(out, "404.html"));
fs.writeFileSync(path.join(out, ".nojekyll"), "");
fs.copyFileSync(path.resolve("web/public/sw.js"), path.join(out, "sw.js"));
console.log("dist-pages listo para GitHub Pages");
