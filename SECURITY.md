# Seguridad – DR.FRIO MTY

Resumen del escaneo de seguridad y qué se ha aplicado o falta por hacer.

---

## ✅ Aplicado en el proyecto

### 1. Enlaces externos (`target="_blank"`)
- Todos los enlaces que abren en nueva pestaña tienen **`rel="noopener noreferrer"`** para evitar que la página abierta pueda usar `window.opener` (tab-nabbing).
- Afecta a: WhatsApp (contacto y flotante), Facebook, y el enlace “Abrir en Google Maps” generado en JS.

### 2. Smooth scroll
- El scroll suave solo actúa sobre anclas con formato **`#id`** (letras, números, `-`, `_`). Se usa `getElementById` en lugar de `querySelector` con el valor del `href` para evitar posibles inyecciones de selector.

### 3. Uso de `innerHTML`
- El único `innerHTML` se usa con datos controlados: **lat/lng** (números) y URLs construidas con **`encodeURIComponent`**. La respuesta de Nominatim (`display_name`) solo se escribe en `input.value`, no en HTML, por lo que no hay riesgo de XSS desde esa API.

### 4. Formulario
- No hay backend propio: los datos se envían a WhatsApp. No hay exposición de datos en tu servidor ni riesgo de CSRF contra tu dominio por este formulario.
- Validación básica en el cliente (nombre, email, teléfono, servicio).

### 5. API key de Google Maps
- La variable `GOOGLE_MAPS_API_KEY` está vacía en el código. Si en el futuro añades una clave:
  - Restríngela en **Google Cloud Console** por **HTTP referrer** (origen) a tu dominio, por ejemplo: `https://drfriomty.online/*`.
  - Así la clave solo sirve en tu sitio y no en otros.

### 6. Cabeceras de seguridad (`_headers`)
- Archivo **`_headers`** en la raíz con cabeceras recomendadas para despliegues tipo Netlify/Vercel/Cloudflare Pages:
  - **X-Frame-Options: DENY** – reduce riesgo de que tu página se embele en iframes (clickjacking).
  - **X-Content-Type-Options: nosniff** – evita que el navegador “adivine” el tipo MIME.
  - **Referrer-Policy** – limita qué se envía en el encabezado Referer.
  - **Permissions-Policy** – solo geolocation para tu origen; cámara/micrófono desactivados.
  - **X-XSS-Protection** – capa extra en navegadores que lo soporten.

---

## ⚠️ Qué debes hacer en el servidor / hosting

### 1. HTTPS
- Sirve el sitio **solo por HTTPS**. Tu canonical y og:url ya usan `https://drfriomty.online/`. En el panel de tu proveedor (Netlify, etc.) activa “Force HTTPS” o el equivalente.

### 2. Activar las cabeceras
- **Netlify**: el archivo `_headers` en la raíz se aplica automáticamente.
- **Vercel**: configura las mismas cabeceras en `vercel.json` (sección `headers`).
- **Apache**: puedes usar algo así en `.htaccess`:
  ```apache
  <IfModule mod_headers.c>
    Header set X-Frame-Options "DENY"
    Header set X-Content-Type-Options "nosniff"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
    Header set X-XSS-Protection "1; mode=block"
  </IfModule>
  ```
- **IIS / otro**: configura las mismas cabeceras en el panel o en `web.config`.

### 3. Content-Security-Policy (CSP) – opcional
- Añadir CSP reduce XSS e inyección de recursos, pero puede romper cosas si no se ajusta bien. Si quieres probar una política estricta, hazlo en el servidor (cabecera HTTP), no en meta tag, para poder reportar violaciones.
- Ejemplo muy básico (ajusta según tus dominios):
  ```http
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; frame-src https://www.openstreetmap.org https://www.google.com; connect-src 'self' https://nominatim.openstreetmap.org;
  ```
- Si usas Google Maps (script externo), tendrás que añadir `https://maps.googleapis.com` en `script-src` y `frame-src`.

---

## Resumen rápido

| Tema                         | Estado |
|-----------------------------|--------|
| `rel="noopener noreferrer"` | ✅ Aplicado |
| Smooth scroll seguro        | ✅ Aplicado |
| innerHTML / XSS             | ✅ Revisado, uso seguro |
| Cabeceras de seguridad      | ✅ Archivo `_headers` creado |
| HTTPS                      | ⚠️ Debes forzarlo en el hosting |
| Activar `_headers`         | ⚠️ Depende de tu proveedor |
| Restricción API key Google  | ⚠️ Cuando uses clave, restringir por referrer |
| CSP                        | Opcional; configurar en servidor si lo usas |

Si añades backend (formulario que envíe a tu servidor, cookies de sesión, etc.), habría que revisar de nuevo: HTTPS, cookies seguras, CSRF y almacenamiento de datos personales según tu aviso de privacidad.
