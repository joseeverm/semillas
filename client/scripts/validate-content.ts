/**
 * Validates every world JSON in src/data/worlds/ against the content schema.
 * Runs with plain Node (type stripping): `pnpm validate:content`. It is also
 * the first step of `pnpm build`, so invalid content never ships.
 *
 * Messages are in Spanish: they are read by content editors, not only devs.
 */
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const worldsDir = fileURLToPath(new URL("../src/data/worlds", import.meta.url));

const nonEmpty = z.string().trim().min(1, "el texto no puede estar vacío");

function reportDuplicates(
  values: string[],
  field: string,
  ctx: z.RefinementCtx,
): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      ctx.addIssue({
        code: "custom",
        path: [field],
        message: `"${value}" está repetido en ${field}`,
      });
    }
    seen.add(value);
  }
}

const sourceSchema = z.object({
  booklet: nonEmpty,
  page: z.number().int().positive("page debe ser un número de página válido"),
  topic: nonEmpty,
});

const questionBase = {
  statement: nonEmpty,
  explanation: nonEmpty,
  source: sourceSchema,
};

const multipleChoiceSchema = z
  .object({
    type: z.literal("multiple_choice"),
    ...questionBase,
    options: z.array(nonEmpty).min(2, "se necesitan al menos 2 opciones"),
    answer: z.number().int().min(0),
  })
  .superRefine((q, ctx) => {
    if (q.answer >= q.options.length) {
      ctx.addIssue({
        code: "custom",
        path: ["answer"],
        message: `answer ${q.answer} fuera de rango: hay ${q.options.length} opciones (índices 0 a ${q.options.length - 1})`,
      });
    }
    reportDuplicates(q.options, "options", ctx);
  });

const trueFalseSchema = z.object({
  type: z.literal("true_false"),
  ...questionBase,
  answer: z.boolean(),
});

const fillBlankSchema = z
  .object({
    type: z.literal("fill_blank"),
    ...questionBase,
    options: z.array(nonEmpty).min(2, "se necesitan al menos 2 palabras en el banco"),
    answer: z.array(nonEmpty).min(1, "se necesita al menos una respuesta"),
  })
  .superRefine((q, ctx) => {
    const blanks = q.statement.split("{blank}").length - 1;
    if (blanks === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["statement"],
        message: "el statement no contiene ningún {blank}",
      });
    } else if (blanks !== q.answer.length) {
      ctx.addIssue({
        code: "custom",
        path: ["answer"],
        message: `el statement tiene ${blanks} {blank} pero answer trae ${q.answer.length} palabra(s)`,
      });
    }
    // Multiset containment: every answer word must be available in the bank.
    const remaining = [...q.options];
    for (const word of q.answer) {
      const i = remaining.indexOf(word);
      if (i === -1) {
        ctx.addIssue({
          code: "custom",
          path: ["answer"],
          message: `la respuesta "${word}" no está en options (o se usa más veces de las que aparece)`,
        });
      } else {
        remaining.splice(i, 1);
      }
    }
  });

const matchingSchema = z
  .object({
    type: z.literal("matching"),
    ...questionBase,
    pairs: z
      .array(z.object({ left: nonEmpty, right: nonEmpty }))
      .min(2, "se necesitan al menos 2 parejas"),
  })
  .superRefine((q, ctx) => {
    reportDuplicates(q.pairs.map((p) => p.left), "pairs (lado izquierdo)", ctx);
    reportDuplicates(q.pairs.map((p) => p.right), "pairs (lado derecho)", ctx);
  });

const orderingSchema = z
  .object({
    type: z.literal("ordering"),
    ...questionBase,
    items: z.array(nonEmpty).min(2, "se necesitan al menos 2 elementos"),
  })
  .superRefine((q, ctx) => reportDuplicates(q.items, "items", ctx));

const questionSchema = z.discriminatedUnion("type", [
  multipleChoiceSchema,
  trueFalseSchema,
  fillBlankSchema,
  matchingSchema,
  orderingSchema,
]);

const lessonSchema = z.object({
  id: nonEmpty,
  title: nonEmpty,
  xp: z.number().int().positive("xp debe ser un entero positivo"),
  questions: z.array(questionSchema).min(1, "la lección no tiene preguntas"),
});

