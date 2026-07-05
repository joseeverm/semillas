---
name: verify
description: Verifica de punta a punta el contenido y el flujo de lecciones de Semillas (client/) en pnpm dev con Chrome headless.
---

# Verificación end-to-end del client de Semillas

Receta probada para verificar contenido nuevo en `src/data/worlds/*.json` y
cambios en los componentes de pregunta. El flujo real es: mapa → mundo →
jugar cada lección completa (los 5 tipos de pregunta), incluyendo fallar una
pregunta y comprobar que se reencola al final.

## Setup

- No hay Playwright en el repo: instalar `playwright-core` en un directorio
  temporal (`npm i playwright-core`) y lanzarlo con el Chrome del sistema
  (`executablePath: "/usr/bin/google-chrome"`, headless).
- Servidor: `pnpm dev --port 5199 --strictPort` en background desde `client/`
  (esperar el 200 con curl antes de arrancar el driver).
- Antes del e2e: `pnpm validate:content` y `pnpm build` (el build ya incluye
  la validación y tsc).

## Driver

`drive-worlds.js` (en esta carpeta) es **genérico respecto al contenido**:
ensambla el mundo desde su carpeta (`meta.json` + archivos de unidad, igual
que `src/data/index.ts`) y juega todas sus lecciones. Copiarlo al scratchpad,
ajustar `WORLD_DIR`/`BASE` si hace falta, y correrlo con `node` (necesita
`playwright-core` instalado en el cwd). Comprueba:

- encabezados de unidad y orden de las lecciones en la página del mundo
  (unidades según `units` del meta, lecciones según su archivo),
- cada lección de inicio a fin con respuestas correctas,
- fallo deliberado + reencolado al final (ordering en la lección 1 y un
  fill_blank en la 3; ajustar índices si cambia el contenido),
- XP por lección (+20) y XP total en el mapa (20 × lecciones),
- errores de consola/página (los loguea).

## Trampas conocidas

- **fill_blank**: la UI titula todas "Completa la frase"; si una lección
  tiene más de una, identificar la pregunta por el primer segmento del
  `statement` renderizado en el `main` (el driver ya lo hace).
- **Colores de feedback**: las opciones tienen `transition-all duration-150`;
  un screenshot tomado justo al aparecer "No exactamente"/"¡Muy bien!"
  captura los colores a medio interpolar y parece un bug de estilos sin
  serlo. Esperar ~400 ms antes de capturar o inspeccionar `classList`.
- Las respuestas siguen la convención **respuesta primero** (`answer: 0` en
  multiple_choice); en `ordering`, el orden correcto está en `answer`, no en
  `items`.
