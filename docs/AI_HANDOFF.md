# KOVA Training guía de continuidad para otra IA

Fecha de esta revisión: 24 de octubre de 2026.

Este archivo es el punto de entrada para retomar el proyecto sin la conversación original. Documenta la implementación existente y distingue lo construido, lo verificado y lo pendiente. Debe leerse junto con `AGENTS.md` y el código: ante una discrepancia, verifica el comportamiento real antes de cambiarlo.

## 1 Objetivo y decisiones del usuario

Crear una aplicación de entrenamiento cuidada visualmente que permita a dos atletas de CrossFit seguir un programa, registrar resultados, revisar progreso y ajustar la dosis con sus datos. El usuario quiere usarla desde varios dispositivos y, si funciona bien, evolucionarla hacia un producto comercial.

Punto de partida declarado: ya enlazan repeticiones de gimnasia y mantienen tres o más clases de CrossFit semanales, además de los tres open gym. El plan complementario desarrolla handstand walk, bar muscle-up, chest to bar, kipping pull-ups, toes to bar y capacidad aeróbica. Cada sesión del plan base contiene un bloque de acondicionamiento de 15 minutos.

Decisiones confirmadas:

- No se autoriza una API de OpenAI de pago como dependencia del producto.
- Se acepta una base gratuita y análisis opcional mediante otros modelos con cuota gratuita.
- La suscripción de ChatGPT no se usa como API automática de la app. Se ofrece un puente manual de copiar petición y pegar JSON.
- El código debe ir en un repositorio NUEVO y PÚBLICO de GitHub, separado de otros proyectos. El nombre propuesto es `kova-training` en la cuenta conectada `Yancha10`.
- El usuario puede crear el repositorio si la herramienta no permite hacerlo. No usar el repositorio `codex` ni modificar otro proyecto como sustituto.
- Una app pública comercial es una evolución posterior. Publicar el código no implica publicar los datos ni cambiar automáticamente la privacidad del sitio.

No atribuyas datos personales o médicos a un atleta por el nombre de la cuenta. Los perfiles se configuran dentro de KOVA y mantienen datos independientes.

## 2 Estado real de entrega

La primera versión está implementada y desplegada en:

https://kova-training-lab.daniotero.chatgpt.site

El Site fue creado con acceso privado. En el navegador sin sesión se verificó que exige continuar con ChatGPT. No se ha convertido en un sitio anónimo público. Los datos deben seguir protegidos aunque el repositorio de código sea público.

Publicación funcional confirmada del código de la aplicación:

- Commit original: `333221fe5773ba1655815c683a942391ef5f4b7b`.
- Proyecto Sites: `appgprj_6add071f4ac48191bdb5ae41f56a1995`.
- Versión: `appgprj_6add071f4ac48191bdb5ae41f56a1995~appgver_7466195e3dbc8191898226cda3f17267`.
- Despliegue: `appgdep_6add0cfb47ac8191aa78f9d62f4fcabe`, resultado `succeeded`.

Estos identificadores son referencias del alojamiento existente, no credenciales. No autorizan por sí mismos a desplegar ni permiten acceder a datos. La documentación añadida posteriormente puede tener un commit distinto; comprueba el HEAD y el manifiesto actuales.

El repositorio nuevo, público y confirmado es https://github.com/Yancha10/KOVA, creado por el usuario. La subida del código se realiza mediante el complemento de GitHub. Comprueba el HEAD remoto para conocer la última entrega; el repositorio de origen de Sites es independiente.

El complemento conectado permite leer y escribir en repositorios accesibles, pero esta sesión no expone una operación para crear uno nuevo. Un intento de acceso mediante navegador pidió login y no se completó. No vuelvas a pedir contraseñas, tokens o códigos por el chat: el acceso del complemento funciona sin esa sesión del navegador remoto.

## 3 Qué funciona

| Área | Implementación existente |
| --- | --- |
| Inicio | Próxima sesión, semana elegida, estadísticas reales, carga reciente, recuperación y sugerencia del coach |
| Programa | 24 semanas, 72 sesiones A/B/C, bloques detallados, descargas, rutas y topes orientativos |
| Registro | Sesiones y clases adicionales, fecha, minutos, RPE, series, resultado, notas y patrones cargados |
| Recuperación | Check-in diario editable de sueño, molestias musculares, estrés, energía y síntomas |
| Progreso | Carga de seis ventanas semanales, marcas por movimiento, historial y exportación CSV |
| Evaluaciones | Alta, edición y borrado lógico; mejor marca histórica separada de la última evaluación usada para dosis |
| Coach | Respuestas basadas en reglas y datos del perfil, con criterios y límites visibles |
| Cronómetro | Cuenta atrás, AMRAP, minutos EMOM e intervalos explícitos del plan base; pausa, reinicio y sonido opcional |
| Biblioteca | Plan base, planes importados, exportación de planes y activación sin borrar el histórico |
| Importador | PDF con texto, DOCX, TXT, MD y JSON; vista previa editable y revisión obligatoria |
| Perfiles | Varios atletas dentro de una misma cuenta, con programa, rutas, registros y fechas por perfil |
| Persistencia | Copia local y cola de sincronización hacia D1, separada por propietario autenticado |
| Copias | Exportación JSON completa y restauración mediante fusión |
| Instalación | Web manifest y modo standalone cuando el navegador lo soporte; no es una aplicación nativa de App Store |

## 4 Arquitectura y mapa de archivos

Frontend React con TypeScript sobre Vinext y Vite. Backend desplegado como Cloudflare Worker mediante Sites. Persistencia estructurada en Cloudflare D1 con Drizzle.

