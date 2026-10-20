import { test as base, expect } from "@playwright/test";

// Seasons follow the calendar, so pin every page to a date outside all seasonal windows.
export const outOfSeason = new Date("2026-06-15T12:00:00");

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(outOfSeason);
    await use(page);
  }
});

export { expect };
