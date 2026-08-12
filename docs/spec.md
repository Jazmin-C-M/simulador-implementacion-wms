# Spec — Simulador de implementación WMS (Sesión 5)

## Objetivo

Construir con Claude Code un **simulador del programa de implementación de un WMS** (Warehouse Management System) en toda la red de almacenes (15 sitios: 7 en México, 8 en Colombia), que responda dos preguntas con números, no con optimismo:

1. **¿Es posible completar el programa completo en 8 meses?**
2. **¿A qué costo?**

El simulador debe permitir mover "palancas" — cuánta gente hay de cada rol, en qué orden entran los sitios, cuántos frentes corren en paralelo — y mostrar de inmediato en qué fecha termina el programa y cuánto cuesta, dado que los recursos son **fijos** (una persona por rol) y cada fase de cada sitio consume una parte de la capacidad de esos roles. Si dos sitios avanzan al mismo tiempo, compiten por la misma gente.

**Meta del ejercicio:** encontrar el escenario que logre los 8 meses al menor costo (eso se compara en clase entre todos los alumnos).

## Reglas que no se negocian

1. **No modificar la data del archivo de origen** (`WMS Scenarios.xlsx`). Los números son los que son; el simulador se alimenta de ellos tal cual.
2. **Los escenarios del archivo deben poder correr en el simulador.** Tanto `Actual` como `Escenario 1` tienen que poder cargarse y calcularse.

## El archivo de origen (`WMS Scenarios.xlsx`, 6 pestañas)

| Pestaña | Contenido |
|---|---|
| **Entregables** | El objetivo, los 5 entregables y la rúbrica de calificación. |
| **Sites Master** | 15 sitios, cada uno con su cluster (1 a 4), capacidad y producción, volumen de distribución, número y área de almacenes, ocupación, y condición de arranque (identificación de pasillos y cajas, control tower, montacargas, estado del WiFi, tablets y equipos de conteo). |
| **Financials (USD)** | Por sitio: beneficio mensual que deja el WMS una vez vivo, y los costos de implementación — dispositivos, estructura de montacargas, señalización, etiquetas e impresoras, etiquetado manual, y tres opciones de WiFi (full, optimizado, priorizado). |
| **Resource Master** | 18 roles (arquitecto de solución, líderes funcional/infraestructura/SAP/Azure, entrenadores, soporte, etc.). De cada uno: si es interno o externo, si su costo es fijo o flexible, si puede multitarea, su costo mensual en MXN, y cuántas personas hay hoy (`Actual`) contra las que propone el `Escenario 1`. |
| **Implementation Phases** | Las 8 fases por las que pasa cada sitio, en orden: Site Readiness → Design Adaptation → Functional Review → UAT → Training → DIALT → Go Live → Hypercare. La duración en semanas cambia según el cluster y el nivel de madurez (A o B): entre 10 y 19 semanas por sitio. |
| **Phase-Resource Allocation** | Qué roles consume cada fase de cada cluster y en qué proporción (Capacity Consumption). Aquí es donde se ve por qué dos sitios en paralelo se estorban. |

## Los 5 entregables

1. Tablero con el **plan de trabajo general** del programa, de inicio a fin.
2. Tablero con el **plan de trabajo por sitio**.
3. Tabla de **uso de recursos** por sitio y general para el programa — debe poder **modificarse**.
4. Poder **guardar el escenario**.
5. **Resumen de costos**: del programa por escenario, por sitio y por tipo de recurso.

## Cómo se califica

Dos mitades, mismo peso, 16 pts cada una (32 pts total):

- **Mitad 1 — El resultado (16 pts, todo o nada):** que el simulador demuestre, con el cálculo hecho, al menos un escenario que termine el programa completo en 8 meses o menos.
- **Mitad 2 — La rúbrica (16 pts):**
  - Dashboard principal — entregables 1, 2 y 5 visibles y funcionando (4 pts)
  - Guardar y comparar escenarios — entregables 3 y 4 (4 pts)
  - Explicación y entendimiento de cada pestaña del Excel (4 pts)
  - Calidad de la información — correcta, bien etiquetada, sin basura ni errores (2 pts)
  - Visual / UI — limpio, con jerarquía y legible (2 pts)

Fórmula de calificación final: `0.5 × (lograste los 8 meses) + 0.5 × (puntos de rúbrica ÷ 16)`.

## Entrega

Subir el proyecto a un repositorio **público** de GitHub y pegar la liga en la plataforma del curso para que se califique automáticamente contra la rúbrica.

**Fecha límite: martes 11 de agosto de 2026.**

## Decisiones tomadas durante la revisión de datos

