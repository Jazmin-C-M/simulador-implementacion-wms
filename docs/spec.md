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

## Pendiente

- El archivo `WMS Scenarios.xlsx` aún no se ha recibido — se colocará en `datos/` cuando el usuario lo comparta.
- Definición técnica de cómo se construirá el simulador (lenguaje/herramienta, ya que el usuario no tiene Python instalado) se decide una vez que se revise el archivo real.
