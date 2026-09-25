import { rename } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";

export async function publishSite(stage, output, {
  platform = process.platform, move = rename, wait = setTimeout, warn = console.warn
} = {}) {
  // Windows can briefly retain the removed output directory while readers release it.
  for (let attempt = 0; ; attempt++) {
    try {
      await move(stage, output);
      return;
    } catch (error) {
      if (platform !== "win32" || !["EPERM", "EACCES", "EBUSY"].includes(error.code) || attempt >= 4) throw error;
      warn(`Windows could not rename the site output (${error.code}); retrying (${attempt + 1}/4).`);
      await wait(250 * (attempt + 1));
    }
  }
}
