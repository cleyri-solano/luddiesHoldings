# Luddies Client (Frontend)

Aplicacion frontend multipagina construida con HTML, CSS, Bootstrap y JavaScript vanilla.
Funciona como demo local con persistencia en navegador (`localStorage` / `sessionStorage`) y sin integracion backend productiva.

## Objetivo de este modulo

Implementar y validar de forma local los flujos clave del marketplace:

- registro e inicio de sesion,
- catalogo con filtros,
- carrito/checkout/pago (flujo UI),
- panel de administracion para productos y usuarios,
- internacionalizacion ES/EN.

## Stack

- HTML5
- CSS3
- Bootstrap 5
- JavaScript (IIFE modules)

## Como ejecutar en local

1. Ubicate en la carpeta `client`.
2. Levanta un servidor estatico:
   - VS Code Live Server, o
   - `python -m http.server 5500`
3. Abre `http://localhost:5500/index.html`.

> Recomendado: no abrir con doble click (`file://`) para evitar problemas con rutas relativas y parciales.

## Credenciales actuales (demo)

Sembradas automaticamente por `js/auth.js` cuando no existen usuarios:

- **Admin**
  - Email: `admin@luddies.com.mx`
  - Password: `123456`
  - Rol: `admin`
- **User demo**
  - Email: `user@luddies.com.mx`
  - Password: `123456`
  - Rol: `user`

> Estas credenciales son solo para entorno demo local.

## Flujo de autenticacion y autorizacion

- `html/register.html` + `js/register.js`
  - valida nombre, telefono, email y password,
  - crea usuario local con rol `user`.
- `html/login.html` + `js/login.js`
  - valida credenciales,
  - crea sesion en storage,
  - redirige a ruta de retorno o inicio.
- `js/auth-guard.js`
  - evita acceso a rutas privadas sin sesion,
  - limita `html/admin.html` a rol `admin`,
  - evita que usuarios autenticados vuelvan a login/register.
- `js/luddies-storage-keys.js`
  - centraliza llaves para evitar inconsistencias.

Llaves principales:

- `luddies.users`
- `luddies.session`
- `luddies.catalog_products`

## Arquitectura de archivos

```text
client/
  index.html
  README.md
  tasks.txt
  html/
    admin.html
    catalog.html
    checkout.html
    payment.html
    login.html
    register.html
    partials/
      header.html
      footer.html
  js/
    auth.js
    auth-guard.js
    login.js
    register.js
    i18n.js
    catalog-builder.js
    catalog-filter.js
    admin-panel.js
    layout.js
    ...
  style/
    tokens.css
    base.css
    components.css
    pages/
```

## Modulos principales

- `js/auth.js`
  - bootstrap de usuarios y catalogo seed,
  - login/logout/register,
  - CRUD base de productos y utilidades de sesion.
- `js/catalog-builder.js`
  - construye tarjetas del catalogo desde datos en storage,
  - sincroniza etiquetas dinamicas para i18n.
- `js/catalog-filter.js`
  - filtra por categorias canonicas,
  - inyecta filtros dinamicos para categorias nuevas detectadas.
- `js/admin-panel.js`
  - formulario admin para crear/editar/eliminar productos,
  - tabla de usuarios con eliminacion controlada por rol.
- `js/i18n.js`
  - traducciones ES/EN,
  - aplica textos y placeholders sin recarga total.
- `js/layout.js`
  - monta header/footer parciales compartidos entre paginas.

## Rutas importantes

- **Publicas:** `index.html`, `html/about-us.html`, `html/contact.html`, `html/terms.html`, `html/privacy.html`
- **Auth:** `html/login.html`, `html/register.html`
- **Privadas:** `html/catalog.html`, `html/checkout.html`, `html/payment.html`
- **Solo admin:** `html/admin.html`

## Estado funcional actual

- Registro e inicio de sesion locales operativos.
- Catalogo con datos seed + productos custom desde admin.
- Filtros por categoria funcionando para categorias canonicas y extra.
- Panel admin funcional para crear/editar/eliminar productos.
- Login/Register sin control extra de idioma dentro del card; se usa el toggle global del header.

## Puntos operativos importantes

- El admin seed no se elimina desde UI.
- La sesion activa define visibilidad y acceso de rutas.
- Cambios en productos/admin afectan de inmediato la vista catalogo al renderizar.
- Si cambias traducciones en `i18n.js`, valida ambos idiomas en paginas principales.

## Troubleshooting rapido

- **No carga header/footer**
  - Verifica que estes ejecutando con servidor local (no `file://`).
- **No funciona login esperado**
  - Revisa estado de `localStorage` y limpia si hay datos de pruebas viejos.
- **No aparece un producto recien creado**
  - Confirma que se guardo en `luddies.catalog_products` y recarga `catalog.html`.
- **Permisos admin no aplican**
  - Verifica `luddies.session` y que el rol sea `admin`.

## Notas de mantenimiento

- Mantener patron IIFE en nuevos modulos para consistencia.
- No hardcodear nuevas llaves de storage; agregar en `luddies-storage-keys.js`.
- Si agregas una pagina nueva, revisar inclusion de:
  - `i18n.js`
  - `auth-guard.js` (si requiere sesion)
  - estilos en `style/pages/`

## Siguiente paso recomendado

Mantener este README sincronizado con cada cambio funcional relevante (credenciales demo, flujos auth, nuevas rutas o cambios en storage), para que sirva como guia de onboarding del equipo.
