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
};
fs.writeFileSync(path.join(out, "manifest.webmanifest"), JSON.stringify(manifest));
fs.copyFileSync(path.join(out, "index.html"), path.join(out, "404.html"));
fs.writeFileSync(path.join(out, ".nojekyll"), "");
console.log("dist-pages listo para GitHub Pages");
