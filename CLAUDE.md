# CLAUDE.md — Sesión 5: Simulador de implementación WMS

## Qué es
Proyecto del curso de IA: un simulador del programa de implementación de un WMS en 15 sitios (7 México, 8 Colombia), que responde si el programa completo es viable en 8 meses y a qué costo, moviendo la asignación de recursos (roles) entre sitios y fases. Se alimenta de un Excel de origen (`WMS Scenarios.xlsx`, 6 pestañas) que **no debe modificarse**. Detalle completo del alcance, entregables y rúbrica en [docs/spec.md](docs/spec.md); contexto de cómo trabajar con el usuario en [sobre-mi.md](sobre-mi.md).

## Estructura de la carpeta
- `index.html` — página principal del simulador (dashboard con pestañas).
- `css/styles.css` — estilos.
- `js/data.js` — datos del Excel embebidos como JS (generado, no editar a mano — ver `datos/exports/build-data.ps1`).
- `js/model.js` — agrupa/deriva el `RAW_DATA` en estructuras listas para simular (no modifica valores de origen).
- `js/engine.js` — motor de simulación (cronograma semana a semana, contención de recursos) y cálculo de costos. Los supuestos de modelado están documentados como comentario al inicio del archivo.
- `js/app.js` — conecta el modelo/motor con el HTML (todo lo interactivo: editar recursos, guardar escenarios, tabs).
- `docs/spec.md` — objetivo, alcance, entregables, rúbrica y decisiones tomadas durante la revisión de datos.
- `docs/entendimiento-datos.md` — explicación pestaña por pestaña del Excel de origen (para el criterio de rúbrica de "entendimiento").
- `datos/WMS Scenarios - Anonymized.xlsx` — archivo de origen, **nunca se modifica**.
- `datos/exports/` — copias derivadas de solo lectura (CSV) y `build-data.ps1` (script que regenera `js/data.js` si el Excel cambia) + `serve.ps1` (servidor local para probar en el navegador integrado).
- `outputs/` — sin uso por ahora (los escenarios se guardan en `localStorage` del navegador, no en archivos).
- `templates/` — sin uso por ahora.
- `sobre-mi.md` — quién es el usuario y cómo prefiere trabajar en este proyecto.

## Cómo trabajar aquí
- El Excel de origen es la única fuente de verdad para los números — nunca modificarlo, nunca inventar datos que no estén ahí. Si el Excel cambia, correr `datos/exports/build-data.ps1` de nuevo para regenerar `js/data.js`.
- Tanto el escenario `Actual` como `Escenario 1` deben poder cargarse y calcularse (botones en la pestaña "Plan General") — ya están verificados: `Actual` revela que ningún sitio puede completar el programa (Hypercare necesita 3 Trainers y solo hay 1); `Escenario 1` sí termina los 15 sitios pero en ~160-190 semanas según el orden/frentes elegidos, muy por encima de 8 meses — el reto real (encontrar el escenario ganador) queda para que el usuario lo explore en la pestaña "Uso de Recursos".
- El usuario necesita entender cada pestaña del Excel y su rol en el modelo — ver `docs/entendimiento-datos.md` y la pestaña "Entendimiento del Excel" dentro de la app.
- Nada de UI decorativa: cada botón, tabla o "guardar escenario" funciona de verdad (probado en el navegador, no solo visualmente).
- Para probar cambios: levantar `datos/exports/serve.ps1` (HttpListener local) y navegar a `http://localhost:8899/` en el navegador integrado de Claude Code — abrir `index.html` directo con `file://` también funciona (los datos están embebidos en `js/data.js`, no se cargan por fetch), pero el servidor local es más consistente para depurar.

## Qué evitar
- No modificar ni "limpiar" los valores del archivo de origen sin avisar — solo señalar anomalías y proponer, nunca aplicar en silencio.
- No mezclar unidades (MXN vs USD, semanas vs meses, piezas vs cajas) sin conversión explícita — aunque la pestaña se llame "Financials (USD)", todos los valores monetarios del archivo se tratan como MXN (aclaración del profesor en clase, ver `docs/spec.md`).
- No resolver el reto de optimización (qué escenario logra 8 meses al menor costo) en lugar del usuario — esa es la tarea calificada del curso; el trabajo de Claude es que el simulador calcule bien y muestre el porqué de cada resultado, no encontrar la respuesta ganadora.

## Stack y versiones
Aplicación web estática: **HTML + CSS + JavaScript puro, sin frameworks ni paso de compilación** (el usuario no tiene Python ni Node/npm instalado, solo Git). Los datos se generan una vez desde el Excel vía PowerShell + Excel COM (`datos/exports/build-data.ps1`) y quedan embebidos en `js/data.js` — la app no necesita servidor para funcionar (abre directo con `file://` o por GitHub Pages), aunque para desarrollo se prueba con un servidor local (`datos/exports/serve.ps1`). "Guardar escenario" usa `localStorage` del navegador.