- **Moneda — actualizado 2026-08-10.** El profesor aclaró primero en clase que todo se tratara como MXN sin conversión; el 2026-08-10 corrigió ese criterio: **Financials sí estaba en USD originalmente y se convierte a MXN con tipo de cambio 18**; Resource Master ya venía en MXN de origen y no se convierte. El simulador aplica esta conversión solo a los montos de Financials (capex por sitio y beneficio mensual informativo) — ver `FX_USD_TO_MXN` en `js/model.js`.
- **Duplicado intencional Site 02 / Site 03 (Sites Master).** Ambos sitios tienen exactamente los mismos valores en todas las columnas de Sites Master. Es un duplicado real dentro del archivo (el profesor copió una fila para rellenar un sitio faltante durante la clase), pero se trata como si fueran dos sitios reales e independientes — no se corrige ni se marca como error en el simulador.
- **Columnas sin traducir por significado no confirmado**: `T2/MKP/KA` y `HC Forklifts` (Sites Master) se dejan con su nombre original en inglés — es un ejercicio externo al giro de negocio del usuario (RADEC es autopartes, el dataset es de una cervecera anonimizada) y no hay certeza de su significado exacto. Si alguna fase o fórmula del simulador llega a depender de ellas, se debe confirmar con el usuario antes de usarlas en un cálculo.
- **Celdas sueltas "Go Live" / "Post" (Resource Master, fila de Solution Architect)**: confirmado con el usuario que es basura de formato de Excel, sin significado. Se ignoran, no se usan en ningún cálculo.
- **Clúster 4 sin fila en Phase-Resource Allocation.** La pestaña trae el mismo bloque de reglas (rol × fase × consumo de capacidad) repetido idéntico para Clúster 1, 2 y 3, pero no tiene ninguna fila para Clúster 4 (afecta solo a Site 12, Colombia, el único sitio de ese clúster). **Decisión (confirmada por el usuario): el simulador asume que Clúster 4 usa la misma tabla de consumo de recursos que 1/2/3**, ya que esos tres son idénticos entre sí. Es un supuesto, no un dato del archivo — debe quedar etiquetado como tal en el simulador.
- **Nivel de Madurez (A/B) — se maneja como palanca, no como dato fijo.** Ninguna pestaña indica qué madurez (A o B) le corresponde a cada uno de los 15 sitios; la ficha del ejercicio tampoco la menciona como palanca. **Decisión (confirmada por el usuario): el simulador trata la madurez como una palanca ajustable por sitio, con "A" (la ruta más lenta/conservadora) como valor por defecto para los 15 sitios.** El usuario puede cambiar cualquier sitio a "B" al armar un escenario. Nota: en Clúster 3 y 4 da exactamente igual A o B (duraciones idénticas); solo cambia algo real en los sitios de Clúster 1 y 2 (12 de los 15 sitios).
- **Grabación de la clase (YouTube) — uso como respaldo, no como fuente primaria.** El usuario tiene el video de la clase donde se explicó el ejercicio. Se acordó no revisarlo de inicio (transcripciones automáticas de YouTube fallan seguido con siglas, nombres propios y números) — se usa solo si más adelante algo no cuadra y se necesita una segunda fuente para confirmar una decisión de modelado.

## Archivo de origen — nombre real
`datos/WMS Scenarios - Anonymized.xlsx` (no `WMS Scenarios.xlsx`). Copias de solo lectura de cada pestaña, exportadas a CSV sin modificar el original, en `datos/exports/`.

## Decisión técnica (confirmada con el usuario)

Aplicación web estática (HTML + CSS + JavaScript puro, sin frameworks, sin paso de compilación) — el usuario no tiene Python ni Node/npm, solo Git. Los datos del Excel se generan una sola vez a `js/data.js` (embebido, no requiere servidor) vía `datos/exports/build-data.ps1`. "Guardar escenario" usa `localStorage` del navegador. Ver `CLAUDE.md` para el detalle de archivos y cómo probar localmente.

## Estado del simulador

Construido y probado en el navegador (los 5 entregables funcionan: plan general, plan por sitio, tabla de recursos editable, guardar/comparar escenarios, resumen de costos). Verificado que `Actual` y `Escenario 1` cargan y calculan:
- **Actual** (casi todos los roles en 1 persona): **ningún sitio llega a terminar** — el simulador detectó que Hypercare necesita 3 "Trainers" trabajando a la vez y el archivo solo trae 1, así que es matemáticamente imposible con ese headcount, sin importar cuántas semanas pasen.
- **Escenario 1** (5 personas en los 18 roles): los 15 sitios sí terminan, pero en 98 semanas (~22.7 meses) — muy por encima de 8 meses. Confirma que "más gente en todo" no es la respuesta, hay que encontrar los roles específicos que son cuello de botella.

Pendiente: que el usuario explore sus propios escenarios (ajustando headcount por rol, orden de sitios, frentes en paralelo, madurez y opción de WiFi por sitio) para encontrar uno que cumpla los 8 meses al menor costo — ese es el reto calificado del curso, no algo que deba resolverse por él.
