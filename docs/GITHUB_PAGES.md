# KOVA en GitHub Pages (versión abierta, sin ChatGPT)

Además del Site privado de ChatGPT, KOVA tiene una versión estática pública que no depende de ChatGPT ni de ningún servidor. Es la que el usuario quiere usar y compartir.

- **Enlace público:** https://yancha10.github.io/KOVA/
- **Código:** interfaz propia en `web/` (React + Vite), diseñada para móvil y pensada para entrenar sin menús. Reutiliza el motor y los módulos de `app/`: `app/lib/engine.ts` (datos, adaptación, dosis, coach), `app/lib/movements.ts`, `app/lib/nutrition.ts`, `app/lib/records.ts`, `app/lib/documents.ts`, `app/lib/drive.ts` y los componentes `Nutrition`, `Records`, `Report`, `Sheet`, `Stopwatch` y `DriveSync` de `app/components/`.
- **Configuración:** `vite.pages.config.ts` (raíz `web/`, `base: "./"`).

## Mapa de `web/`

| Archivo | Qué hace |
| --- | --- |
| `web/index.html`, `web/src/main.tsx` | Entrada, tema inicial y registro del service worker (modo sin conexión). |
| `web/src/App.tsx` | Estructura fija (barra superior, dock con cronómetro central), rutas por hash (`#train`, `#plan`, `#timer`, `#nutrition`, `#progress`, `#profile`) y hojas inferiores. |
| `web/src/store.ts` | Datos en `localStorage` (`kova-v1-local`) con el mismo formato `Store`; `put` y `mutate` siempre crean objetos nuevos y conservan `_deleted`. |
| `web/src/screens/Train.tsx` | Sesión del día en fichas (un bloque por ficha, deslizable), check-in y registro con RPE. Aplica `adaptSession`. |
| `web/src/screens/PlanView.tsx` | Semanas, escuela de movimientos con demostraciones animadas y programas (activar e importar). |
| `web/src/screens/TimerView.tsx` | Cronómetro (AMRAP, for time, EMOM, Tabata, intervalos, descanso y libre): escena animada, voz, pitidos, rondas tocando la pantalla y resultado hacia el registro. Siempre montado para no parar al cambiar de pestaña. |
| `web/src/screens/ProgressView.tsx` | Informe, evaluaciones (dosis), récords y diario. |
| `web/src/screens/ProfileView.tsx` | Atletas, coach por reglas, ajustes, copias, Google Drive y formularios (perfil, check-in, importar plan). |
| `web/src/figures.ts` | Motor de demostraciones animadas (poses clave interpoladas) y `FIGURE_FOR`, que asocia movimientos de la escuela con su animación. |
| `web/src/theme.css` | Diseño: clases `k-*`. Las `ios-*` vienen de `app/ios.css`. |
| `web/public/sw.js` | Caché para usar la app sin conexión. |

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

GitHub Pages ya está activado y sirve la rama **`gh-pages`** (raíz). La primera publicación es el commit `80a6a65`, construido desde `main` `2d30fad`. Para publicar un cambio:

```sh
pnpm run build:pages
# Copia el contenido de dist-pages/ a la raíz de la rama gh-pages y haz commit/push.
# Ejemplo con git worktree:
git worktree add /tmp/kova-pages gh-pages
cd /tmp/kova-pages && git rm -rq . && cp -a "$OLDPWD"/dist-pages/. . && cd "$OLDPWD"
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
