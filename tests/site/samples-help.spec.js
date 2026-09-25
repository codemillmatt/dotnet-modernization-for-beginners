import { test, expect } from "@playwright/test";

const pages = [
  ["Legacy sample quickstart", "shared-legacy-app/README.md", "workbench"],
  ["Completed reference", "examples/modernized/README.md", "2050s"],
  ["Previous BookCatalog sample run", "examples/assessments/bookcatalog/README.md", "1950s"],
  ["Instructor companion", "docs/instructor-guide.md", "briefing"]
];

for (const base of ["/workshop/", "http://127.0.0.1:4193/"]) {
  test(`Samples and help links open themed references at ${base}`, async ({ page }) => {
    for (const [label, path, era] of pages) {
      await page.goto(`${base}#/overview`);
      await expect(page.locator("#article")).not.toHaveAttribute("aria-busy", "true");
      await page.locator("#article").getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(encodeURIComponent(path)));
      await expect(page.locator("#article")).not.toHaveAttribute("aria-busy", "true");
      await expect(page.locator("html")).toHaveAttribute("data-era", era);
      await expect(page.locator(".era-intro h1")).toBeVisible();
      await expect(page.locator("[data-complete]")).toHaveCount(0);
      await expect(page.getByRole("alert")).toHaveCount(0);
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const theme of ["light", "dark"]) {
          await page.goto(`${base}?clawpilotTheme=${theme}#/reference?path=${encodeURIComponent(path)}`);
          await expect(page.locator(".era-intro h1")).toBeVisible();
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          const art = page.locator(".era-art:visible");
          await expect(art).toHaveCount(1);
          await expect.poll(() => art.evaluate(image => image.complete && image.naturalWidth > 0)).toBeTruthy();
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
          const contrast = await page.evaluate(() => {
            const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number)
              .map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4)
              .reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
            return [".era-intro h1", "#article > p", "#article a[href]", "#article th"].flatMap(selector => {
              const element = document.querySelector(selector);
              if (!element) return [];
              let background = element;
              while (getComputedStyle(background).backgroundColor === "rgba(0, 0, 0, 0)") background = background.parentElement;
              const a = luminance(getComputedStyle(element).color);
              const b = luminance(getComputedStyle(background).backgroundColor);
              return [{ selector, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) }];
            });
          });
          for (const item of contrast) expect(item.ratio, item.selector).toBeGreaterThanOrEqual(4.5);
          await expect(page.locator("#course-progress")).toHaveText("0 of 7 required steps complete");
        }
      }
    }
  });
}
