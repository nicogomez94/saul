# Conciliación de stock — 19/11/2026

Fuente principal: [hoja “Stock” de Drive](https://docs.google.com/spreadsheets/d/1LZjA4sqf1LO6XCqxRWonPNy9jsF_HHgf4-Hlr3cGo1k/edit). El catálogo inicial tiene los mismos 28 códigos SG-001 a SG-028 y conserva, sin corregirlos, la marca, modelo, año y color tal como figuran en la hoja (quitando espacios sobrantes). Los números de serie se guardan solo en el panel y no se envían a la API pública.

## Diferencias para confirmar con el cliente

| Código | Hoja de stock | Documento o carpeta de Drive |
| --- | --- | --- |
| SG-001 | Color “Sparkle Gold” | Reseña: “Aged Chartreuse Sparkle” |
| SG-003 | Color “Blonde” | Carpeta y reseña: “Butterscotch” |
| SG-004 | Año 2019 | Reseña: año 2016; la carpeta dice 2019 |
| SG-008 | Año 1976 | Reseña: año 1974; la carpeta dice 1976 |
| SG-011 | Año vacío | Reseña Taylor: 2010 |
| SG-012 | Año vacío | Reseña Gibson SJ-200: 2011 |
| SG-017 | Año y color vacíos | Carpeta/reseña Lucille: 2012, Ebony |
| SG-018 | Año y color vacíos | Carpeta/reseña ES-125: 1962, Sunburst |
| SG-021 | “Amp deluxe (transistor)” | Carpeta/reseña: “Fender Deluxe 90” |
| SG-022 | Año vacío | Carpeta/reseña Vibrolux Blackface: 1966 |

## Material pendiente

- SG-007 y SG-010 tienen carpetas vacías; SG-023, SG-027 y SG-028 no tienen carpeta identificada. Estos cinco productos aparecen con fotografía pendiente.
- SG-015 tiene fotos pero no documento de descripción. Los otros cinco productos sin fotos tampoco tienen descripción.
- Las carpetas “Fender The Edge” y “Orange OR15” tienen fotos y reseñas, pero no aparecen en la hoja de stock. No se publicaron.
- La columna “CATEGORIA” está vacía en la hoja. Las categorías actuales se asignaron según el tipo de instrumento y las carpetas de Drive.
- La hoja no tiene una columna de disponibilidad; inicialmente los 28 artículos están publicados. Confirmar cuáles siguen disponibles antes de la publicación final.
- Falta el número comercial de WhatsApp. El panel permite cargarlo sin modificar código.

Los valores financieros de la hoja y los números de serie se importaron en la base local y se muestran únicamente en el panel. No se incluyen en el repositorio ni en la API pública. Para llevarlos a producción habrá que suministrar `STOCK_SERIALS_JSON` y `STOCK_FINANCIALS_JSON` como variables privadas o cargarlos desde el panel.