| Archivo o directorio | Responsabilidad |
| --- | --- |
| `app/page.tsx` | Obtiene identidad del servidor y monta la app cliente |
| `app/components/TrainingApp.tsx` | Navegación, dashboard, formularios, calendario, progreso, coach, biblioteca, importador y cronómetro |
| `app/globals.css` | Estilos originales y formularios compartidos |
| `app/touch.css` | Edición Athlete, superficies claro/oscuro y adaptación táctil |
| `app/components/TouchUI.tsx` | Inicio compacto, temas, programa por tarjetas, sesión por bloques y menú Más |
| `app/components/TimerStudio.tsx` | Interfaz de Timer Lab, persistencia local y controles de entrenamiento |
| `app/lib/timer.ts` | Cálculo puro de fases, tiempo, restauración y validación del timer |
| `app/lib/engine.ts` | Tipos, fechas, programación, fusión, validación, recuperación, dosis, adaptación, rutas y parser |
| `app/lib/useStore.ts` | Estado React, caché local, sincronización, revisiones y reintentos |
| `app/lib/base-plan.json` | Plan base completo de 72 sesiones |
| `app/lib/documents.ts` | Extracción de archivos y reconocimiento de la plantilla original |
| `app/api/state/route.ts` | GET y PUT del estado del propietario autenticado |
| `app/api/analyze/route.ts` | POST opcional para interpretar texto con Gemini |
| `app/chatgpt-auth.ts` | Integración de identidad de Sites; no es acceso a un modelo ChatGPT |
| `db/schema.ts` | Tabla `athlete_state` |
| `db/index.ts` | Acceso al binding D1 mediante Drizzle |
| `drizzle/` | Migración inicial y metadatos; conservar historial de migraciones |
| `worker/index.ts` | Entrada del Worker e integración del starter |
| `.openai/hosting.json` | Identidad y bindings del Site actual |
| `scripts/` | Helpers de entorno, instalación y compilación incluidos por el starter |
| `public/` | Iconos, manifest y worker de PDF.js |
| `tests/engine.test.ts` | Seis pruebas automatizadas del motor |
| `README.md` | Resumen de producto y desarrollo |
| `AGENTS.md` | Instrucciones de continuidad para agentes de programación |

`TrainingApp.tsx` concentra muchos componentes y utiliza líneas largas. Una separación por pantallas y formularios puede mejorar el mantenimiento. No la conviertas en una reescritura completa sin necesidad: conserva comportamiento y verifica cada flujo tras extraer componentes.

## 5 Diseño e interacción

La dirección visual combina fondo crema, verde bosque, acentos lima y tipografía editorial con títulos en cursiva serif en algunas zonas. El panel tiene navegación lateral en escritorio y navegación inferior en móvil. La esfera y los contornos del hero se construyen con CSS y SVG, no son una imagen ni una visualización de métricas del atleta.

Colores principales declarados en CSS:

```css
--bg: #f5f5f0;
--ink: #1c302a;
--green: #244e40;
--forest: #143b31;
--lime: #d6f68a;
--line: #e5e8df;
```

Mantén jerarquía, espacios y legibilidad. No añadas indicadores de éxito, cargas óptimas o predicciones que no se calculen. Los estados sin datos deben seguir siendo explícitos; las curvas decorativas de los gráficos vacíos están rotuladas como ausencia de historial.

## 6 Modelo de datos

El estado de aplicación usa `schema: 1` y cinco colecciones:

```ts
type Store = {
  schema: 1;
  profiles: Profile[];
  plans: Plan[];
  logs: Entry[];
  checks: Entry[];
  marks: Entry[];
};
```

Campos principales:

| Entidad | Campos relevantes |
| --- | --- |
| Perfil | `id`, `name`, `startDate`, `days`, `planId`, `hRoute`, `mRoute`, `goal`, `classes`, `updatedAt` |
| Plan | `id`, `name`, `weeks`, `source`, `sessions`, `updatedAt` |
| Sesión | `id`, `week`, `day`, `title`, `duration`, `blocks`; plan base añade `theme`, `block`, `deload`, `cap` |
| Bloque | `type`, `title`, `minutes`, `text`; puede incluir `interval` con `rounds`, `work` y `rest` en segundos |
| Registro | `id`, `profileId`, `date`, `sessionId`, `title`, `minutes`, `rpe`, `sets`, `score`, `note`, `barHeavy`, `pushHeavy`, `kind`, `updatedAt` |
| Check-in | `id`, `profileId`, `date`, `sleep`, `soreness`, `stress`, `energy`, `pain`, `note`, `updatedAt` |
| Marca | `id`, `profileId`, `date`, `metric`, `value`, `note`, `updatedAt` |

Las entidades pueden tener `_deleted: true` para conservar el borrado durante las fusiones. No retires esos marcadores solo porque una entidad no se muestra.

`days` utiliza 0 para lunes y 6 para domingo. El calendario parte de la primera fecha del día A a partir de `startDate`; B y C se sitúan en la misma ventana de siete días según sus días configurados. La semana se calcula respecto a esa primera sesión A. Las fechas usan días locales del navegador y hora local de mediodía para sus operaciones; no asumas que una fecha representa un instante exacto.

El plan base no se duplica dentro de `Store.plans`; se incorpora desde `base-plan.json`. Sus IDs son estables, por ejemplo `base-w1-A`. Cada plan importado recibe IDs nuevos. Los completados del programa activo se filtran por sus IDs, mientras el histórico conserva registros de programas previos.

