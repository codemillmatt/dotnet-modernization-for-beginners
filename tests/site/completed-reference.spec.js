import { test, expect } from "@playwright/test";
import { eraPalette } from "../../webpage/scripts/eras.js";

const route = "#/reference?path=examples%2Fmodernized%2FREADME.md";

for (const [hosting, base] of [["subpath", "/workshop/"], ["root", "http://127.0.0.1:4193/"]]) {
  for (const mode of ["light", "dark"]) {
    test(`completed reference ${hosting} ${mode}: future theme, readable guide, and stable progress`, async ({ page }) => {
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(`${base}?clawpilotTheme=${mode}#/02-planning`);
      await expect(page.locator("#article")).not.toHaveAttribute("aria-busy", "true");
      await page.getByRole("button", { name: "Mark step complete", exact: true }).click();
      await page.goto(`${base}?clawpilotTheme=${mode}${route}`);
      await expect(page.locator("#article h1")).toHaveText("Completed BookCatalog reference");
      await expect(page.locator("html")).toHaveAttribute("data-era", "2050s");
      await expect(page.locator("html")).toHaveAttribute("data-theme", mode);
      expect(await page.locator("html").evaluate(element => element.style.getPropertyValue("--paper")))
        .toBe(eraPalette("2050s", mode).paper);
      await expect(page.locator(".future-kicker")).toHaveText("2050s / After the upgrade");
      await expect(page.locator(".future-stack")).toContainText(".NET 10");
      await expect(page.locator("#article > p").first()).toContainText("You'll run a completed .NET 10 application");
      await expect(page.locator("#article")).toContainText("Docker");
      await expect(page.locator("#article pre").filter({ hasText: "dotnet test" })).toHaveCount(0);
      await expect(page.locator("[data-complete]")).toHaveCount(0);
      await expect(page.locator("#course-progress")).toHaveText("1 of 6 required steps complete");
      await expect(page.locator("#resume-link")).toHaveAttribute("href", "#/02-planning");
      const art = page.locator(".future-intro .era-art");
      await expect(art).toHaveAttribute("src", /\/assets\/era-2050s.svg$/);
      await expect.poll(() => art.evaluate(image => image.complete && image.naturalWidth > 0)).toBeTruthy();

      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        await expect(art).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
        const contrast = await page.evaluate(() => {
          const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number)
            .map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4)
            .reduce((total, n, i) => total + n * [.2126, .7152, .0722][i], 0);
          return [".future-intro h1", ".future-caption", ".future-kicker", "#article > p", "#article pre code"]
            .map(selector => {
              const element = document.querySelector(selector);
              let ancestor = element;
              while (ancestor && getComputedStyle(ancestor).backgroundColor === "rgba(0, 0, 0, 0)") {
                ancestor = ancestor.parentElement;
              }
              const a = luminance(getComputedStyle(element).color);
              const b = luminance(getComputedStyle(ancestor).backgroundColor);
              return { selector, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
            });
        });
        for (const item of contrast) expect(item.ratio, item.selector).toBeGreaterThanOrEqual(4.5);
      }
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
      await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.getByRole("button", { name: `Use ${mode === "light" ? "dark" : "light"} theme` }).click();
      await expect(page.locator("html")).toHaveAttribute("data-era", "2050s");
      await page.reload();
      await expect(page.locator(".future-intro")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-era", "2050s");
      await page.locator("#resume-link").click();
      await expect(page.locator("html")).toHaveAttribute("data-era", "1990s");
      await expect(page.locator(".future-intro")).toHaveCount(0);
      await page.goto(`${base}#/reference?path=shared-legacy-app%2FREADME.md`);
      await expect(page.locator("html")).toHaveAttribute("data-era", "2020s");
      await expect(page.locator(".future-intro")).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  }
}

test("completed reference retains its future theme when content fails", async ({ page }) => {
  await page.route("**/content/examples/modernized/README.md", route => route.fulfill({ status: 503, body: "Unavailable" }));
  await page.goto(route);
  await expect(page.getByRole("alert")).toContainText("HTTP 503");
  await expect(page.locator("html")).toHaveAttribute("data-era", "2050s");
  await page.unroute("**/content/examples/modernized/README.md");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator(".future-intro")).toBeVisible();
});
