/**
 * Drives the Semillas app end-to-end over the 4 Aspirante lessons:
 * - world page shows the four lessons in content order
 * - every lesson playable start to finish
 * - lesson 1: fail the ordering question (wrong-order validation + requeue)
 * - lesson 3: fail the "lema" fill_blank (wrong words + requeue); this lesson
 *   has TWO fill_blank questions, so the driver disambiguates them by the
 *   rendered statement fragment.
 */
const { chromium } = require("playwright-core");
const world = require("/home/jose/projects/semillas/client/src/data/worlds/aspirante.json");
const fs = require("fs");

const BASE = "http://localhost:5199";
const SHOTS = __dirname + "/shots4";
fs.mkdirSync(SHOTS, { recursive: true });
let shotN = 0;
const log = (...a) => console.log(...a);

async function shot(page, name) {
  const file = `${SHOTS}/${String(++shotN).padStart(2, "0")}-${name}.png`;
  await page.screenshot({ path: file });
  log(`  [shot] ${file}`);
}

async function findQuestion(page, lesson, h2) {
  if (h2 !== "Completa la frase") {
    return lesson.questions.find((q) => q.statement === h2);
  }
  // fill_blank: h2 is generic; match by the statement's first segment,
  // which the component renders inline.
  const bodyText = await page.locator("main").textContent();
  return lesson.questions.find(
    (q) =>
      q.type === "fill_blank" &&
      bodyText.includes(q.statement.split("{blank}")[0].trim()),
  );
}

async function answer(page, q, correctly) {
  const main = page.locator("main");
  switch (q.type) {
    case "multiple_choice": {
      const text = correctly
        ? q.options[q.answer]
        : q.options[(q.answer + 1) % q.options.length];
      await main.getByRole("button", { name: text, exact: true }).click();
      break;
    }
    case "true_false": {
      const value = correctly ? q.answer : !q.answer;
      await main.getByRole("button", { name: value ? "Verdadero" : "Falso" }).click();
      break;
    }
    case "fill_blank": {
      const words = correctly ? q.answer : [...q.answer].reverse();
      for (const word of words) {
        await main
          .locator("div.flex-wrap")
          .getByRole("button", { name: word, exact: true })
          .click();
      }
      break;
    }
    case "matching": {
      for (const pair of q.pairs) {
        await main.getByRole("button", { name: pair.left, exact: true }).click();
        await main.getByRole("button", { name: pair.right, exact: true }).click();
      }
      break;
    }
    case "ordering": {
      const order = correctly
        ? q.answer
        : [...q.answer.slice(1), q.answer[0]]; // rotated: guaranteed wrong
      for (const item of order) {
        await main.getByRole("button", { name: item }).click();
      }
      break;
    }
    default:
      throw new Error(`tipo desconocido: ${q.type}`);
  }
}

/** Plays a lesson to completion; fails failQuestion (a question object) once. */
async function playLesson(page, lesson, { failQuestion = null, shotPrefix }) {
  const seenQuestions = [];
  let failedOnce = false;
  for (let step = 1; step <= 60; step++) {
    const done = page.getByText("¡Lección completada!");
    const h2 = page.locator("main h2");
    await done.or(h2).first().waitFor({ timeout: 10000 });
    if (await done.isVisible()) return seenQuestions;

    const statement = (await h2.textContent()).trim();
    const q = await findQuestion(page, lesson, statement);
    if (!q) throw new Error(`pregunta no encontrada para h2: "${statement}"`);
    seenQuestions.push(q);

    const failNow = !failedOnce && q === failQuestion;
    await answer(page, q, !failNow);
    await page.getByRole("button", { name: "Comprobar" }).click();
    const expected = failNow ? "No exactamente" : "¡Muy bien!";
    await page.getByText(expected).waitFor({ timeout: 5000 });
    log(`  [${step}] (${q.type}) "${q.statement.slice(0, 52)}..." -> ${expected}`);
    if (failNow) {
      await page.waitForTimeout(400); // let color transitions settle
      await shot(page, `${shotPrefix}-fallo-${q.type}`);
      failedOnce = true;
    }

    await page.getByRole("button", { name: "Continuar" }).click();
    await page
      .getByRole("button", { name: "Comprobar" })
      .or(done)
      .first()
      .waitFor({ timeout: 10000 });
  }
  throw new Error("la lección no terminó en 60 pasos");
}

async function expectText(page, text, label) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout: 5000 });
  log(`  [ok] visible: ${label ?? text}`);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 400, height: 800 },
    deviceScaleFactor: 2,
  });
  page.on("pageerror", (e) => log(`  [PAGEERROR] ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") log(`  [CONSOLE ERROR] ${m.text()}`);
  });

  log("== Mapa -> mundo Aspirante: orden de las 4 lecciones ==");
  await page.goto(BASE);
  await expectText(page, "0 XP", "XP inicial 0");
  await page.getByText("Aspirante a Campista").first().click();
  for (const lesson of world.lessons) await page.getByText(lesson.title).waitFor();
  const positions = await page
    .locator("main")
    .evaluate(
      (main, titles) => titles.map((t) => main.textContent.indexOf(t)),
      world.lessons.map((l) => l.title),
    );
  for (let i = 0; i < positions.length; i++) {
    if (positions[i] === -1 || (i > 0 && positions[i] <= positions[i - 1]))
      throw new Error(`orden de lecciones inesperado: ${JSON.stringify(positions)}`);
  }
  log(`  [ok] las ${world.lessons.length} lecciones aparecen en el orden del JSON`);
  await shot(page, "mundo-4-lecciones");

  for (const [i, lesson] of world.lessons.entries()) {
    // Fail once per requeue-check lesson: ordering in L1, "lema" fill_blank in L3.
    const failQuestion =
      i === 0
        ? lesson.questions.find((q) => q.type === "ordering")
        : i === 2
          ? lesson.questions.find((q) => q.type === "fill_blank")
          : null;
    log(`== Lección ${i + 1}: ${lesson.title}${failQuestion ? ` (fallando una ${failQuestion.type})` : ""} ==`);
    await page.getByText(lesson.title).first().click();
    const seen = await playLesson(page, lesson, { failQuestion, shotPrefix: `l${i + 1}` });

    const expectedScreens = lesson.questions.length + (failQuestion ? 1 : 0);
    if (seen.length !== expectedScreens)
      throw new Error(`se esperaban ${expectedScreens} pantallas, hubo ${seen.length}`);
    if (failQuestion && seen[seen.length - 1] !== failQuestion)
      throw new Error("la pregunta fallada NO se reencoló al final");
    if (failQuestion) log(`  [ok] pregunta fallada reencolada al final (${seen.length}/${lesson.questions.length})`);
    await expectText(page, "+20", "XP ganado +20");
    const firstTry = lesson.questions.length - (failQuestion ? 1 : 0);
    await expectText(page, `${firstTry}/${lesson.questions.length}`, `aciertos ${firstTry}/${lesson.questions.length}`);
    await shot(page, `l${i + 1}-completada`);
    await page.getByRole("link", { name: "Volver al mundo" }).click();
  }

  log("== XP total ==");
  await page.goto(BASE);
  await expectText(page, `${world.lessons.length * 20} XP`, `XP total ${world.lessons.length * 20}`);
  await shot(page, "mapa-final");

  await browser.close();
  log("\nTODO OK");
})().catch((e) => {
  console.error("FALLO:", e.message);
  process.exit(1);
});