Las métricas de marcas son `pu`, `c2b`, `ttb`, `hsw`, `bmu` y `row`. Unidades: repeticiones, metros para HSW y segundos para remo de 2000 m. El tiempo de remo mejora al bajar; el resto mejora al subir. Las comparaciones solo tienen sentido con escalas y condiciones equivalentes.

## 7 Recuperación y reglas de adaptación

No hay entrenamiento de un modelo de machine learning. La app aplica reglas deterministas y conserva el plan original.

El índice de recuperación, redondeado y limitado a 0-100, calcula:

```text
30% × min(100, horas_de_sueño / 8 × 100)
+ 25% × ((6 - molestias) / 5 × 100)
+ 20% × ((6 - estrés) / 5 × 100)
+ 25% × (energía / 5 × 100)
```

Molestias, estrés y energía van de 1 a 5. Sin check-in no se inventa una puntuación.

| Condición registrada | Resultado implementado |
| --- | --- |
| `pain` activo hoy | Factor 0 y sustitución del texto de todos los bloques por indicación de no realizarlos con síntomas |
| Recuperación inferior a 45 | Factor 0,5 |
| Recuperación de 45 a 64 | Factor 0,75 |
| Dos registros RPE 8 o más en los últimos siete días | Como máximo factor 0,5 y cardio suave |
| Algún registro hoy o ayer con `barHeavy` o `pushHeavy` | Como máximo factor 0,5 |
| Ninguna de las condiciones anteriores | Factor 1 |

La carga se calcula como suma de `minutes × rpe` de los registros del perfil en la ventana considerada. No predice lesiones ni evalúa aptitud médica.

La adaptación reduce ciertas expresiones de series en el texto mediante patrones como `N x`, `N series`, `N exposiciones` o `N vueltas`. Redondea hacia abajo con un mínimo de una serie si el factor es positivo. Si hay reducción, el acondicionamiento se sustituye en el texto por 15 minutos suaves a RPE 4-5.

Limitación importante: es una transformación textual, no un modelo semántico de volumen. No reduce automáticamente todas las formas posibles de escribir un entrenamiento. Además, el factor por patrones cargados es conservador y global; no existe todavía una matriz de fatiga separada para cada patrón. Los topes dinámicos se muestran, pero la app no cuenta físicamente repeticiones ni impide superarlos. El usuario y su coach deben aplicarlos.

Las exposiciones de hoy o ayer no equivalen a una medición exacta de 48 horas, porque los registros solo guardan fecha. Si quieres modelar recuperación por horas, añade instantes y migración de datos explícitos.

## 8 Calibración de gimnasia

Se toma la última evaluación por fecha y, a igualdad de fecha, por `updatedAt`. La mejor marca histórica se muestra aparte y no determina la dosis.

```text
qPU  = floor(40% de Mpu), mínimo 1, máximo 5
qTTB = floor(40% de Mttb), mínimo 1, máximo 4
qC2B = floor(40% de Mc2b), mínimo 1, máximo 3
Lpu  = floor(70% de Mpu), mínimo 1, máximo 10
Lttb = floor(70% de Mttb), mínimo 1, máximo 8
```

Las expresiones `q+1` se limitan a un 60% de la evaluación del movimiento, con un mínimo de una repetición. Sin marcas se usa dosis mínima y se recomienda evaluar o utilizar regresiones. El motor no verifica físicamente el rango ni sabe si una serie fue limpia.

Rutas H0-H5: apoyo en cajón, pared, cambios de peso, separaciones de pared, primeros pasos y tramos de 2-5 m. Rutas M0-M4: transición en barra baja, ayuda desde cajón, tracción alta, singles libres y consolidación de singles o dobles. Su selección es manual.

Los criterios operativos previos a intentos libres de BMU son 5 pull-ups estrictas, 3 C2B, 5 fondos en barra, tracción alta y transición simétrica revisadas por un coach. Son criterios conservadores del plan, no una norma universal ni una acreditación automática.

## 9 Sincronización y separación por propietario

La tabla `athlete_state` tiene:

```text
owner_id    TEXT PRIMARY KEY
payload     TEXT NOT NULL
revision    INTEGER NOT NULL DEFAULT 1
updated_at  INTEGER NOT NULL
```

Hay una fila por cuenta autenticada y un documento JSON para su conjunto de perfiles. Los perfiles de una cuenta no son cuentas independientes ni tienen permisos separados de lectura. Para una futura plataforma de entrenador y clientes será necesario otro modelo de autorización.

Identidad: `app/chatgpt-auth.ts` lee los headers de identidad suministrados por la infraestructura de Sites. No traslades ese mecanismo a otro hosting sin validar identidad de manera segura: un servidor expuesto directamente no debe confiar en headers que pueda fabricar un cliente.

### API de estado

- `GET /api/state`: requiere identidad; devuelve `{ state, revision }`. Sin fila: `state: null`, `revision: 0`.
- `PUT /api/state`: recibe `{ state, revision }`; requiere identidad, valida forma y tamaño y comprueba el origen cuando está presente.
- Revisión cero: inserción sin sobrescribir una fila existente.
- Revisión existente: actualización solo si propietario y revisión coinciden; incrementa la revisión.
- Conflicto: HTTP 409 con el estado y la revisión actuales.
- Error de identidad: HTTP 401. Estado inválido: HTTP 400. Tamaño excesivo: HTTP 413. Error de persistencia: HTTP 503.
- Respuestas de estado con `Cache-Control: no-store`.

El límite de la petición se comprueba actualmente sobre longitud de texto, aproximadamente 1,8 millones de caracteres; no es un contador exacto de bytes. `validStore` valida las colecciones y campos esenciales; no equivale a una auditoría de entradas exhaustiva.

