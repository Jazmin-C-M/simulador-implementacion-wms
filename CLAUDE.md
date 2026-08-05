# CLAUDE.md — Sesión 5: Simulador de implementación WMS

## Qué es
Proyecto del curso de IA: un simulador del programa de implementación de un WMS en 15 sitios (7 México, 8 Colombia), que responde si el programa completo es viable en 8 meses y a qué costo, moviendo la asignación de recursos (roles) entre sitios y fases. Se alimenta de un Excel de origen (`WMS Scenarios.xlsx`, 6 pestañas) que **no debe modificarse**. Detalle completo del alcance, entregables y rúbrica en [docs/spec.md](docs/spec.md); contexto de cómo trabajar con el usuario en [sobre-mi.md](sobre-mi.md).

## Estructura de la carpeta
- `docs/spec.md` — objetivo, alcance, entregables y rúbrica de calificación.
- `datos/` — aquí va `WMS Scenarios.xlsx` (pendiente de recibir) y cualquier dato exportado (CSV) derivado de él.
- `outputs/` — resultados generados: escenarios guardados, resúmenes de costos, exportes.
- `templates/` — plantillas reutilizables (si aplica).
- `sobre-mi.md` — quién es el usuario y cómo prefiere trabajar en este proyecto.

## Cómo trabajar aquí
- El Excel de origen es la única fuente de verdad para los números — nunca modificarlo, nunca inventar datos que no estén ahí.
- Antes de modelar cualquier pestaña del Excel, sanear (vacíos, tipos, outliers, unidades mezcladas, duplicados) y listar anomalías antes de usarlas — no corregir en silencio.
- Verificar totales de control si el archivo los trae, y recalcular columnas ya calculadas en vez de asumir que están bien (ver reglas globales del usuario).
- Tanto el escenario `Actual` como `Escenario 1` deben poder cargarse y calcularse en el simulador — son el mínimo de validación antes de explorar escenarios propios.
- El usuario necesita entender cada pestaña del Excel y su rol en el modelo — parte de la calificación depende de que lo pueda explicar, así que explicar el "por qué" de cada estructura de datos es tan importante como el código.
- Nada de UI decorativa: cada botón, tabla o "guardar escenario" debe funcionar de verdad.

## Qué evitar
- No modificar ni "limpiar" los valores del archivo de origen sin avisar — solo señalar anomalías y proponer, nunca aplicar en silencio.
- No dar por hecho el enfoque técnico (lenguaje, librería) todavía: se decide una vez que el Excel real esté disponible y se revisen sus pestañas.
- No mezclar unidades (MXN vs USD, semanas vs meses, piezas vs cajas) sin conversión explícita — el archivo mezcla monedas (Financials en USD, Resource Master en MXN).

## Stack y versiones
Pendiente — se define una vez que se reciba `WMS Scenarios.xlsx` y se confirme con qué herramienta se construirá el simulador (el usuario no tiene Python instalado; probable candidato: HTML/JS local o Excel, a confirmar).
