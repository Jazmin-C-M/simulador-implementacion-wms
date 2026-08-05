# Entendimiento del archivo de origen — `WMS Scenarios - Anonymized.xlsx`

Este documento explica qué contiene cada una de las 6 pestañas del archivo, cómo se conectan entre sí, y qué anomalías o huecos se encontraron durante la revisión (sin modificar el archivo original — ver `datos/exports/` para las copias de solo lectura en CSV usadas en el análisis).

Todos los valores monetarios del archivo se tratan como **pesos mexicanos (MXN)**, sin conversión de moneda (aclaración del profesor en clase, ver `spec.md`).

---

## 1. ENTREGABLES
La ficha del ejercicio: objetivo (8 meses, menor costo), los 5 entregables pedidos, y la rúbrica de calificación con su fórmula (`0.5 × resultado + 0.5 × rúbrica/16`). Es texto de instrucciones, no data operativa — no alimenta ningún cálculo del simulador.

## 2. Sites Master — los 15 sitios
Un renglón por sitio (7 México, 8 Colombia), con su **Clúster** (1 a 4 — determina qué duración y qué consumo de recursos le aplican en las otras pestañas) y su condición de arranque:

| Columna original | Traducción | Qué es |
|---|---|---|
| Country | País | México / Colombia |
| Brewery | Sitio (ID) | Código anonimizado del sitio (el nombre de columna quedó de la cervecera real, ya anonimizada) |
| Cluster | Clúster | 1 a 4 — llave para Implementation Phases y Phase-Resource Allocation |
| Capacity (Mio HL) | Capacidad | Millones de hectolitros de capacidad instalada |
| Production (Mio HL) | Producción | Millones de hectolitros producidos |
| Distribution Volume (K HL) | Volumen de Distribución | Miles de hectolitros distribuidos |
| Line Capacity | Capacidad de Línea | Producción ÷ Capacidad — **verificado, cuadra exacto en las 15 filas** |
| Production Lines | Líneas de Producción | Conteo |
| # Warehouses | Número de Almacenes | Conteo |
| Warehouse Area | Área de Almacén | m² |
| Occupation LV | Nivel de Ocupación | % — dos sitios por encima de 100% (Site 07 México, Site 13 Colombia) |
| Aisles Identification | Identificación de Pasillos | Score 0–1 (no es Sí/No) |
| Box Identification | Identificación de Cajas | Sí / No |
| Control Tower | Torre de Control | Sí / No |
| T2/MKP/KA | *(sin traducir)* | Significado no confirmado — externo al giro de negocio del usuario |
| Forklifts in Logistics | Montacargas en Logística | Conteo de unidades |
| HC Forklifts | *(sin traducir)* | Conteo, consistentemente 2–3× mayor — significado no confirmado |
| WIFI State | Estado del WiFi | Score 0–1 |
| Tablets | Tablets | Conteo |
| Counting Devices | Equipos de Conteo | Conteo |

**Anomalías encontradas:**
- **Site 02 y Site 03 (México) son idénticos** en todas las columnas excepto el nombre. Confirmado con el usuario: es un duplicado real que el profesor metió en clase para rellenar un sitio faltante — se trata como dos sitios reales, no se corrige.
- Precisión de decimales distinta entre países (México con cifras redondas, Colombia con muchos decimales) — no es error, solo una diferencia de origen de los datos.

## 3. Financials (USD) — beneficio y costo de implementación por sitio
Un renglón por sitio con el beneficio mensual que deja el WMS ya en operación, y el desglose del costo de implementarlo:

| Columna original | Traducción |
|---|---|
| Benefits per month | Beneficio mensual |
| Implementation Costs | Costo de Implementación (base fijo) |
| Devices | Dispositivos |
| Forklift Structure | Estructura de Montacargas |
| Warehouse Signage | Señalización de Almacén |
| Labels | Etiquetas |
| Costs without Labelers & WiFi | Subtotal — **verificado: = suma de las 5 columnas anteriores, cuadra exacto** |
| Label Printers / Labelers | Impresoras/Etiquetadoras |
| Manual Labeling | Etiquetado Manual |
| WiFi Full / WiFi Full Optimized / WiFi Prioritized | 3 opciones de costo de WiFi — se elige una por sitio |

**Anomalías / observaciones:**
- 4 columnas y 3 filas vacías al final del rango usado — sobrante de formato de Excel, se ignoran.
- Site 08 tiene $0 en casi todos los costos de implementación — coherente con que en Sites Master es el único sitio con Identificación de Pasillos = 1.0 y WiFi = 1.0 (ya está listo).
- "Etiquetado Manual" es $0 en los 8 sitios de Colombia sin excepción, y tiene valor en 6 de los 7 de México — patrón a tener presente, podría ser una diferencia real de proceso entre países.