### Caché y fusión

- Clave local: `kova-v1-<accountId>`.
- La caché conserva estado, revisión y si hay cambios pendientes.
- La preferencia del perfil activo se guarda por separado en `kova-active-<accountId>`.
- Cada cambio programa un guardado tras unos 600 ms; hay reintentos periódicos cada 15 segundos y refresco al volver a foco o conexión.
- En conflictos, `mergeStores` fusiona colecciones por `id`, conservando la versión con `updatedAt` mayor; en igualdad prevalece el elemento de la segunda colección.
- Los marcadores `_deleted` también participan en la fusión.

No se utiliza CRDT ni relojes del servidor para cada entidad. Un reloj incorrecto en un dispositivo puede decidir mal una colisión. Antes de ampliar a equipos o datos de alto valor, añade pruebas de concurrencia reales, versionado por entidad y estrategia explícita de conflicto.

La caché no está cifrada por la aplicación. No guardes información especialmente sensible en notas. No afirmes que cerrar sesión elimina la copia del dispositivo: todavía no hay un flujo de purga local y remota integrado.

## 10 Importación de documentos

### Extracción local

`extractFile` permite archivos de hasta 15 MB. Los PDF se limitan a 80 páginas. PDF.js lee texto página a página usando posiciones y saltos; el worker está servido en `/pdf.worker.min.mjs`. Mammoth extrae texto de DOCX. DOC antiguo no se acepta. TXT, MD y JSON se leen como texto.

No hay OCR incorporado. Un PDF escaneado necesita transcripción externa. La lectura local no envía por sí misma el archivo a un proveedor de modelos ni guarda sus bytes en el servidor.

El texto se limita a 180.000 caracteres. La conservación del formato original y el orden de lectura no están garantizados en tablas o diseños complejos.

### Estructuración

- JSON: pasa por `normalizePlan`.
- Plantilla reconocida: algunos marcadores del PDF original activan una copia de `base-plan.json`, con IDs nuevos. Esto NO demuestra que cualquier PDF con esos marcadores sea idéntico ni conserva modificaciones externas del PDF. La interfaz avisa que debe comprobarse.
- Otros textos: `parseTextPlan` detecta encabezados de semana y día y separa bloques por calentamiento, fuerza, técnica, AMRAP, EMOM, for time y similares.
- Si no reconoce tiempo, introduce un tiempo provisional y lo etiqueta para revisar. No ocultes esa incertidumbre.
- El usuario puede revisar títulos, semanas, días, tipos, minutos e instrucciones. La confirmación es obligatoria antes de activar desde hoy.
- El histórico anterior se conserva. Al volver a importar un programa se crean IDs nuevos: sus sesiones no heredan automáticamente los completados de una copia anterior.

`normalizePlan` limita a 200 sesiones, 52 semanas, 12 bloques por sesión y 12.000 caracteres por texto de bloque. Valida antes de persistir; cualquier endurecimiento debe mantener compatibilidad con planes guardados.

### Puente con ChatGPT

`bridgePrompt` crea una petición con el formato JSON esperado. El usuario la copia, abre ChatGPT y devuelve la respuesta. Esto es manual y no comparte automáticamente el login ni consume una API desde KOVA. El contenido del documento solo sale de la app cuando el usuario lo copia o utiliza un proveedor opcional.

### Gemini opcional

`POST /api/analyze` recibe texto, clave y nombre de modelo. Requiere identidad y origen del mismo sitio. Envía la petición a Google con `x-goog-api-key`, solicita JSON y normaliza la respuesta. Tiene timeout de 60 segundos y maneja cuota agotada.

La clave se mantiene en estado de la ventana del importador y no se incluye en `Store`, D1 o copias. No la registres ni la añadas al código. El modelo sugerido inicialmente es `gemini-2.5-flash`; hay que comprobar disponibilidad y cuota actuales cuando se active.

La interfaz pide confirmar que el proyecto no tiene facturación activada, pero la app no puede verificarlo. No prometas ausencia de cargos si el usuario introduce una clave de un proyecto facturable. La cuota gratuita y el tratamiento de datos dependen de Google y pueden cambiar. La llamada real a Gemini no se ha probado en esta entrega.

## 11 Edición Athlete y Timer Lab

La revisión visual posterior añade `app/touch.css`, `app/components/TouchUI.tsx`, `app/components/TimerStudio.tsx`, `app/lib/timer.ts` y `tests/timer.test.ts`. `touch.css` se carga después del CSS original y define superficies semánticas para ambos temas. No cambies colores aislados sin comprobar claro y oscuro.

### Interfaz táctil

- Inicio compacto centrado en la siguiente sesión, semana, recuperación y accesos rápidos.
- Navegación inferior de cinco acciones: Inicio, Plan, Timer, Progreso y Más.
- `PlanDeck` muestra una sesión a la vez, con selector de semana, pestañas de día y gesto horizontal en móvil.
- `SessionFlow` muestra un bloque cada vez, texto legible, anterior/siguiente y acción de bloque completado. El checklist es de revisión local de esa ventana, no sustituye el registro de entrenamiento.
- Progreso se separa en Resumen, Marcas y Diario; Coach en Hoy, Preguntar y Rutas.
- El menú Más reúne biblioteca, importación, coach, perfil y copias.
- CrossFit, HYROX y Open gym en el inicio personalizan el acceso rápido al timer y el contexto visual. No generan ni reemplazan el programa activo.

### Apariencia

