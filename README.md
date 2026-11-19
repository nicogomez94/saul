# Saúl Guitars

Catálogo y panel de administración con React, Express, Prisma y PostgreSQL. El catálogo inicial replica los 28 registros de la [hoja de stock de Drive](https://docs.google.com/spreadsheets/d/1LZjA4sqf1LO6XCqxRWonPNy9jsF_HHgf4-Hlr3cGo1k/edit) al 19/11/2026. Marca, modelo, año, color y código SG se mantienen como aparecen en la hoja. Las categorías se asignaron por tipo de instrumento porque la columna de categoría está vacía.

## Funciones

- Catálogo público con búsqueda, filtros por categoría y marca, detalle de producto y galerías.
- Selección persistente en el navegador; consulta conjunta por WhatsApp con códigos y nombres de las piezas.
- Panel privado con inicio de sesión, altas, edición, archivo de productos, galerías, carga de fotos, estados de publicación y configuración del número de WhatsApp.
- Formulario de novedades con suscriptores guardados en PostgreSQL y visibles en el panel.
- Fotografías nuevas guardadas en PostgreSQL, sin depender del disco temporal del servidor.

El número de WhatsApp se puede cargar desde **Administración → Configuración**. Hasta entonces, el enlace abre WhatsApp con el mensaje preparado y permite elegir el destinatario. El sitio no cobra ni confirma ventas: precio y disponibilidad se consultan al comercio.

## Desarrollo local

Requiere Node.js 20.19+ y PostgreSQL. Crear una base `saul_guitars` y un archivo `server/.env` a partir de [`.env.example`](.env.example), con `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` o `ADMIN_PASSWORD_HASH`, y `SESSION_SECRET`. El archivo `server/.env` local ya contiene una contraseña aleatoria y no se publica.

```sh
npm ci
npm run prisma:generate -w server
npm run db:deploy
npm run build
npm start
```

- Catálogo: http://localhost:3001/
- Panel: http://localhost:3001/admin
- Prueba de integración con el servidor levantado: `npm test`

Para desarrollo con actualización automática: `npm run dev` (cliente en http://localhost:5173 y API en http://localhost:3001).

## Publicación

Esta rama requiere **un Web Service de Node y una base PostgreSQL**, con el mismo origen para frontend y API. No sirve como Static Site. Configuración sugerida para Render:

- Build command: `npm ci && npm run build && npm run db:deploy`
- Start command: `npm start`
- Variables: `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `NODE_ENV=production`; `WHATSAPP_NUMBER` es opcional porque también se administra desde el panel.
- `STOCK_SERIALS_JSON` permite importar los números de serie privados en la carga inicial. Se puede omitir y completarlos desde el panel.

`npm run db:deploy` aplica migraciones y agrega solo los códigos de stock que todavía no existan; no sobrescribe cambios realizados desde el panel. Antes de publicar, revisar [la conciliación del stock](data/conciliacion-stock.md), completar el número de WhatsApp y confirmar la disponibilidad de las piezas.

Las fotos optimizadas están en `client/public/assets/products/`. El material fuente original permanece en `WEB/`, fuera del repositorio. [`scripts/build-catalog.mjs`](scripts/build-catalog.mjs) reconstruye la muestra a partir de la captura de Drive y de las fotos locales cuando `WEB/` está disponible.
