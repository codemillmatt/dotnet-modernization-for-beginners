// Halloween: every stop is a different friendly-spooky scene. Era IDs stay shared with classic.
function palette(paper, surface, soft, accent, a, b, c, dark = false) {
  return {
    paper, surface, soft, accent, a, b, c,
    ink: dark ? "#fff5e8" : "#291d30",
    muted: dark ? "#d9cbde" : "#62506a",
    line: dark ? "#9b86a8" : "#99849d",
    accentText: dark ? "#21172a" : "#ffffff",
    selected: accent, selectedText: dark ? "#21172a" : "#ffffff"
  };
}

const eras = {
  "1960s": {
    label: "Pumpkin patch", scene: "pumpkin-patch", art: "halloween-pumpkin-patch-light.svg", artDark: "halloween-pumpkin-patch-dark.svg",
    heading: 'Georgia, "Times New Roman", serif', interface: '"Trebuchet MS", Verdana, sans-serif', radius: "30px", control: "12px",
    light: palette("#f8dfbc", "#fff9ed", "#f7e7cc", "#97400d", "#7a8c40", "#db7029", "#edb947"),
    dark: palette("#241827", "#302231", "#403046", "#ffba77", "#a1b96d", "#ed985b", "#f4ce79", true)
  },
  "1970s": {
    label: "Haunted library", scene: "haunted-library", art: "halloween-haunted-library-light.svg", artDark: "halloween-haunted-library-dark.svg",
    heading: 'Georgia, "Palatino Linotype", serif', interface: 'Georgia, "Times New Roman", serif', radius: "4px", control: "4px",
    light: palette("#e4d9b8", "#fcf6e5", "#eee5ca", "#526033", "#81935b", "#ae714b", "#cfad68"),
    dark: palette("#1b2620", "#253229", "#324139", "#d0d994", "#97b87b", "#d9a276", "#d9c18a", true)
  },
  soundcheck: {
    label: "Trick-or-treat porch", scene: "trick-or-treat", art: "halloween-trick-or-treat-light.svg", artDark: "halloween-trick-or-treat-dark.svg",
    heading: 'Georgia, "Times New Roman", serif', interface: '"Trebuchet MS", Verdana, sans-serif', radius: "20px", control: "18px",
    light: palette("#f8e2ed", "#fff8fc", "#f3dfed", "#873665", "#b188c6", "#d76d33", "#eac36a"),
    dark: palette("#331d37", "#402643", "#503250", "#f5b8df", "#bf9dd9", "#f0a16d", "#edcd84", true)
  },
  "1980s": {
    label: "Ghost detective bureau", scene: "ghost-bureau", art: "halloween-ghost-bureau-light.svg", artDark: "halloween-ghost-bureau-dark.svg",
    heading: '"Courier New", Consolas, monospace', interface: 'Verdana, Tahoma, sans-serif', radius: "2px", control: "2px",
    light: palette("#dce9e9", "#f6fcfa", "#e4f0ed", "#306364", "#72aaa4", "#ad7653", "#e7c977"),
    dark: palette("#142a2e", "#20373b", "#2c474c", "#a0e0d7", "#7db9b9", "#e4ad80", "#edcd8f", true)
  },
  "1990s": {
    label: "Witch's spellbook", scene: "spellbook", art: "halloween-spellbook-light.svg", artDark: "halloween-spellbook-dark.svg",
    heading: 'Georgia, "Times New Roman", serif', interface: '"Palatino Linotype", Georgia, serif', radius: "8px", control: "6px",
    light: palette("#e6dcf0", "#fcf8ff", "#eee5f7", "#69408c", "#ac8dc7", "#bf805d", "#c9ba72"),
    dark: palette("#281b3c", "#342449", "#45315c", "#dac0fa", "#b09bdb", "#e6a784", "#dbcd8b", true)
  },
  "2000s-2010s": {
    label: "Monster laboratory", scene: "monster-lab", art: "halloween-monster-lab-light.svg", artDark: "halloween-monster-lab-dark.svg",
    heading: '"Trebuchet MS", Verdana, sans-serif', interface: '"Trebuchet MS", Verdana, sans-serif', radius: "16px", control: "8px",
    light: palette("#e0edc8", "#f9fdeb", "#eaf2d7", "#426124", "#96b45b", "#a581b4", "#dcad60"),
    dark: palette("#1e291c", "#293523", "#39492e", "#c9e98a", "#a2c570", "#c7a5db", "#e7c37f", true)
  },
  "2020s": {
    label: "Moonlit sky", scene: "moonlit-sky", art: "halloween-moonlit-sky-light.svg", artDark: "halloween-moonlit-sky-dark.svg",
    heading: 'Georgia, "Times New Roman", serif', interface: '"Segoe UI", Arial, sans-serif', radius: "32px", control: "24px",
    light: palette("#dfe3f7", "#f9faff", "#e9ebfa", "#4d528e", "#8d9dce", "#b187b8", "#e3c17e"),
    dark: palette("#191c39", "#242846", "#333856", "#c8ceff", "#99aadf", "#d0a5d7", "#f2d69e", true)
  },
  workbench: {
    label: "Pumpkin shed", scene: "pumpkin-shed", art: "halloween-pumpkin-shed-light.svg", artDark: "halloween-pumpkin-shed-dark.svg",
    heading: '"Courier New", Consolas, monospace', interface: 'Verdana, Tahoma, sans-serif', radius: "0px", control: "2px",
    light: palette("#ead5b8", "#fff5e5", "#f1e2cc", "#835124", "#899c56", "#cc783b", "#d5b66e"),
    dark: palette("#2c251b", "#383024", "#4b3e2e", "#efc68e", "#b2c57e", "#e9a168", "#e0c187", true)
  },
  briefing: {
    label: "Raven's lookout", scene: "raven-lookout", art: "halloween-raven-lookout-light.svg", artDark: "halloween-raven-lookout-dark.svg",
    heading: '"Trebuchet MS", Verdana, sans-serif', interface: '"Trebuchet MS", Verdana, sans-serif', radius: "6px", control: "6px",
    light: palette("#e0e4e9", "#f8fafc", "#e9edf2", "#4c526d", "#8a99b0", "#b28c62", "#d5ba82"),
    dark: palette("#1e2432", "#2b3242", "#3a4355", "#c6d5f2", "#9baec7", "#dab18a", "#e0cb99", true)
  },
  "1950s": {
    label: "Ghost story scrapbook", scene: "ghost-scrapbook", art: "halloween-ghost-scrapbook-light.svg", artDark: "halloween-ghost-scrapbook-dark.svg",
    heading: 'Georgia, "Times New Roman", serif', interface: '"Trebuchet MS", Verdana, sans-serif', radius: "2px", control: "3px",
    light: palette("#efdcce", "#fff7f0", "#f3e4da", "#8a4746", "#b69684", "#c17f56", "#d2b66e"),
    dark: palette("#302025", "#3f2a30", "#50373e", "#f4bfac", "#c7a496", "#e6a87e", "#e0c18b", true)
  },
  "2050s": {
    label: "Enchanted conservatory", scene: "enchanted-garden", art: "halloween-enchanted-garden-light.svg", artDark: "halloween-enchanted-garden-dark.svg",
    heading: 'Georgia, "Times New Roman", serif', interface: '"Trebuchet MS", Verdana, sans-serif', radius: "40px", control: "10px",
    light: palette("#dceadd", "#f6fcf3", "#e5f0df", "#3b6751", "#87ac88", "#b383af", "#d5ba74"),
    dark: palette("#152b27", "#213b32", "#2f4d40", "#b6e4bc", "#8dc9aa", "#d0a1d2", "#e2cc8f", true)
  }
};
export default {
  id: "halloween",
  name: "Halloween",
  eras,
  hero: { art: "halloween-pumpkin-patch-light.svg", artDark: "halloween-pumpkin-patch-dark.svg", caption: "A little spooky. A new foundation." },
  sceneLabels: true,
  illustrations: true,
  illustrationText: {
    soundcheck: {
      title: "Trick-or-treat: get ready",
      description: "Three trick-or-treat tickets show the setup sequence: check your installed tools and Copilot access, open the BookCatalog solution in your learner copy, then run the app and try adding and editing a sample book. If your tools are ready, go straight to running BookCatalog."
    }
  },
  copy: {
    tagline: "A Halloween learning adventure",
    navDescription: "Seven stops. No scary surprises.",
    footer: "Friendly ghosts. Fresh starts.",
    sampleKicker: "Sample notes",
    futureKicker: "After the upgrade"
  }
};
