/**
 * Validates the content under src/data/worlds/ against the content schema.
 * Structure: one folder per world with `meta.json` (world data + ordered
 * units) plus one JSON per unit (booklet) named `<unit>.json`.
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
    answer: z.array(nonEmpty).min(2, "se necesitan al menos 2 elementos"),
  })
  .superRefine((q, ctx) => {
    reportDuplicates(q.items, "items", ctx);
    const sorted = (values: string[]) => JSON.stringify([...values].sort());
    if (sorted(q.answer) !== sorted(q.items)) {
      ctx.addIssue({
        code: "custom",
        path: ["answer"],
        message: "answer debe tener exactamente los mismos elementos que items (en el orden correcto)",
      });
    }
  });

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

const metaSchema = z
  .object({
    id: nonEmpty,
    title: nonEmpty,
    description: nonEmpty,
    order: z.number().int().positive("order debe ser un entero positivo"),
    units: z
      .array(z.object({ id: nonEmpty, title: nonEmpty }))
      .min(1, "el mundo no declara ninguna unidad (cartilla)"),
  })
  .superRefine((meta, ctx) => {
    reportDuplicates(meta.units.map((u) => u.id), "units (id)", ctx);
    reportDuplicates(meta.units.map((u) => u.title), "units (title)", ctx);
  });

const unitFileSchema = z.object({
  unit: nonEmpty,
  lessons: z.array(lessonSchema).min(1, "el archivo de unidad no tiene lecciones"),
});

type WorldMeta = z.infer<typeof metaSchema>;
type UnitFile = z.infer<typeof unitFileSchema>;

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

const errors: string[] = [];

function parseFile<T>(relPath: string, schema: z.ZodType<T>): T | undefined {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(join(worldsDir, relPath), "utf8"));
  } catch (error) {
    errors.push(`${relPath}: JSON inválido — ${(error as Error).message}`);
    return undefined;
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const where = describePath(raw, issue.path);
      errors.push(`${relPath}${where ? ` › ${where}` : ""}: ${issue.message}`);
    }
    return undefined;
  }
  return result.data;
}

const entries = readdirSync(worldsDir, { withFileTypes: true });
for (const entry of entries) {
  if (entry.isFile() && entry.name.endsWith(".json")) {
    errors.push(
      `${entry.name}: archivo suelto en worlds/ — el contenido vive en carpetas por mundo (worlds/<mundo>/meta.json + <unidad>.json)`,
    );
  }
}
const worldDirs = entries
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

if (worldDirs.length === 0) {
  console.error(`✗ No hay ninguna carpeta de mundo en ${worldsDir}`);
  process.exit(1);
}

interface ParsedWorld {
  dir: string;
  meta: WorldMeta;
  lessonCount: number;
}
const parsedWorlds: ParsedWorld[] = [];
const seenLessonIds = new Map<string, string>();
let questionCount = 0;
let unitFileCount = 0;

for (const dir of worldDirs) {
  const files = readdirSync(join(worldsDir, dir))
    .filter((f) => f.endsWith(".json"))
    .sort();
  if (!files.includes("meta.json")) {
    errors.push(`${dir}/: falta meta.json`);
    continue;
  }
  const meta = parseFile(`${dir}/meta.json`, metaSchema);
  if (!meta) continue;
  if (meta.id !== dir) {
    errors.push(
      `${dir}/meta.json: la carpeta debería llamarse "${meta.id}" (id del mundo)`,
    );
  }

  let lessonCount = 0;
  for (const file of files) {
    if (file === "meta.json") continue;
    const relPath = `${dir}/${file}`;
    const unitFile: UnitFile | undefined = parseFile(relPath, unitFileSchema);
    if (!unitFile) continue;
    unitFileCount++;
    if (!meta.units.some((u) => u.id === unitFile.unit)) {
      errors.push(
        `${relPath}: unit "${unitFile.unit}" no está declarada en las units de meta.json`,
      );
    }
    if (basename(file, ".json") !== unitFile.unit) {
      errors.push(
        `${relPath}: el archivo debería llamarse "${unitFile.unit}.json" (id de la unidad)`,
      );
    }
    lessonCount += unitFile.lessons.length;
    questionCount += unitFile.lessons.reduce((s, l) => s + l.questions.length, 0);
    for (const lesson of unitFile.lessons) {
      const owner = seenLessonIds.get(lesson.id);
      if (owner) {
        errors.push(
          `${relPath}: id de lección "${lesson.id}" repetido (ya está en ${owner})`,
        );
      }
      seenLessonIds.set(lesson.id, relPath);
    }
  }
  if (lessonCount === 0) {
    errors.push(`${dir}/: el mundo no tiene lecciones (ningún archivo de unidad válido)`);
  }
  parsedWorlds.push({ dir, meta, lessonCount });
}

// Cross-world checks: stable ids/orders across the whole content set.
const seenWorldIds = new Map<string, string>();
const seenOrders = new Map<number, string>();
for (const { dir, meta } of parsedWorlds) {
  const idOwner = seenWorldIds.get(meta.id);
  if (idOwner) {
    errors.push(`${dir}/: id de mundo "${meta.id}" repetido (ya está en ${idOwner}/)`);
  }
  seenWorldIds.set(meta.id, dir);
  const orderOwner = seenOrders.get(meta.order);
  if (orderOwner) {
    errors.push(`${dir}/: order ${meta.order} repetido (ya está en ${orderOwner}/)`);
  }
  seenOrders.set(meta.order, dir);
}

if (errors.length > 0) {
  console.error(`✗ Contenido inválido: ${errors.length} error(es)\n`);
  for (const error of errors) {
    console.error(`  • ${error}`);
  }
  process.exit(1);
}

const totalLessons = parsedWorlds.reduce((s, w) => s + w.lessonCount, 0);
console.log(
  `✓ Contenido válido: ${parsedWorlds.length} mundo(s), ${unitFileCount} archivo(s) de unidad, ${totalLessons} lección(es), ${questionCount} pregunta(s).`,
);