## 4. Resource Master — los 18 roles
Un renglón por rol, con su costo mensual (MXN), si es interno/externo, si su costo es fijo/flexible, si puede multitarea, y el headcount `Actual` vs `Escenario 1`:

| Columna original | Traducción |
|---|---|
| Role | Rol |
| Work Mode | Modalidad (Remoto/Híbrido/Presencial) |
| Can Multitask | Puede Multitarea — 3 valores: Sí / Parcial / No |
| Internal or External | Interno o Externo |
| Fixed or Flexible Cost | Costo Fijo o Flexible |
| Average Monthly Cost (MXN) | Costo Mensual Promedio |
| Actual | Personas asignadas hoy |
| Escenario 1 | Personas propuestas (escenario de ejemplo del archivo) |

**Cómo leer `Actual` vs `Escenario 1`:** `Actual` es la plantilla de hoy (casi todos los roles con 1 persona) — con eso, muy probablemente el programa NO llega a 8 meses por contención de recursos entre sitios en paralelo. `Escenario 1` sube los 18 roles a 5 personas por igual — es un caso de ejemplo para probar que el simulador calcula bien, no la respuesta al reto. La tarea real es encontrar qué roles son cuello de botella y subirles headcount solo ahí, minimizando costo.

**Anomalías / observaciones:**
- 3 roles aparecen dos veces (Interno y Externo, cada uno con su propio costo/headcount): *Change Management Lead*, *Infrastructure Lead*, *Functional Lead*. No es un duplicado — son dos bolsas de recursos distintas para el mismo puesto.
- Celdas sueltas "Go Live" / "Post" en la fila de *Solution Architect*, sin encabezado ni explicación en ninguna otra pestaña — confirmado con el usuario: basura de formato, se ignora.

## 5. Implementation Phases — duración por clúster y madurez
8 fases en orden fijo (Site Readiness → Design Adaptation → Functional Review → UAT → Training → DIALT → Go Live → Hypercare), con duración en semanas que depende del **Clúster (1–4)** y del **Nivel de Madurez (A o B)**.

Verificado: la suma de las 8 fases por sitio da entre 10 y 19 semanas, tal como dice la ficha del ejercicio.

| Clúster | Semanas — Madurez A | Semanas — Madurez B |
|---|---|---|
| 1 | 19 | 15 |
| 2 | 16 | 15 |
| 3 | 15 | 15 (idénticas) |
| 4 | 10 | 10 (idénticas) |

**Decisión sobre Madurez A/B**: ninguna pestaña indica qué madurez le corresponde a cada uno de los 15 sitios, y no es una de las palancas que menciona la ficha del ejercicio. Se maneja como **palanca ajustable por sitio, con "A" por defecto** (confirmado con el usuario) — el usuario puede cambiar cualquier sitio a "B" al armar un escenario. Solo cambia algo real en Clúster 1 y 2 (12 de los 15 sitios).

## 6. Phase-Resource Allocation — la llave de la contención de recursos
Por cada Clúster y Fase, qué roles se necesitan y qué fracción de su capacidad consumen (`Capacity Consumption`: 1 = tiempo completo, 0.5 = medio tiempo, etc.). Aquí se ve por qué dos sitios en paralelo compiten por la misma gente.

**Hallazgos:**
- **Clúster 1, 2 y 3 tienen exactamente la misma tabla** (mismos roles, mismas fases, mismo consumo). **Clúster 4 no tiene ninguna fila** — hueco real del archivo. Decisión (confirmada con el usuario): el simulador asume que Clúster 4 usa la misma tabla que 1/2/3, dejándolo etiquetado como supuesto.
- Cuando el mismo rol aparece repetido dentro de la misma fase (ej. "Trainers" 3 veces en Hypercare), **no es un duplicado** — se suma: significa que se necesitan 3 personas-equivalente de ese rol al mismo tiempo, no 1.
- **Go Live es la fase que más recursos consume**: casi todos los roles al 100% de su capacidad simultáneamente — es el punto más probable de cuello de botella si varios sitios llegan a Go Live al mismo tiempo.

---

## Resumen de cómo se conectan las pestañas

```
Sites Master (15 sitios, cada uno con un Clúster 1-4)
     │
     ├─→ Implementation Phases (duración de cada una de las 8 fases, por Clúster + Madurez A/B)
     │        │
     │        └─→ define CUÁNDO cada sitio pasa por cada fase (con el orden/paralelismo que elija el usuario)
     │
     └─→ Phase-Resource Allocation (qué roles y cuánta capacidad consume cada fase, por Clúster)
              │
              └─→ se compara contra Resource Master (headcount disponible por rol)
                       │
                       └─→ si la demanda de un rol en una semana > headcount disponible → contención → se retrasa

Financials (USD/MXN) + Resource Master (costo mensual por rol × headcount elegido)
     │
     └─→ Resumen de costos (entregable 5): por escenario, por sitio, por tipo de recurso
```
