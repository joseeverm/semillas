# Semillas — client

App de repaso tipo Duolingo para los Campamentos Juveniles de Colombia. Los campistas repasan mística, historia, simbología y técnicas mediante lecciones cortas y gamificadas. PWA offline-first: sin backend, sin auth, sin llamadas de red; contenido en JSON estático y progreso en localStorage.

## Regla de oro del producto

**La app NUNCA otorga niveles reales del programa** (Aspirante, Semilla, Raíz, Tallo, Hoja, Flor, Fruto). Completar contenido solo da XP. Los niveles se ganan en los campamentos con lo práctico. La app es herramienta de repaso, no de ascenso. No agregar UI que sugiera lo contrario.

## Convención de idioma

- **Código en inglés**: identificadores, componentes, tipos, claves del JSON de contenido, nombres de archivo.
- **Español solo para lo visible al usuario**: textos de UI, valores del contenido (`statement`, `explanation`, `title`, ...) y rutas de URL (`/mundo/:worldId/leccion/:lessonId`), porque el usuario las ve. Los mensajes de `validate:content` también van en español (los leen los editores de contenido).

## Decisiones tomadas

- **Solo tap, sin drag and drop**: todas las mecánicas (ordenar, emparejar, completar) funcionan tocando. Pensado para pulgar en celular.
- **Tipos de pregunta actuales**: `multiple_choice`, `true_false`, `fill_blank`, `matching`, `ordering` — unión discriminada por `type` en `src/types/content.ts`.
- **Tipos futuros previstos (NO implementados)**: `written` (respuesta por teclado) e `image_identification` (foto + opciones). Agregar uno = definir su interfaz, sumarla a la unión `Question`, crear su componente y agregar el caso en `QuestionRenderer`.
- **Contrato de componentes de pregunta** (`QuestionProps`): reciben `question` y `checked`, reportan con `onResult(correct: boolean | null)` (null = respuesta incompleta). El botón "Comprobar" y el panel de feedback viven en `LessonPage`, no en los componentes.
- **Reencolado al fallar**: una pregunta fallada vuelve al final de la cola de la lección (estilo Duolingo). La lección termina cuando todas fueron respondidas bien.
- **XP solo la primera vez**: repetir una lección completada no vuelve a dar XP (la pantalla de resultado lo indica).
- **Gamificación acotada**: solo XP. NO implementar rachas, vidas ni ligas (la liga llegará con el backend; no dejar UI muerta).
- **Progreso versionado**: localStorage bajo la clave `semillas-progress` con campo `version`; las migraciones viven en `migrate()` de `ProgressContext.tsx`.
- **Contenido real por mundos**: un JSON por mundo en `src/data/worlds/` (el nombre del archivo = `id` del mundo); `src/data/index.ts` los descubre con `import.meta.glob` y los ordena por `order`. Las preguntas no llevan `id` y siguen la convención **respuesta primero** (`answer: 0` en multiple_choice): la UI baraja las opciones al mostrar. En `ordering`, `items` es el conjunto de elementos (su orden en el JSON no importa) y `answer` es el orden correcto, permutación exacta de `items`; la UI muestra los elementos barajados evitando el orden de `answer`. Cada pregunta trae `source` (`{ booklet, page, topic }`), metadato editorial que la app NUNCA usa ni muestra. En `fill_blank`, el `statement` lleva los huecos como `{blank}`: `LessonPage` titula "Completa la frase" y el componente renderiza la frase con los huecos. El contenido real está validado contra las cartillas oficiales: no editar enunciados/respuestas desde código; los problemas se reportan.
- **Validación de contenido**: `pnpm validate:content` (Zod, `scripts/validate-content.ts`) corre como primer paso de `pnpm build` y falla con archivo/lección/pregunta exactos.
- **Tema claro atenuado**: fondo `green-100`, tarjetas y opciones `green-50`, estados un paso más profundos (`green-200`, `amber-200`). **Nunca blanco puro ni superficies muy brillantes**: a Jose le resultan encandilantes. Mantener esta escala al agregar UI nueva.
- **Tema oscuro**: clase `.dark` en `<html>` (variante custom de Tailwind en `index.css`). Arranca según `prefers-color-scheme`; el toggle 🌙/☀️ del mapa lo sobreescribe y persiste en localStorage (`semillas-theme`). Lógica en `src/theme/theme.ts`. Los estados de color de las opciones (con sus variantes dark) están centralizados en `src/components/questions/optionStyles.ts` — usar esas constantes al crear nuevos tipos de pregunta.
- **PWA**: `vite-plugin-pwa` con `registerType: "autoUpdate"` y precache de todos los assets (los campistas suelen estar sin señal).

