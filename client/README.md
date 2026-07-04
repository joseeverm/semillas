# Semillas 🌱

App de repaso para los **Campamentos Juveniles de Colombia**. Los campistas repasan la mística, la historia, la simbología y las técnicas del programa a través de lecciones cortas y gamificadas, al estilo Duolingo.

> **Importante:** el contenido se organiza según los niveles reales del programa (Aspirante, Semilla, Raíz, Tallo, Hoja, Flor, Fruto), pero **la app nunca otorga niveles reales**. Completar lecciones solo da XP. El rango se gana en los campamentos con lo práctico: la app es una herramienta de repaso, no de ascenso.

## Características

- 📱 PWA instalable y 100 % funcional sin conexión (pensada para zonas rurales sin señal).
- 🎮 5 mecánicas de pregunta, todas por tap: selección múltiple, verdadero/falso, completar frases, emparejar y ordenar.
- 🔁 Las preguntas falladas se reencolan al final de la lección, como en Duolingo.
- ⚡ XP acumulado y progreso guardados en el dispositivo (localStorage). Sin cuentas, sin servidores.

## Desarrollo

Requiere Node y **pnpm**.

```bash
pnpm install
pnpm dev       # desarrollo
pnpm build     # build de producción
pnpm preview   # probar el build (incluye service worker)
```

Stack: React 19 + Vite + TypeScript, Tailwind CSS, react-router-dom, vite-plugin-pwa. Ver `CLAUDE.md` para las convenciones y decisiones de arquitectura.
