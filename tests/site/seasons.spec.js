import { test, expect } from "./fixtures.js";
import { chapters } from "../../webpage/scripts/chapters.js";
import { eraPalette, getEra } from "../../webpage/scripts/eras.js";
import halloween from "../../webpage/seasons/halloween/season.js";

async function open(page, route, query = "") {
  await page.goto(`${query ? `?${query}` : ""}#/${route}`);
  await expect(page.locator("#article")).not.toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("alert")).toHaveCount(0);
}

test("the calendar picks Halloween in October and classic otherwise", async ({ page }) => {
  await open(page, "overview");
  await expect(page.locator("html")).toHaveAttribute("data-season", "classic");
  await expect(page.locator("#season-stylesheet")).toHaveAttribute("href", "seasons/classic/season.css");
  await expect(page.locator(".brand-copy > span")).toHaveText("A self-paced course");

  await page.clock.setFixedTime(new Date("2026-10-20T12:00:00"));
  await page.reload();
  await expect(page.locator("#article")).not.toHaveAttribute("aria-busy", "true");
  await expect(page.locator("html")).toHaveAttribute("data-season", "halloween");
  await expect(page.locator("#season-stylesheet")).toHaveAttribute("href", "seasons/halloween/season.css");
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "seasons/halloween/assets/favicon.svg");
  await expect(page.locator(".brand-copy > span")).toHaveText(halloween.copy.tagline);
  await expect(page.locator(".site-footer > span")).toHaveText(halloween.copy.footer);
  await expect(page.locator(".scene-caption")).toHaveText(halloween.hero.caption);

  await open(page, "overview", "season=classic");
  await expect(page.locator("html")).toHaveAttribute("data-season", "classic");
  await open(page, "overview", "season=unknown");
  await expect(page.locator("html")).toHaveAttribute("data-season", "halloween");
});

test("Halloween gives every stop its own scene, label, and art", async ({ page }) => {
  for (const chapter of chapters) {
    await open(page, chapter.slug, "season=halloween");
    const era = getEra(chapter.era, halloween);
    await expect(page.locator("html")).toHaveAttribute("data-scene", era.scene);
    if (chapter.slug === "overview") continue;
    await expect(page.locator(".scene-name")).toHaveText(era.label);
    const art = page.locator(".era-art:visible");
    await expect(art).toHaveAttribute("src", new RegExp(`/seasons/halloween/assets/${era.art}$`));
    await expect.poll(() => art.evaluate(image => image.complete && image.naturalWidth > 0)).toBeTruthy();
  }
});

test("Halloween swaps lesson illustrations and setup text, and classic does not", async ({ page }) => {
  const setup = chapters.find(item => item.slug === "prerequisites");
  await open(page, setup.slug, "season=halloween");
  await expect(page.locator(".illustration-light")).toHaveAttribute("href", /\/seasons\/halloween\/illustrations\/soundcheck-light\.svg$/);
  await expect(page.locator(".illustration-light img")).toHaveAttribute("alt", halloween.illustrationText.soundcheck.description);
  await expect.poll(() => page.locator(".illustration-light img").evaluate(image => image.complete && image.naturalWidth > 0)).toBeTruthy();
  expect(await page.locator(".era-intro h1").evaluate(element => getComputedStyle(element).fontStyle)).toBe("italic");

  await open(page, setup.slug, "season=classic");
  await expect(page.locator(".illustration-light")).toHaveAttribute("href", /\/content\/docs\/illustrations\/soundcheck-light\.svg$/);
  await expect(page.locator(".scene-name")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-scene", /.+/);
});

test("switching seasons keeps progress, color mode, and the route", async ({ page }) => {
  await open(page, "01-assessment", "season=halloween&clawpilotTheme=dark");
  await page.getByRole("button", { name: "Mark step complete" }).click();
  await expect(page.locator("#course-progress")).toContainText("1 of 7");
  expect(await page.locator("html").evaluate(element => element.style.getPropertyValue("--paper")))
    .toBe(eraPalette("1980s", "dark", halloween).paper);
  await open(page, "01-assessment", "season=classic&clawpilotTheme=dark");
  await expect(page.locator("#course-progress")).toContainText("1 of 7");
  await expect(page.getByRole("button", { name: "Marked complete" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("data-era", "1980s");
});
