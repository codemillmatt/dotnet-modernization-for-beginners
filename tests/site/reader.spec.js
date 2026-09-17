import { test, expect } from "@playwright/test";
import { chapters, references, sectionAliases } from "../../webpage/scripts/chapters.js";

async function open(page, route = "#/overview") {
  await page.goto(route);
  await expect(page.locator("#article")).not.toHaveAttribute("aria-busy", "true");
  await expect(page.locator("#article h1")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
}

test("all chapters, references, diagrams, and original section links work", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const chapter of chapters) {
    await open(page, `#/${chapter.slug}`);
    await expect(page).toHaveTitle(new RegExp(chapter.title.replace("&", "&")));
    await expect(page.locator("code.language-mermaid")).toHaveCount(0);
    const broken = await page.locator("#article a[href*='?section=']").evaluateAll(links =>
      links.filter(link => {
        const url = new URL(link.href);
        const params = new URLSearchParams(url.hash.split("?")[1]);
        return url.hash.split("?")[0] === location.hash.split("?")[0] && !document.getElementById(params.get("section"));
      }).map(link => link.href));
    expect(broken).toEqual([]);
    for (const [alias, target] of Object.entries(sectionAliases[chapter.slug] || {})) {
      await expect(page.locator(`[id="${alias}"]`)).toBeAttached();
      await expect(page.locator(`[id="${target}"]`)).toBeAttached();
    }
    for (const image of await page.locator(".diagram-asset img").all()) {
      const response = await page.request.get(await image.getAttribute("src"));
      expect(response.ok()).toBeTruthy();
    }
  }
  for (const reference of references) await open(page, `#/reference?path=${encodeURIComponent(reference.path)}`);
  await open(page, "#/overview?section=-prerequisites");
  await expect(page.locator("#-prerequisites")).toBeAttached();
  await open(page, "#/00-introduction?section=-your-first-assessment");
  await expect(page.locator("#-your-first-assessment")).toBeAttached();
  expect(errors).toEqual([]);
});

test("keyboard skip stays in the selected lesson", async ({ page }) => {
  await open(page, "#/01-assessment");
  await page.locator(".skip-link").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/01-assessment$/);
  await expect(page.locator("#main-content")).toBeFocused();
});

test("code copy preserves the displayed code and reports clipboard failure", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, "#/04-cloud");
  const expected = await page.locator("pre code").first().textContent();
  await page.getByRole("button", { name: "Copy code", exact: true }).first().click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
  await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
  await page.evaluate(() => Object.defineProperty(navigator.clipboard, "writeText", {
    configurable: true, value: () => Promise.reject(new Error("blocked"))
  }));
  await page.getByRole("button", { name: "Copy code", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "Copy failed", exact: true })).toBeVisible();
  await expect(page.locator("#copy-notice")).toContainText("manually");
});

test("core completion excludes Azure and survives a reload", async ({ page }) => {
  for (const chapter of chapters.filter(item => item.core)) {
    await open(page, `#/${chapter.slug}`);
    await page.getByRole("button", { name: "I completed the checks" }).click();
  }
  await page.reload();
  await expect(page.locator("#course-progress")).toHaveText("4 of 4 core chapters complete");
  await expect(page.locator("#resume-link")).toHaveAttribute("href", "#/03-upgrade-execution");
  await open(page, "#/04-cloud");
  await expect(page.getByRole("button", { name: "I completed the checks" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#course-progress")).toHaveText("4 of 4 core chapters complete");
});

test("migration and reset preserve unrelated storage", async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("fixture-started")) {
      localStorage.setItem("dotnet-modernization-course-progress", '["01-assessment"]');
      localStorage.setItem("unrelated-app", "keep");
      localStorage.setItem("fixture-started", "true");
    }
  });
  await open(page, "#/01-assessment");
  await expect(page.locator("#course-progress")).toHaveText("0 of 4 core chapters complete");
  await expect(page.locator("#storage-notice")).toContainText("previous reading");
  await page.getByRole("button", { name: "I completed the checks" }).click();
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("button", { name: "Reset progress" }).click();
  await expect(page.locator("#course-progress")).toContainText("1 of 4");
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Reset progress" }).click();
  await expect(page.locator("#course-progress")).toContainText("0 of 4");
  expect(await page.evaluate(() => localStorage.getItem("unrelated-app"))).toBe("keep");
  expect(await page.evaluate(() => localStorage.getItem("dotnet-modernization-course-progress"))).toBe('["01-assessment"]');
});

test("blocked storage leaves a clear notice and usable completion", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
  });
  await open(page, "#/01-assessment");
  await page.getByRole("button", { name: "I completed the checks" }).click();
  await expect(page.locator("#storage-notice")).toContainText("this visit only");
  await expect(page.locator("#course-progress")).toContainText("1 of 4");
});

test("failed lesson fetch shows a retry without a false completion", async ({ page }) => {
  await page.route("**/content/01-assessment/README.md", route => route.fulfill({ status: 503, body: "Unavailable" }));
  await page.goto("#/01-assessment");
  await expect(page.getByRole("alert")).toContainText("HTTP 503");
  await expect(page.locator("[data-complete]")).toHaveCount(0);
  await page.unroute("**/content/01-assessment/README.md");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator("#article h1")).toHaveText("Chapter 01: Assess BookCatalog");
});

test("mobile drawers trap focus and restore it on Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await expect(page.locator("#course-nav")).toHaveJSProperty("inert", true);
  await page.getByRole("button", { name: "Chapters", exact: true }).click();
  await expect(page.locator("#course-nav")).toHaveJSProperty("inert", false);
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#course-nav a").last()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Chapters", exact: true })).toBeFocused();
  await expect(page.locator("#course-nav")).toHaveJSProperty("inert", true);
  await page.getByRole("button", { name: "On this page", exact: true }).click();
  await expect(page.locator("#page-outline")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "On this page", exact: true })).toBeFocused();
});

test("theme choice persists and supports old theme links", async ({ page }) => {
  await open(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await open(page, "?clawpilotTheme=light#/overview");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("local assets, layout, contrast, and code remain usable", async ({ page }) => {
  const remote = [];
  page.on("request", request => {
    if (!request.url().startsWith("http://127.0.0.1:4189/")) remote.push(request.url());
  });
  for (const theme of ["light", "dark"]) {
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await open(page, `?clawpilotTheme=${theme}#/04-cloud`);
      const layout = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth, viewport: innerWidth,
        codes: [...document.querySelectorAll("pre")].map(element => ({
          width: element.getBoundingClientRect().width, scroll: getComputedStyle(element).overflowX
        }))
      }));
      expect(layout.document).toBeLessThanOrEqual(layout.viewport + 1);
      expect(layout.codes.every(code => code.width <= width && code.scroll === "auto")).toBeTruthy();
      const ratio = await page.evaluate(() => {
        const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number).map(n => n / 255);
        const lum = color => rgb(color).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4)
          .reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
        const text = getComputedStyle(document.querySelector("#article p"));
        const background = getComputedStyle(document.querySelector("#main-content"));
        const a = lum(text.color), b = lum(background.backgroundColor);
        return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      });
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  const download = await page.request.get("downloads/samples.zip");
  expect(download.ok()).toBeTruthy();
  expect((await download.body()).subarray(0, 2).toString()).toBe("PK");
  expect(remote).toEqual([]);
});
