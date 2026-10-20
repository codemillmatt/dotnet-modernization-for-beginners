// Seasonal look for the course site. This is the only file to edit to switch seasons.
//   active: "auto" follows the calendar, or pin a pack such as "classic" or "halloween".
//   calendar: month-day windows (inclusive, visitor's local date); windows may wrap the new year.
// Preview any pack with ?season=<id> in the URL.
(function (global) {
  const seasonConfig = {
    active: "auto",
    fallback: "classic",
    packs: ["classic", "halloween"],
    calendar: [
      { season: "halloween", from: "10-01", to: "11-02" }
    ]
  };

  const monthDay = date => `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const inWindow = (day, { from, to }) => from <= to ? day >= from && day <= to : day >= from || day <= to;

  function resolveSeason({ date = new Date(), requested = null, config = seasonConfig } = {}) {
    if (requested && config.packs.includes(requested)) return requested;
    if (config.active !== "auto") return config.packs.includes(config.active) ? config.active : config.fallback;
    const day = monthDay(date);
    const match = config.calendar.find(window => config.packs.includes(window.season) && inWindow(day, window));
    return match ? match.season : config.fallback;
  }

  global.courseSeasons = { seasonConfig, resolveSeason };

  if (typeof document === "undefined") return;
  const requested = new URLSearchParams(location.search).get("season");
  const season = resolveSeason({ requested });
  const root = document.documentElement;
  root.dataset.season = season;
  document.getElementById("season-stylesheet")?.setAttribute("href", `seasons/${season}/season.css`);
  document.querySelector('link[rel="icon"]')?.setAttribute("href", `seasons/${season}/assets/favicon.svg`);
})(globalThis);