Claro, oscuro o automático según `prefers-color-scheme`. La preferencia se guarda localmente en `kova-theme`, no en D1. Un script inicial aplica el tema antes de hidratar. `ThemeSwitch` coordina todas sus instancias con el evento `kova-theme-change`, escucha cambios de almacenamiento de otras ventanas y actualiza el modo automático cuando cambia el sistema. La disciplina elegida se guarda localmente en `kova-discipline`.

### Timer independiente

`TimerStudio` permite AMRAP, for time con cap, EMOM, Tabata, intervalos configurables, cronómetro libre e híbrido con transiciones manuales. La cuenta atrás previa es configurable. Tabata e intervalos incluyen la recuperación de la última ronda en su tiempo total.

El formato híbrido contiene ocho carreras alternadas con ocho estaciones habituales; nombres y orden se usan como referencia de entrenamiento. No configura cargas, distancias ni acreditación de cumplimiento de un reglamento de carrera. Las estaciones son editables.

El reloj usa `Date.now()` y tiempo acumulado. Conserva estado y parciales localmente por cuenta y perfil en `kova-timer-<accountId>-<profileId>`. Cerrar la vista permite seguir el reloj y volver desde el botón flotante; recargar restaura su referencia temporal. No es sincronización del timer entre dispositivos. Los relojes muy antiguos se restauran pausados como protección.

Se puede pausar, reiniciar, marcar rondas o estaciones, terminar y llevar tiempo y parciales al formulario de registro. El usuario confirma duración, esfuerzo y notas antes de guardar en su diario. El sonido usa Web Audio después de una interacción; la vibración es opcional y solo funciona si el navegador la soporta. Se intenta adquirir Screen Wake Lock cuando está disponible y se vuelve a intentar al recuperar visibilidad.

No hay push ni ejecución garantizada de sonido con pantalla bloqueada. La app puede reconstruir tiempo transcurrido al volver a primer plano, pero eso no garantiza avisos en segundo plano. No hay service worker para abrir toda la app sin red.

Los intervalos estructurados de un bloque se conservan al abrirlo en el timer. Un texto importado que describa intervalos sin el campo `interval` sigue sin producir automáticamente fases semánticas completas.

## 12 Desarrollo y despliegue