## Iconografía (Phosphor)

- **`@phosphor-icons/react` es la ÚNICA librería de iconos del proyecto.** No usar Lucide, Heroicons, react-icons ni emojis como iconos de UI.
- **El estado se comunica con el peso (`weight`) del icono:**
  - `regular` → estado neutro o disponible
  - `fill` o `duotone` → completado, activo o seleccionado
  - `bold` → énfasis puntual (opcional; p. ej. la X de salir de la lección)
- El patrón "icono que pasa de `regular` a `fill` al completarse" está encapsulado en `src/components/ProgressIcon.tsx` — usarlo para mundos, lecciones y futuros elementos completables.
- **Todo icono interactivo lleva feedback táctil** con Tailwind: `transition-all duration-200 active:scale-90`.
- **Tamaños con la prop `size`** de Phosphor (no clases de Tailwind); mínimo `24` en elementos tocables por accesibilidad táctil.
- Vocabulario del dominio: plantas para la progresión de mundos (`Acorn` → `Plant` → `Carrot` → `Grains` → `Leaf` → `Flower` → `Orange`, uno por nivel, en `WorldMapPage`), `Plant` para lecciones, `Lightning` (fill) para XP, `CheckCircle`/`XCircle` (fill) para feedback correcto/incorrecto, `Confetti` (duotone) para la celebración, `Tent` para lo campamentil.

## Estructura

```
client/
  public/                 # íconos PWA (icon.svg, icon-192.png, icon-512.png)
  scripts/                # validate-content.ts (validación Zod del contenido)
  src/
    components/questions/ # un componente por tipo de pregunta + QuestionRenderer + QuestionProps
    data/                 # worlds/*.json (un mundo por archivo) + index.ts (glob + orden)
    lib/                  # utilidades puras (shuffle)
    pages/                # WorldMapPage, WorldPage, LessonPage (incluye vista de resultado)
    progress/             # ProgressContext: XP y lecciones completadas, persistido y versionado
    theme/                # tema claro/oscuro (clase .dark + localStorage)
    types/                # content.ts: modelo del contenido
```

## Comandos (usar pnpm, nunca npm ni yarn)

```bash
pnpm dev              # servidor de desarrollo
pnpm build            # validate:content + type-check (tsc) + build de producción con PWA
pnpm preview          # sirve el build (necesario para probar el service worker)
pnpm lint             # oxlint (config en .oxlintrc.json)
pnpm validate:content # valida los JSON de src/data/worlds/ con Zod
```

## Restricciones del repo

- El repo git vive en la **raíz del monorepo** (`semillas/`, rama `main`), no en `client/`. El `.gitignore` raíz cubre `node_modules/`, builds y `.env`.
- Todo el trabajo de esta fase ocurre dentro de `client/`. **No tocar `server/`.**
- El contenido de `src/data/worlds/` es el real de las cartillas oficiales; hoy solo existe `aspirante.json`. Al agregar un mundo: crear su JSON, quitar el nivel de `UPCOMING_LEVELS` en `WorldMapPage` y correr `pnpm validate:content`.