const worldSchema = z.object({
  id: nonEmpty,
  title: nonEmpty,
  description: nonEmpty,
  order: z.number().int().positive("order debe ser un entero positivo"),
  lessons: z.array(lessonSchema).min(1, "el mundo no tiene lecciones"),
});

type World = z.infer<typeof worldSchema>;

/**
 * Turns a Zod issue path like ["lessons", 0, "questions", 2, "answer"] into
 * `lección 1 "aspirante-simbolos-01" › pregunta 3 (multiple_choice) › answer`,
 * resolving ids/types from the raw data so errors are easy to locate.
 */
function describePath(raw: unknown, path: PropertyKey[]): string {
  const parts: string[] = [];
  let node: unknown = raw;
  for (let i = 0; i < path.length; i++) {
    const segment = path[i];
    const nextIsIndex = typeof path[i + 1] === "number";
    if (segment === "lessons" && nextIsIndex) {
      const index = path[++i] as number;
      node = (node as { lessons?: unknown[] })?.lessons?.[index];
      const id = (node as { id?: string })?.id;
      parts.push(`lección ${index + 1}${id ? ` "${id}"` : ""}`);
    } else if (segment === "questions" && nextIsIndex) {
      const index = path[++i] as number;
      node = (node as { questions?: unknown[] })?.questions?.[index];
      const type = (node as { type?: string })?.type;
      parts.push(`pregunta ${index + 1}${type ? ` (${type})` : ""}`);
    } else {
      parts.push(String(segment));
      node = (node as Record<PropertyKey, unknown>)?.[segment];
    }
  }
  return parts.join(" › ");
}

const files = readdirSync(worldsDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

if (files.length === 0) {
  console.error(`✗ No hay ningún JSON de mundo en ${worldsDir}`);
  process.exit(1);
}

const errors: string[] = [];
const worlds: { file: string; world: World }[] = [];

for (const file of files) {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(join(worldsDir, file), "utf8"));
  } catch (error) {
    errors.push(`${file}: JSON inválido — ${(error as Error).message}`);
    continue;
  }
  const result = worldSchema.safeParse(raw);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const where = describePath(raw, issue.path);
      errors.push(`${file}${where ? ` › ${where}` : ""}: ${issue.message}`);
    }
    continue;
  }
  worlds.push({ file, world: result.data });
}

// Cross-file checks: stable ids/orders across the whole content set.
const seenWorldIds = new Map<string, string>();
const seenOrders = new Map<number, string>();
const seenLessonIds = new Map<string, string>();
for (const { file, world } of worlds) {
  if (basename(file, ".json") !== world.id) {
    errors.push(
      `${file}: el archivo debería llamarse "${world.id}.json" (id del mundo)`,
    );
  }
  const idOwner = seenWorldIds.get(world.id);
  if (idOwner) {
    errors.push(`${file}: id de mundo "${world.id}" repetido (ya está en ${idOwner})`);
  }
  seenWorldIds.set(world.id, file);
  const orderOwner = seenOrders.get(world.order);
  if (orderOwner) {
    errors.push(`${file}: order ${world.order} repetido (ya está en ${orderOwner})`);
  }
  seenOrders.set(world.order, file);
  for (const lesson of world.lessons) {
    const lessonOwner = seenLessonIds.get(lesson.id);
    if (lessonOwner) {
      errors.push(
        `${file}: id de lección "${lesson.id}" repetido (ya está en ${lessonOwner})`,
      );
    }
    seenLessonIds.set(lesson.id, file);
  }
}

if (errors.length > 0) {
  console.error(`✗ Contenido inválido: ${errors.length} error(es)\n`);
  for (const error of errors) {
    console.error(`  • ${error}`);
  }
  process.exit(1);
}

const lessonCount = worlds.reduce((sum, w) => sum + w.world.lessons.length, 0);
const questionCount = worlds.reduce(
  (sum, w) =>
    sum + w.world.lessons.reduce((s, l) => s + l.questions.length, 0),
  0,
);
console.log(
  `✓ Contenido válido: ${worlds.length} mundo(s), ${lessonCount} lección(es), ${questionCount} pregunta(s).`,
);