El runtime utilizado para desarrollar fue Node 24 y pnpm 11.25.0. `package.json` permite una versión menor de Node, pero las pruebas usan ejecución nativa de TypeScript; utiliza Node 24 para reproducir esta entrega.

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
pnpm run dev
```

Preserva `pnpm-lock.yaml`. El proyecto contiene helpers de perfiles de ejecución del starter. En un entorno distinto del original, lee `scripts/` y sus requisitos antes de adaptar rutas o instalación.

Para cambiar el esquema:

1. Edita `db/schema.ts`.
2. Ejecuta `pnpm run db:generate`.
3. Revisa SQL y metadatos generados en `drizzle/`.
4. Aplica solo migraciones pendientes en la base local.
5. Publica mediante el flujo compatible con Sites, que aplica las migraciones alojadas.

Bindings actuales: `DB` para D1; no se usa R2. No crees tablas desde handlers ni confundas la base local de vista previa con producción.

En ChatGPT Work con el complemento Sites, lee su skill antes de publicar. Reutiliza el proyecto del manifiesto y solicita una credencial temporal para su repositorio de origen cuando sea necesaria; no la guardes ni la imprimas. La publicación usa un commit ya enviado y un artefacto construido de ese estado. Comprueba resultado final del despliegue.

Para alojar fuera de Sites hay que implementar identidad verificada y configurar almacenamiento; GitHub Pages solo sirve archivos estáticos y no ejecuta estas rutas ni D1. No prometas que un push a GitHub publica automáticamente la app: no hay ese workflow configurado.

Si se actualiza PDF.js, sincroniza `public/pdf.worker.min.mjs` con la misma versión instalada y prueba una importación de PDF de nuevo.

## 13 Verificaciones y alcance

Comprobado en esta sesión de trabajo:

- TypeScript sin emisión.
- Compilación de producción.
- Seis pruebas originales del motor: aislamiento por perfil y ventana de carga, suspensión por síntomas, dosis con evaluación reciente, fusión y borrados, calendario y parser.
- Lectura del PDF original de 34 páginas con PDF.js y detección de su plantilla.
- En navegador de vista previa: check-in, apertura de sesión, cronómetro, registro, estadísticas, lectura de texto, separación en bloques editables y activación de un programa importado.
- Resultado `succeeded` del despliegue y pantalla de acceso privado en la URL publicada.

No se ha verificado:

- Una sesión completa en producción autenticada con registros reales del usuario.
- Sincronización real de extremo a extremo entre dos dispositivos.
- Resistencia del sistema de conflictos bajo concurrencia intensiva.
- Una petición real a Gemini con clave del usuario.
- Todos los layouts PDF/DOCX, PDFs escaneados o documentos maliciosos.
- Sonido y timer en todos los móviles o con pantalla bloqueada.
- Auditoría de seguridad, pruebas de accesibilidad completas o validación clínica.

Las pruebas HTTP directas desde el contenedor hacia la vista previa no pudieron conectarse. No las presentes como superadas ni interpretes las pruebas de fusión como pruebas de aislamiento HTTP entre propietarios.

Los datos de prueba se crearon en la vista previa local de la app, no se incorporaron como historial de ejemplo al plan ni al código.

La edición Athlete añade seis pruebas de timer, para un total de doce: cuenta previa, límites EMOM, trabajo y recuperación Tabata, reloj ascendente y caps, restauración temporal y transiciones híbridas. Se revisó el diseño a ancho de 390 px mediante un iframe de QA y se probó el flujo híbrido de parcial, pausa, finalización y formulario de registro. Esto no equivale a pruebas en un iPhone o reloj físico.

## 14 Evolución recomendada

Prioridad inmediata antes de ampliar funciones:

1. Confirmar acceso del usuario y sincronización real en dos dispositivos.
2. Mantener el código y esta guía sincronizados en `Yancha10/KOVA`; los cambios en GitHub no despliegan automáticamente Sites.
3. Añadir pruebas de autorización HTTP y de concurrencia de sincronización, con identidades y almacenamiento de pruebas.
4. Endurecer validación de caché y backups, límites por bytes y errores específicos; evaluar uso de esquemas estrictos compartidos.
5. Separar volumen estructurado de texto libre para adaptar series y descansos sin sustituciones por regex.
6. Revisar la detección de plantilla PDF: evitar que un documento modificado sea reemplazado silenciosamente por el plan base.
7. Completar pruebas en dispositivos táctiles reales, sistema de temas automático, accesibilidad y avisos de audio en segundo plano.
8. Añadir historial y resolución explícita de ajustes, sin modificar el plan original.

Antes de vender:

- Producto multiusuario con permisos de atleta y coach y separación de organizaciones.
- Autenticación y recuperación de cuenta adecuadas al hosting elegido.
- Suscripciones, pagos y límites de uso, si se decide ese modelo comercial.
- Consentimiento, privacidad, retención, eliminación y exportación de datos.
- Protección ante abuso de importaciones e integración opcional con modelos.
- Auditoría de seguridad y observabilidad sin datos sensibles.
- Evaluación de dependencia de Sites, estrategia de backup y migración.
- Revisión profesional del entrenamiento y comunicación de límites.
- Comprobación del nombre y activos de marca antes de comercializar.

No añadas una licencia MIT o equivalente por inferencia: el usuario ha autorizado que el repositorio sea público, no ha decidido la licencia comercial o de código abierto.

## 15 Qué no debe perderse en una continuación

El objetivo no es una app de estadísticas ficticias ni otro generador de WOD aleatorios. Se trata de un programa con dirección, seguimiento real y ajustes explicados. Conserva el acabado visual, la revisión de documentos y la posibilidad de operar sin pagar una API. No conviertas una limitación conocida en una capacidad anunciada sin implementarla y verificarla.


## 16 Edición Afterglow: voz, aprendizaje y Google Drive

Esta revisión conserva el programa de 72 sesiones, D1 y las reglas del coach. Añade:

- `app/retro.css`, cargado tras `touch.css`: paletas lavanda/rosa/crema y ciruela; vidrio con `backdrop-filter` y alternativa sólida; animación de pulsación; `prefers-reduced-motion` y `prefers-reduced-transparency`.
- Inicio con Dictar entreno, Registrar resultado y Ver tutoriales. Menú Más agrupado por acciones, guía de inicio y secciones separadas de perfil/copias. La navegación lateral usa palabras concretas.
- `app/components/VoiceComposer.tsx` y `app/lib/voice.ts`: SpeechRecognition/webkitSpeechRecognition cuando existe, captura solo iniciada por botón, fin/aborto al cerrar, texto intermedio y errores. Si no está disponible, se usa el micrófono del teclado o texto. El servicio del navegador puede enviar audio fuera del dispositivo; se explica antes de pulsar. KOVA no guarda audio. No hay transcripción propia de archivos MP3 ni se garantiza voz offline o en todos los webviews.
- El parser de voz es local y determinista, no un LLM. Convierte números españoles habituales, detecta secciones y sus minutos, reconoce Tabata e intervalos sencillos con rondas/trabajo/descanso. Conserva instrucciones y cantidades en texto; no estructura cada repetición, porcentaje o carga ni comprende todas las frases. Los tiempos ausentes se proponen y se señalan. Dictados de varios días detectados se remiten al importador. Siempre hay revisión editable y botón final de guardar.
- Guardar un dictado crea un programa de una sesión en la biblioteca y lo abre sin sustituir el programa activo. El histórico se conserva. Para varios días se utiliza el importador existente. El registro hablado abre un borrador con texto original; minutos y esfuerzo ausentes quedan vacíos y deben completarse antes de guardar. No hay guardado autónomo de prescripciones médicas ni promoción de rutas.
- `app/lib/movements.ts` contiene 23 fichas de técnica general. `MovementSchool.tsx` tiene búsqueda por alias, categorías, pasos, errores, escalado y enlaces a CrossFit/Concept2. Los vídeos se abren en la página oficial; no están descargados ni todos traducidos al español. Cada bloque ofrece fichas por coincidencia textual. El contenido arbitrario importado puede no tener ficha; existe un enlace al catálogo oficial. Volver al bloque conserva su índice y checklist.
- `app/components/DriveSync.tsx`, `app/lib/drive.ts`, `app/lib/config.ts` y `docs/GOOGLE_DRIVE.md`: integración OAuth directa con Google Identity Services, independiente del complemento Drive de ChatGPT. La herramienta de elegibilidad de conectores de Sites no estaba disponible; no se añadieron declaraciones ni se reutilizaron tokens del complemento. No hay clave, secreto ni token en el repositorio. La configuración de Google sigue pendiente.

### Drive: contrato exacto

Usa `drive.appdata`, carpeta interna de datos de KOVA en Google Drive. No aparece en Mi unidad. Los tokens OAuth se conservan exclusivamente en memoria, con caducidad; cerrar/recargar exige reconectar. El Client ID es público y puede configurarse una vez en `app/lib/config.ts` y redesplegarse, o introducirse en cada navegador. El usuario elige Google y marca consentimiento. Conectar no lee ni sube el histórico. Solo Sincronizar ahora hace lectura, fusión y escritura.

Se guarda el `Store` completo de la cuenta (todos sus perfiles y programas importados), nunca audio, tokens, claves de Gemini ni el timer local. El espacio se identifica por SHA-256 de una etiqueta fija y el ID de cuenta KOVA. Para recuperar desde otro dispositivo hacen falta las mismas cuentas KOVA/Google y el mismo proyecto OAuth. El namespace no constituye autorización: Google controla el acceso y el token nunca se envía al backend de KOVA.

Cada sincronización lista con paginación las copias del namespace, las valida y fusiona con `mergeStores`, aplica la fusión local conservando cambios posteriores y crea una nueva copia inmutable. Se relee el archivo guardado y se comparan exactamente sus bytes. No se sobrescriben ni borran copias antiguas. Si dos dispositivos escriben a la vez, quedan dos ramas que la siguiente sincronización integra. No se promete que un dispositivo reciba una escritura simultánea hasta que vuelva a sincronizar. Siguen aplicando las limitaciones de `updatedAt` y relojes descritas en la sección 9.

Límites: 1,8 MB por snapshot, 2000 snapshots y 24 MB descargados por sincronización; se detiene sin escribir ante exceso o archivo inválido. Hace falta consolidación/retención antes de gran volumen comercial; no se elimina historia automáticamente. Timeout de 45 segundos por petición y lectura por stream con límite. No se reintenta una escritura automáticamente si el resultado es incierto. Google Drive no sustituye D1: D1 mantiene el guardado automático existente y Drive es manual. Desconectar en KOVA borra el token en memoria, conserva copias y no revoca Google; existe enlace para gestionar permisos.

### Verificación de esta revisión

- Suite ampliada de 19 pruebas: las 12 anteriores y siete adicionales para paginación/fusión/borrados de snapshots, validación de namespace/tamaño, escritura y readback, fallo sin reintento, números/tiempos de dictado, datos desconocidos y borradores de registro.
- El adaptador Drive se prueba con respuestas HTTP simuladas, nunca con datos reales del usuario. La prueba no verifica OAuth real, consentimiento de Google, CORS ni una escritura alojada. Falta Client ID y acceso autorizado para comprobarlos.
- Navegador de vista previa: texto de dictado → cuatro bloques → guardado de plan de una sesión → apertura → tutorial contextual de Wall ball. El programa activo se conserva. Los datos de prueba solo están en vista previa.
- También se revisó la interfaz a 390 px, temas claro/oscuro, búsqueda de Toes-to-bar, acceso al panel Drive sin configuración y registro hablado sin minutos/RPE: el formulario los mantiene vacíos. No se ha iniciado una sesión de Google ni una carga real.
- La transcripción de audio real, dispositivos físicos y bloqueos de ventanas del navegador siguen sin verificarse.

### Fuentes y evolución

Las fichas enlazan las páginas oficiales específicas del movimiento en CrossFit y las guías técnicas de RowErg/SkiErg en Concept2. La integración usa documentación oficial de Google: token model, appDataFolder y multipart upload.

El usuario ha preguntado por WOD externos. Investigación: CrossFit publica WOD públicos en https://www.crossfit.com/workout/; Kriger publica sesiones públicas en https://krigertraining.com/wod/ además de programas por suscripción; HYROX publica algunos entrenos semanales y ofrece programación para afiliados mediante Performance Hub. No se ha implementado importación automática ni se ha verificado una API pública de estas tres fuentes. Propuesta: bandeja con fuente/fecha/enlace, revisión de condiciones y parsers propios antes de añadir al calendario. No presentar un scraping como integración oficial ni redistribuir programación privada.

## 17 Edición iOS: nutrición, récords, informe y versión abierta en GitHub Pages

Revisión del 25 de octubre de 2026, hecha con Claude a petición del usuario.

### Qué cambia para el usuario

- **Estilo iOS** (`app/ios.css`, cargado después de `retro.css`): tipografía del sistema de Apple, barra superior y dock de cristal, controles segmentados, listas agrupadas, interruptores y hojas inferiores que se cierran deslizando. Se mantiene la paleta Afterglow (violetas, rosas y crema).
- **Dock inferior:** Inicio, Plan, **cronómetro central**, Nutrición y Progreso. El botón central es un cronómetro dibujado (`app/components/Stopwatch.tsx`) con aguja y arco animados; cuando el timer corre (`timerActive`), la aguja acelera y una onda late alrededor. «Más» pasa a la barra superior.
- **Tema:** en la barra superior es un botón de un toque (claro ↔ oscuro). En Más hay un control segmentado Claro / Oscuro / Automático. Se sustituyó el desplegable anterior, que en móvil era poco fiable y en oscuro mostraba fondos desplazados.
- **Nutrición** (`app/components/Nutrition.tsx`, `app/lib/nutrition.ts`): pestaña con Hoy (botella de agua animada, proteína, kcal y macros del día según si se entrena, 8 hábitos con interruptor), Mi plan (Mifflin-St Jeor, actividad y objetivo, macros para días de entreno y descanso, reparto en comidas), Peso (registro, media de 7 días y gráfica) y Guía (hidratación, proteína, carbohidratos, peri-entreno, suplementos con evidencia, sueño, menús y compra). Las cifras son orientativas y se indica que no sustituyen a un dietista-nutricionista.
- **Récords** (Progreso → Récords; `app/components/Records.tsx`, `app/lib/records.ts`): más de 150 movimientos y WODs (halterofilia, fuerza, gimnásticos, cardio, Girls, Héroes) con buscador sin tildes, filtros y opción de escribir uno a mano. Unidades: kg, reps, tiempo, rondas+reps, m, s y cal. Detalle con gráfica, historial y tabla de porcentajes para kg.
- **Informe** (Progreso → Informe; `app/components/Report.tsx`): documento vivo con gráficas seleccionables (marcas, sesiones, carga, esfuerzo, recuperación y peso), consejos de progresión por reglas transparentes (constancia, RPE, carga, marcas, nutrición y agua) más el coach existente, mejores marcas y resumen nutricional. «Descargar informe completo» genera un HTML autónomo con gráficas SVG y tablas, imprimible a PDF.

### Modelo de datos

`Store` mantiene `schema: 1` y añade dos colecciones **opcionales**, `records` y `nutrition`, con fusión por `id` y `updatedAt` y marcadores `_deleted` como el resto. Las copias antiguas sin esas claves siguen siendo válidas.

- `records`: `{id, profileId, date, name (≤80), unit ∈ kg|reps|tiempo|rondas|m|s|cal, value (texto ≤20), note?}`.
- `nutrition` según `kind`:
  - `plan`, con id `np-<perfil>`: peso, altura, edad, sexo `h|m`, actividad `sed|lig|mod|alt` y objetivo `perder|mantener|ganar`.
  - `day`, con id `nd-<perfil>-<fecha>`: agua en ml (0-20000), proteína en g (0-1000), `train` (`true|false|null`, donde `null` deduce si hay registro ese día) y `habits` (claves fijas booleanas).
  - `weight`, con id `nw-<perfil>-<fecha>`: kg (20-400) y cintura (`null` o 30-300).

La validación está en `validStore` (`validRecord`, `validNutrition`) y la usan tanto el servidor (`/api/state`) como la importación de copias.

### Versión abierta en GitHub Pages

Ver `docs/GITHUB_PAGES.md`. `pnpm run build:pages` construye solo el cliente en `dist-pages/` (desde la sección 18, con la interfaz de `web/`), que se publica en la rama `gh-pages`. El Site de ChatGPT sigue funcionando igual y no se ha cambiado su privacidad.

### Verificación de esta revisión

- `pnpm run typecheck`: sin errores.
- `pnpm test`: 24 pruebas superadas, 5 de ellas nuevas en `tests/records-nutrition.test.ts` (búsqueda, puntuación, mejor marca, objetivos nutricionales, validación y fusión).
- `pnpm run build` (Site) y `pnpm run build:pages`: correctos.
- Probado en Chromium móvil (390 × 844) sirviendo `dist-pages/` bajo `/KOVA/`:
  - el plan nutricional, el agua, la proteína y los hábitos;
  - el peso con su gráfica;
  - los récords del buscador y los escritos a mano, con su detalle y porcentajes;
  - el informe y su descarga;
  - el cambio de tema y el dock;
  - la persistencia de los datos al recargar.
- No probado: Safari real en iPhone, sincronización con Google Drive entre dos dispositivos, ni la publicación en el Site de ChatGPT.
- `pnpm run lint` sigue fallando por errores que ya existían en los archivos minificados (`TrainingApp.tsx`, `engine.ts`, `useStore.ts`…). Los archivos nuevos pasan el linter sin errores.

## 18 Rediseño profundo de la versión abierta (`web/`)

El usuario pidió una revisión a fondo porque la versión abierta seguía pareciéndose a la interfaz antigua, recargada. Desde esta revisión, GitHub Pages usa una interfaz nueva en `web/`. El Site de ChatGPT conserva `app/components/TrainingApp.tsx`.

Principios que pidió el usuario y que hay que mantener:

- Barras superior e inferior fijas, sin saltos entre pantallas.
- Pocas decisiones durante el entreno: la sesión se recorre en fichas, un bloque cada vez, con botón «Siguiente» y gesto lateral, en vez de una página larga.
- Cronómetro central grande con forma de cronómetro y escena synthwave animada; rondas tocando la pantalla.
- Estética iOS (cristal, controles nativos, tipografía del sistema) con la paleta violeta, rosa y crema.
- Sin cuentas: datos en el dispositivo, con copias y Google Drive opcionales.

Qué conserva del motor (`app/lib/engine.ts`):

- check-in y `readiness`;
- `adaptSession` (reducción de volumen y sustitución del motor);
- dosis de gimnasia según la última evaluación;
- rutas H y M manuales;
- coach por reglas;
- historial al cambiar de programa;
- límites de `validStore`.

Ninguna regla del motor se ha cambiado.

Verificado en Chromium móvil (390 × 844) bajo `/KOVA/`:

- el check-in y el ajuste de la sesión;
- las fichas y el gesto lateral;
- las demostraciones animadas;
- el cronómetro desde un bloque de motor, con la cuenta atrás, las rondas y el paso del resultado al registro;
- el registro y el paso a la siguiente sesión;
- el plan, la escuela de movimientos y los programas;
- el informe, las evaluaciones, los récords y el diario;
- nutrición;
- el perfil, el coach, el tema oscuro, las copias y la pantalla de Drive.

`pnpm run typecheck`, `pnpm test` (24), `pnpm run build` y `pnpm run build:pages` son correctos. Sin probar: Safari en iPhone real, el modo sin conexión en un dispositivo y Google Drive con un Client ID real.

`eslint web/src` marca avisos del compilador de React (lecturas de `localStorage` en efectos y refs del cronómetro). Son patrones deliberados para el rendimiento del reloj y no afectan al funcionamiento.
