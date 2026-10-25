# KOVA en GitHub Pages (versión abierta, sin ChatGPT)

Además del Site privado de ChatGPT, KOVA tiene una versión estática pública que no depende de ChatGPT ni de ningún servidor. Es la que el usuario quiere usar y compartir.

- **Enlace público:** https://yancha10.github.io/KOVA/
- **Código:** el mismo de `app/`. La entrada estática está en `pages/` y la configuración en `vite.pages.config.ts`.
- **Datos:** cada persona guarda los suyos en su navegador (`localStorage`, clave `kova-v1-local`). Nadie ve los datos de nadie. Para usarlos en varios dispositivos están **Más → Guardar en Drive** y la exportación/importación de copias.
- **Sin servidor:** `/api/state` no se usa (`signedIn=false`). `/api/analyze` (Gemini) no existe en Pages: esa opción falla con un aviso y el resto de la importación funciona en local.

## Cómo se construye

```sh
pnpm install --frozen-lockfile
pnpm run build:pages      # → dist-pages/ (index.html, 404.html, .nojekyll, manifest relativo)
pnpm run preview:pages    # prueba local en http://localhost:4173
```

`base: "./"` hace que funcione en cualquier subruta (por ejemplo, `/KOVA/`). Las rutas a recursos de `public/` deben ser relativas (por ejemplo, `new URL('pdf.worker.min.mjs', document.baseURI)`).

## Cómo se publica

GitHub Pages sirve la rama **`gh-pages`** (raíz). Para publicar un cambio:

```sh
pnpm run build:pages
# Copia el contenido de dist-pages/ a la raíz de la rama gh-pages y haz commit/push.
# Ejemplo con git worktree:
git worktree add /tmp/kova-pages gh-pages
rsync -a --delete --exclude .git dist-pages/ /tmp/kova-pages/
cd /tmp/kova-pages && git add -A && git commit -m "Publica KOVA en GitHub Pages" && git push origin gh-pages
git worktree remove /tmp/kova-pages
```

Ajuste del repositorio (una sola vez): **Settings → Pages → Build and deployment → Deploy from a branch → `gh-pages` / `(root)`**.

## Reglas para cualquier IA que continúe

1. Cambia el código en `main` (carpetas `app/`, `pages/`, `tests/`, `docs/`). **No edites `gh-pages` a mano**: es solo el resultado de `build:pages`.
2. Antes de publicar: `pnpm run typecheck`, `pnpm test`, `pnpm run build` (Site de ChatGPT) y `pnpm run build:pages`.
3. Prueba el flujo en un navegador móvil (390 × 844) sirviendo `dist-pages/` bajo una subruta, por ejemplo `/KOVA/`.
4. Publica `dist-pages/` en `gh-pages` y actualiza `docs/AI_HANDOFF.md` si cambian datos, arquitectura o despliegue.
5. No guardes claves, tokens ni datos personales en el repositorio. El Client ID de Google (`app/lib/config.ts`) es público, pero un *client secret* nunca.

## Google Drive en la versión abierta

Para que el botón de Drive funcione sin configurarlo en cada dispositivo, crea un ID de cliente OAuth de tipo «Aplicación web» en Google Cloud con el origen autorizado `https://yancha10.github.io`, ponlo en `GOOGLE_DRIVE_CLIENT_ID` de `app/lib/config.ts` y vuelve a publicar. Detalles en `docs/GOOGLE_DRIVE.md`.
