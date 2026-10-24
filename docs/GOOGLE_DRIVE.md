# Google Drive en KOVA

La integración está implementada, pero necesita un **Client ID OAuth de Google** para activarse. La conexión de Drive que se utiliza dentro de ChatGPT no se transfiere a un sitio externo.

El acceso con ChatGPT sigue identificando tu cuenta KOVA. El acceso con Google autoriza solo el espacio interno de KOVA en Drive. Son dos conexiones distintas.

## Configuración inicial del propietario

1. Abre [Google Cloud Console](https://console.cloud.google.com/) y crea o selecciona un proyecto para KOVA.
2. Activa **Google Drive API** en la biblioteca de APIs del proyecto.
3. Configura **Google Auth Platform**: nombre de la app, correo de soporte, audiencia y datos de contacto. Mientras esté en pruebas, añade las cuentas de Google que vayan a usarla como usuarios de prueba.
4. En acceso a datos, configura el permiso `https://www.googleapis.com/auth/drive.appdata`.
5. Crea un cliente OAuth de tipo **Aplicación web**.
6. Añade este origen JavaScript autorizado, exactamente, sin ruta ni barra final:

   ```text
   https://kova-training-lab.daniotero.chatgpt.site
   ```

7. Copia el **Client ID**, terminado en `.apps.googleusercontent.com`. No necesitas introducir un client secret en KOVA. Nunca lo publiques.
8. Para la configuración de todos los atletas, coloca únicamente el Client ID público en `app/lib/config.ts`, constante `GOOGLE_DRIVE_CLIENT_ID`, y vuelve a compilar y desplegar. Como alternativa para probar, introdúcelo en **Más → Guardar en Drive → Preparar Google Drive** en cada navegador.

El modo de token de Google utiliza una ventana de autorización iniciada por el usuario, no un callback OAuth propio de KOVA. Si Google solicita datos de marca, dominio o verificación para publicar la app OAuth, complétalos desde la cuenta propietaria; la app no puede realizarlos ni aprobar términos en tu nombre. No añadas comodines ni otros dominios para resolver un error de origen.

## Uso cotidiano

1. Entra en KOVA con la misma cuenta en todos tus dispositivos.
2. Abre **Más → Guardar en Drive**.
3. Acepta que se sincronicen los datos de entrenamiento de esta cuenta.
4. Pulsa **Conectar Google Drive** y elige tu cuenta Google.
5. Pulsa **Sincronizar ahora**. Se integran las copias existentes y se guarda una nueva copia verificada.
6. En otro dispositivo, usa el mismo proyecto OAuth y la misma cuenta Google; pulsa de nuevo Sincronizar ahora para recuperar e integrar los datos.

Conectar no sube el histórico por sí solo. El guardado automático habitual de KOVA sigue funcionando; la copia de Drive se realiza al pulsar. Cerrar o recargar la app pierde el token en memoria y puede requerir conectar otra vez. No se guardan refresh tokens.

## Qué se guarda

- Perfiles de la cuenta, programas importados, diario, check-ins y marcas.
- Las versiones de borrados se conservan para que no reaparezcan registros eliminados.
- No se guardan audio, contraseñas, tokens, claves de Gemini ni el cronómetro en marcha.
- Las copias están en `appDataFolder`, el espacio interno de KOVA: **no aparecen como archivos normales en Mi unidad**. Puedes seguir exportando JSON desde Perfil y copias.

No cambies de proyecto OAuth esperando acceder automáticamente al espacio del proyecto anterior. Exporta antes una copia si migras de proyecto o proveedor de identidad.

## Seguridad, conflictos y límites

El navegador llama directamente a Google con el permiso `drive.appdata`; no solicita leer todos los documentos de tu Drive. Cada guardado crea un archivo nuevo: no elimina ni sobrescribe copias anteriores. Si dos dispositivos sincronizan a la vez, una sincronización posterior integra ambas copias. La resolución por `updatedAt` conserva las limitaciones documentadas en `AI_HANDOFF.md`: un reloj incorrecto puede resolver mal cambios sobre el mismo registro.

La sincronización se detiene ante una copia inválida, un snapshot de más de 1,8 MB, más de 2000 snapshots o más de 24 MB acumulados de descarga. No descarta silenciosamente versiones para continuar. La consolidación y retención de archivos debe desarrollarse antes de un uso intensivo. No se reenvían automáticamente escrituras cuyo resultado es incierto.

Desconectar en KOVA descarta la autorización de esa sesión en memoria, pero conserva los archivos y el permiso concedido a Google. Puedes revocar el permiso desde [las conexiones de tu cuenta Google](https://myaccount.google.com/connections).

## Qué se ha probado

Las pruebas automatizadas simulan Google para comprobar fusión, paginación, aislamiento de namespace, tamaño y verificación de la copia. **Faltan configurar el Client ID y probar el inicio de sesión y la sincronización real desde la app publicada.** No se han subido registros personales durante el desarrollo.

## Documentación oficial

- [Crear un cliente OAuth web](https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid).
- [Modelo de tokens de Google Identity Services](https://developers.google.com/identity/oauth2/web/guides/use-token-model).
- [Datos específicos de una aplicación en Drive](https://developers.google.com/workspace/drive/api/guides/appdata).
- [Subir archivos a Drive](https://developers.google.com/workspace/drive/api/guides/manage-uploads).
