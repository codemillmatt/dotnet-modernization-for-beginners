import { test, expect } from "@playwright/test";
import { eraPalette } from "../../webpage/scripts/eras.js";

const evidenceRoot = "examples/assessments/bookcatalog";
const documents = ["assessment-excerpts.md", "planning-excerpts.md", "execution-excerpts.md"];
const images = ["legacy-preview.png", "ch1-1-upgrade-agent-dashboard.png",
  "ch1-2-dashboard-assessment.png", "ch1-3-assessment-view.png", "ch2-1-dashboard-plan.png",
  "ch3-1-dashboard-task1-done.png", "ch3-2-most-tasks-complete.png"];

async function checkLogbookContrast(page) {
  const values = await page.evaluate(() => {
    const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number)
      .map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4)
      .reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
    return [".flight-intro h1", ".flight-kicker", ".flight-caption", ".flight-tabs a", "#article > p", "#article pre code"]
      .map(selector => {
        const element = document.querySelector(selector);
        let background = element;
        while (background && getComputedStyle(background).backgroundColor === "rgba(0, 0, 0, 0)") {
          background = background.parentElement;
        }
        const a = luminance(getComputedStyle(element).color);
        const b = luminance(getComputedStyle(background).backgroundColor);
        return { selector, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
      });
  });
  for (const value of values) expect(value.ratio, value.selector).toBeGreaterThanOrEqual(4.5);
}

for (const [host, base] of [
  ["subpath", "http://127.0.0.1:4189/workshop/"],
  ["root", "http://127.0.0.1:4193/"]
]) {
  test(`previous sample run at ${host}: logbook theme, images, and progress`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${base}#/01-assessment`);
    await expect(page.locator("#article")).not.toHaveAttribute("aria-busy", "true");
    await page.getByRole("button", { name: "Mark step complete" }).click();

    for (const [width, theme] of [[1440, "light"], [1440, "dark"], [390, "light"], [390, "dark"], [320, "dark"]]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${base}?clawpilotTheme=${theme}#/reference?path=${encodeURIComponent(`${evidenceRoot}/README.md`)}`);
      await expect(page.locator("#article")).not.toHaveAttribute("aria-busy", "true");
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expect(page.locator("#article h1")).toHaveText("BookCatalog: a previous sample run");
      await expect(page).toHaveTitle("Previous BookCatalog sample run | .NET Modernization");
      await expect(page.locator("html")).toHaveAttribute("data-era", "1950s");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect(await page.locator("html").evaluate(element => element.style.getPropertyValue("--paper")))
        .toBe(eraPalette("1950s", theme).paper);
      await expect(page.locator(".flight-caption")).toContainText("Not a finished upgrade");
      await expect(page.locator("#bookcatalog-visual-studio-recording")).toBeAttached();
      await expect(page.locator("#recording-environment")).toBeAttached();
      const art = page.locator(".flight-intro .era-art");
      await expect(art).toHaveAttribute("src", /\/assets\/era-1950s\.svg$/);
      await expect.poll(() => art.evaluate(image => image.complete && image.naturalWidth > 0)).toBeTruthy();
      await checkLogbookContrast(page);
      const screenshots = page.locator(`#article img[src*="/${evidenceRoot}/images/"]`);
      await expect(screenshots).toHaveCount(images.length);
      for (const name of images) {
        const image = screenshots.and(page.locator(`img[src$="/${name}"]`));
        await image.locator("..").scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBeTruthy();
        await expect(image).toHaveAttribute("alt", /\S.{30,}/);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
      await expect(page.locator("#course-progress")).toHaveText("1 of 7 required steps complete");
      await expect(page.locator("[data-complete]")).toHaveCount(0);
    }

    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const [date, section] of [
      ["18 Sep 2026", "sample-run-environment"],
      ["21 Sep 2026", "september-21-supplied-assessment-and-upgrade"]
    ]) {
      await page.getByRole("navigation", { name: "Sample run dates" }).getByRole("link", { name: new RegExp(date) }).click();
      await expect(page).toHaveURL(new RegExp(`section=${section}$`));
      await expect(page.locator(`#${section}`)).toBeInViewport();
    }
    await page.getByRole("button", { name: "Use light theme" }).click();
    await page.reload();
    await expect(page.locator(".flight-intro")).toBeAttached();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("html")).toHaveAttribute("data-era", "1950s");
    await page.setViewportSize({ width: 320, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
    await page.evaluate(() => { document.documentElement.style.fontSize = ""; });

    for (const name of documents) {
      await page.goto(`${base}#/reference?path=${encodeURIComponent(`${evidenceRoot}/${name}`)}`);
      await expect(page.locator("#article")).not.toHaveAttribute("aria-busy", "true");
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expect(page.locator("#article h1")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-era", "2020s");
      await expect(page.locator(".flight-intro")).toHaveCount(0);
      await expect(page.locator("#article pre")).not.toHaveCount(0);
      await expect(page.locator("[data-complete]")).toHaveCount(0);
      await expect(page.locator("#course-progress")).toHaveText("1 of 7 required steps complete");
      await expect(page.locator("#resume-link")).toHaveAttribute("href", "#/01-assessment");
    }
    for (const rawPath of ["assessment.json", "runtime-acceptance.md", "final-mod-agent-files/tasks.md"]) {
      expect((await page.request.get(`${base}content/${evidenceRoot}/${rawPath}`)).status()).toBe(404);
    }
    expect(errors).toEqual([]);
  });
}

test("previous sample run keeps its theme on failure and restores the saved chapter on resume", async ({ page }) => {
  await page.goto("#/01-assessment");
  await expect(page.locator("#article")).not.toHaveAttribute("aria-busy", "true");
  await page.route(`**/content/${evidenceRoot}/README.md`, route => route.fulfill({ status: 503, body: "Unavailable" }));
  await page.goto(`#/reference?path=${encodeURIComponent(`${evidenceRoot}/README.md`)}`);
  await expect(page.getByRole("alert")).toContainText("HTTP 503");
  await expect(page.locator("html")).toHaveAttribute("data-era", "1950s");
  await page.unroute(`**/content/${evidenceRoot}/README.md`);
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator(".flight-intro")).toBeVisible();
  await page.locator("#resume-link").click();
  await expect(page.locator("html")).toHaveAttribute("data-era", "1980s");
  await expect(page.locator(".flight-intro")).toHaveCount(0);
});
