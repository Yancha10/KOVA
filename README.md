# KOVA Training

Un espacio privado de entrenamiento en español. Incluye un programa real de 24 semanas y 72 sesiones de gimnasia y acondicionamiento, con adaptación transparente basada en registros.

## Continuar con otra IA

Lee primero [la guía de continuidad](docs/AI_HANDOFF.md) y [las instrucciones para agentes](AGENTS.md). Incluyen arquitectura, modelo de datos, reglas exactas, importación, sincronización, despliegue, pruebas realizadas y limitaciones pendientes. Repositorio público de código: https://github.com/Yancha10/KOVA. Esto no hace públicos los registros de la app.

## Versión abierta (GitHub Pages)

KOVA también se publica como app estática en **https://yancha10.github.io/KOVA/**, sin iniciar sesión y sin servidor: cada persona guarda sus datos en su dispositivo y puede sincronizarlos con su Google Drive. Para construirla y publicarla, ver `docs/GITHUB_PAGES.md`.

## Funcionalidad

- Perfiles de atletas separados dentro de una cuenta; calendario y programa por perfil.
- Check-in de sueño, molestias musculares, estrés, energía y síntomas.
- Adaptación conservadora de la dosis, comparación con el plan original y motivos visibles.
- Dosis de pull-ups, chest to bar y toes to bar a partir de la última evaluación.
- Rutas manuales H0-H5 y M0-M4; no se autoriza automáticamente un movimiento libre.
- Registro de clases y open gym, resultado, series, RPE, minutos y patrones cargados.
- Marcas editables, gráficos con datos reales, diario y exportación CSV.
- Timer Lab independiente: AMRAP, for time, EMOM, Tabata, intervalos, libre e híbrido con parciales. Cuenta previa, pausa, recuperación local, sonido y vibración opcionales.
- Edición Athlete con temas claro, oscuro y automático; navegación táctil, sesiones por bloques y paneles por pestañas.
- Importación local de PDF con texto, DOCX, TXT, MD y JSON. Vista previa editable y confirmación antes de activar.
- Reconocimiento de la plantilla original del plan de 24 semanas.
- Puente manual con ChatGPT mediante petición y JSON, sin API de OpenAI.
- Gemini opcional: clave introducida por el usuario, mantenida solo en memoria y enviada por HTTPS al servidor para esa petición. Solo debe usarse un proyecto sin facturación si se quiere evitar cargos. La disponibilidad de cuota gratuita depende de Google.
- Guardado local de cambios pendientes, sincronización privada en D1 y control optimista de revisiones.
- Copias completas JSON y restauración mediante fusión de registros.
- Edición Afterglow: violetas, rosas y crema; cristal con desenfoque, animaciones de botones y respeto a movimiento reducido.
- Dictado web cuando el navegador lo soporte, con alternativa de dictado del teclado; organización local de una sesión en bloques y revisión antes de guardar. También prepara registros hablados sin inventar esfuerzo o duración ausentes.
- Escuela de movimientos: 23 fichas con pasos, claves, errores, escalado y enlaces a demostraciones oficiales. Acceso contextual desde cada bloque reconocido.
- Google Drive opcional con OAuth propio: sincronización manual, fusión de copias y verificación de bytes guardados. **Necesita configurar un Client ID de Google**; el complemento de ChatGPT no proporciona esa autorización a la app. Consulta [la configuración de Drive](docs/GOOGLE_DRIVE.md).

## Qué significa adaptativo

Es un motor de reglas, no un modelo entrenado con los datos del usuario. La recuperación orientativa pondera sueño 30%, molestias 25%, estrés 20% y energía 25%. Reduce volumen al 50% con puntuación inferior a 45, y aproximadamente al 75% entre 45 y 64. Dos sesiones RPE 8 o más en siete días, o patrones cargados registrados hoy o ayer, activan una dosis conservadora. Un registro de síntomas suspende los bloques. La carga semanal es minutos por RPE; no predice lesiones ni acredita que entrenar sea seguro.

El programa original no se modifica. Las marcas más recientes calibran las dosis; una mejor marca histórica no reemplaza una evaluación reciente más baja. Los registros de otros programas conservan su histórico sin contar como sesiones completadas del programa activo.

## Arquitectura

- React 19, TypeScript, Vinext y Vite.
- Cloudflare Workers y D1 mediante Drizzle.
- Identidad gestionada por Sites y Sign in with ChatGPT.
- PDF.js y Mammoth cargados solo al importar.
- API `/api/state`: filas por propietario autenticado, validación de estructura y revisiones optimistas; respuesta 409 ante conflictos.
- API `/api/analyze`: acceso autenticado, comprobación de origen y llamada opcional a Gemini; no persiste claves.
- El manifiesto permite abrir el sitio como aplicación independiente cuando el navegador lo soporte. No se promete apertura completa sin red; los cambios de una sesión ya abierta se conservan localmente.

## Desarrollo

Requiere Node 24 y pnpm. El proyecto conserva los helpers de Sites para mantener su integración de identidad, almacenamiento y despliegue.

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
pnpm run dev
```

La base de datos se genera con `pnpm run db:generate`. Las migraciones se aplican al entorno local o al despliegue de Sites; no se crea el esquema durante las peticiones. El archivo `.openai/hosting.json` conserva la identidad de este Site. No copies esa identidad a otro producto.

En un alojamiento externo habrá que sustituir los helpers de identidad de Sites por autenticación verificada y conectar la base de datos. GitHub puede alojar el código; GitHub Pages por sí solo no ejecuta este backend ni sincroniza datos.

## Comprobaciones realizadas

- TypeScript sin emisión.
- Pruebas del motor: aislamiento por perfil, ventanas de carga, síntomas, dosis con la última evaluación, conflictos y borrados mediante fusión, calendario y validación del importador.
- Compilación de producción.
- Lectura del PDF original de 34 páginas con PDF.js.
- Pruebas en navegador de check-in, sesión, cronómetro, registro, gráficos, importación local, revisión y activación de un nuevo programa.

La integración opcional con Gemini no se ha probado con una clave real. No hay claves incluidas en el repositorio. Las pruebas en vista previa no equivalen a una auditoría de seguridad ni a una validación clínica.

## Antes de venderlo

Esta versión es una base funcional privada para uso y validación. Una salida comercial requiere suscripciones y cobros, gestión de organizaciones o entrenadores, autenticación independiente si se aloja fuera de Sites, políticas y consentimiento sobre datos, controles de retención y borrado, pruebas en dispositivos reales, accesibilidad y revisión de seguridad. El análisis libre de documentos debe seguir teniendo revisión humana.

El nombre KOVA es provisional; no se ha comprobado su disponibilidad comercial. No se concede licencia pública de uso del código por defecto. Se incluyen dependencias de terceros sujetas a sus propias licencias.

## Fuentes técnicas del entrenamiento

- https://www.crossfit.com/pro-coach/strict-before-kipping
- https://www.crossfit.com/essentials/crossfit-toes-to-bar-rx-plan
- https://www.crossfit.com/essentials/crossfit-bar-muscle-up-rx
- https://www.crossfit.com/essentials/crossfit-handstand-walking-rx-plan

Los umbrales operativos y las dosis concretas son decisiones de este plan, no normas universales ni garantías de resultado.
