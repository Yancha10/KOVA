# Instrucciones para continuar KOVA

Antes de editar, lee `docs/AI_HANDOFF.md`, `README.md` y los archivos afectados. Esta guía describe el estado real de la aplicación, sus límites y las verificaciones realizadas.

## Alcance y prioridades

- KOVA es un proyecto independiente. No edites Saga Studio ni ningún otro repositorio para completar una tarea de KOVA.
- Mantén el diseño y la interfaz en español, responsive y accesible. No sustituyas la aplicación por una maqueta ni introduzcas estadísticas ficticias como si fueran registros reales.
- El núcleo debe funcionar sin una API de pago. No agregues dependencias obligatorias de OpenAI ni llamadas facturables sin petición explícita del usuario.
- El coach actual utiliza reglas transparentes. No lo describas como un modelo entrenado o un LLM autónomo.
- Conserva planes e historial al activar otro programa; no cuentes sesiones de un programa anterior como completadas del activo.
- No automatices el paso a muscle-ups o pino libres. La selección de ruta es manual y los criterios requieren revisión de un coach.

## Datos y seguridad

- Los datos de entrenamiento y las claves no pertenecen al repositorio, aunque el código sea público.
- Mantén autorización por propietario en el servidor. Los identificadores de perfil del navegador no son una prueba de identidad.
- Conserva el control de revisiones y los marcadores `_deleted` al modificar la sincronización.
- No registres claves de Gemini ni texto de documentos en logs. La clave opcional permanece en memoria para la petición, sin persistencia.
- No elimines las migraciones ya aplicadas. Añade migraciones nuevas y conserva SQL y metadatos.
- No copies `.openai/hosting.json` a un Site diferente manteniendo su identificador. No publiques una copia sobre el Site original por accidente.
- No cambies la privacidad de la app ni publiques registros personales por el hecho de que el repositorio de código sea público.

## Comprobaciones

Usa Node 24 para las pruebas con TypeScript nativo y respeta el lockfile de pnpm.

```sh
pnpm run typecheck
pnpm test
pnpm run build
pnpm run build:pages   # versión abierta de GitHub Pages (ver docs/GITHUB_PAGES.md)
```

Prueba el flujo afectado en el navegador cuando esté disponible. Indica con precisión qué se comprobó y qué no. El despliegue correcto no demuestra por sí solo sincronización entre dos dispositivos ni acceso real a Gemini.

## Entrega

Actualiza `docs/AI_HANDOFF.md` cuando cambien arquitectura, modelo de datos, reglas, integración con IA, despliegue o limitaciones. Explica los cambios y las verificaciones sin afirmar que funciones opcionales o pendientes están terminadas.

## Versión abierta en GitHub Pages

La versión pública sin ChatGPT se construye con `pnpm run build:pages` y se publica en la rama `gh-pages`. Sigue `docs/GITHUB_PAGES.md`: trabaja siempre en `main` y no edites `gh-pages` a mano.
