# Saúl Guitars — prototipo de catálogo

Prototipo estático en español, hecho con HTML, CSS y JavaScript. Usa el logo, la foto de inicio y una muestra de modelos reales de `Stock.xlsx`.

## Vistas

- `index.html`: catálogo con búsqueda, filtros por categoría y marca, consultas por correo y contacto.
- `admin.html`: maqueta interactiva para agregar, editar y quitar productos. Los cambios se guardan únicamente en `localStorage` del navegador; no hay autenticación, servidor ni base de datos.

Para verlo localmente: `python3 -m http.server 8765` y abrir `http://localhost:8765/`.

## Datos pendientes para la versión definitiva

- Número comercial de WhatsApp. El botón actual abre la opción de compartir una consulta, sin destinatario fijo.
- Dirección exacta y mapa definitivo. El mapa actual muestra Buenos Aires como referencia.
- Precios, disponibilidad, descripciones y fotografías asociadas a cada modelo. La planilla de stock no contiene precios. Los modelos sin fotografía identificada muestran una ficha pendiente.
- Integración real del panel, mailing y catálogo con base de datos y acceso privado.

La carpeta `WEB/` contiene material fuente entregado por el cliente y queda fuera del repositorio publicado. `assets/` contiene únicamente imágenes optimizadas para el prototipo.
