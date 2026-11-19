# Saúl Guitars — prototipo de catálogo

Prototipo estático en español, hecho con HTML, CSS y JavaScript. Usa el logo, la foto de inicio y una muestra de modelos reales de `Stock.xlsx`. Las fotos y reseñas de la muestra se asociaron con las carpetas por modelo del [Drive del cliente](https://drive.google.com/drive/folders/1GYVMxwF7Y1J-VprinE9v1M13ThN2Afkd).

## Vistas

- `index.html`: catálogo con búsqueda, filtros por categoría y marca, fichas de detalle con descripción y características, consultas por correo y contacto.
- `admin.html`: maqueta interactiva para agregar, editar y quitar productos, sus descripciones y características. Los cambios se guardan únicamente en `localStorage` del navegador; no hay autenticación, servidor ni base de datos.

Para verlo localmente: `python3 -m http.server 8765` y abrir `http://localhost:8765/`.

## Datos pendientes para la versión definitiva

- Número comercial de WhatsApp. El botón actual abre la opción de compartir una consulta, sin destinatario fijo.
- Dirección exacta y mapa definitivo. El mapa actual muestra Buenos Aires como referencia.
- Precios y disponibilidad. La planilla de stock no contiene precios y la muestra no incluye todo el inventario.
- Confirmar discrepancias entre fuentes antes de cargar el catálogo definitivo: el stock indica 1976 para SG-008 y el documento de Drive dice 1974; SG-003 figura Blonde en stock y Butterscotch en Drive; SG-011 no tiene año en stock y el documento indica 2010. La carpeta de fotos de SG-010 estaba vacía al revisar Drive.
- Integración real del panel, mailing y catálogo con base de datos y acceso privado.

La carpeta `WEB/` contiene material fuente entregado por el cliente y queda fuera del repositorio publicado. `assets/` contiene únicamente imágenes optimizadas para el prototipo.
