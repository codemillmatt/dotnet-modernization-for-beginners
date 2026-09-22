import { test, expect } from "@playwright/test";

const evidenceRoot = "examples/assessments/bookcatalog";
const documents = ["assessment-excerpts.md", "planning-excerpts.md", "execution-excerpts.md"];
const images = ["legacy-preview.png", "ch1-1-upgrade-agent-dashboard.png",
  "ch1-2-dashboard-assessment.png", "ch1-3-assessment-view.png", "ch2-1-dashboard-plan.png",
  "ch3-1-dashboard-task1-done.png", "ch3-2-most-tasks-complete.png"];

for (const [host, base] of [
  ["subpath", "http://127.0.0.1:4189/workshop/"],
  ["root", "http://127.0.0.1:4193/"]
]) {
  test(`recorded evidence at ${host}: images load and excerpts do not award completion`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${base}#/01-assessment`);
    await expect(page.locator("#article")).not.toHaveAttribute("aria-busy", "true");
    await page.getByRole("button", { name: "Mark step complete" }).click();

    for (const [width, theme] of [[1440, "light"], [390, "dark"]]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${base}?clawpilotTheme=${theme}#/reference?path=${encodeURIComponent(`${evidenceRoot}/README.md`)}`);
      await expect(page.locator("#article")).not.toHaveAttribute("aria-busy", "true");
      await expect(page.getByRole("alert")).toHaveCount(0);
      const screenshots = page.locator(`#article img[src*="/${evidenceRoot}/images/"]`);
      await expect(screenshots).toHaveCount(images.length);
      for (const name of images) {
        const image = screenshots.and(page.locator(`img[src$="/${name}"]`));
        await image.locator("..").scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBeTruthy();
        await expect(image).toHaveAttribute("alt", /\S.{30,}/);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
      await expect(page.locator("#course-progress")).toHaveText("1 of 6 required steps complete");
      await expect(page.locator("[data-complete]")).toHaveCount(0);
    }

    for (const name of documents) {
      await page.goto(`${base}#/reference?path=${encodeURIComponent(`${evidenceRoot}/${name}`)}`);
      await expect(page.locator("#article")).not.toHaveAttribute("aria-busy", "true");
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expect(page.locator("#article h1")).toBeVisible();
      await expect(page.locator("#article pre")).not.toHaveCount(0);
      await expect(page.locator("[data-complete]")).toHaveCount(0);
      await expect(page.locator("#course-progress")).toHaveText("1 of 6 required steps complete");
      await expect(page.locator("#resume-link")).toHaveAttribute("href", "#/01-assessment");
    }
    for (const rawPath of ["assessment.json", "runtime-acceptance.md", "final-mod-agent-files/tasks.md"]) {
      expect((await page.request.get(`${base}content/${evidenceRoot}/${rawPath}`)).status()).toBe(404);
    }
    expect(errors).toEqual([]);
  });
}
