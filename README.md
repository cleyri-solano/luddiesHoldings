# Luddies Holdings

Proyecto frontend de Luddies, un marketplace educativo STEM con enfoque en recursos pedagogicos digitales y experiencias para aula.

Este README explica el panorama general del repositorio.  
El detalle tecnico y operativo del frontend esta en `client/README.md`.

## Vision del proyecto

Luddies busca conectar creadores de material educativo con docentes, familias e instituciones, a traves de un catalogo curado de contenido STEM.

En esta etapa, el repositorio contiene una implementacion **frontend demo** para validar:

- navegacion de la experiencia principal,
- autenticacion por roles,
- administracion de productos,
- internacionalizacion ES/EN,
- y flujo de compra simulado.

## Estado actual

- Implementacion activa dentro de `client/`.
- Aplicacion multipagina (HTML, CSS, Bootstrap, JavaScript).
- Persistencia local del navegador (`localStorage` / `sessionStorage`).
- Sin backend productivo integrado por ahora.
- Base preparada para migrar a Spring Boot en una fase posterior.

## Estructura del repositorio

```text
luddiesHoldings/
  README.md
  README copy.md
  client/
    README.md
    tasks.txt
    index.html
    html/
    js/
    style/
    images/
```

## Que documenta cada archivo

- `README.md` (este archivo): contexto general y organizacion del repo.
- `client/README.md`: ejecucion, arquitectura cliente, credenciales demo, modulos y flujos.
- `client/tasks.txt`: requerimientos originales de las tareas implementadas.

## Dominios funcionales cubiertos

- **Autenticacion:** registro, inicio/cierre de sesion, control de acceso por ruta.
- **Catalogo:** render dinamico y filtros por categorias.
- **Admin:** CRUD de productos y gestion basica de usuarios.
- **Internacionalizacion:** interfaz ES/EN sin recarga completa.
- **Checkout/Pago:** flujo visual y de continuidad de experiencia.

## Alcance tecnico (alto nivel)

- UI responsive basada en Bootstrap.
- JavaScript modular con IIFE para encapsular comportamiento por feature.
- Datos demo iniciales (usuarios y catalogo) sembrados en cliente.
- Estado de sesion y datos operativos almacenados localmente.

## Convenciones de desarrollo

- Mantener nuevas piezas JS en patron IIFE para consistencia con el codigo actual.
- Evitar hardcode de llaves de storage fuera de `client/js/luddies-storage-keys.js`.
- Agregar estilos nuevos por pagina en `client/style/pages/` cuando aplique.
- Mantener copy de UI bilingue en `client/js/i18n.js`.

## Roadmap sugerido

1. Integrar APIs de autenticacion, usuarios y catalogo (Spring Boot).
2. Sustituir passwords en texto plano por flujo seguro backend.
3. Persistir entidades en base de datos.
4. Definir contrato de API (OpenAPI/Swagger).
5. Incorporar pruebas automatizadas de regresion UI.

## Inicio rapido

Para correr el proyecto localmente, revisa `client/README.md` en la seccion de ejecucion.