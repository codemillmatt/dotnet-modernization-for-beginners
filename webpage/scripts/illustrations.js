export const illustrations = [
  {
    id: "journey", document: "README.md", era: "1960s",
    title: "One app, a new foundation",
    caption: "Follow the required route through Azure planning. Deployment is a separate, optional trip.",
    description: "Start with a working baseline, then assess, plan, upgrade and check, and prepare an Azure plan. Optional deployment and cleanup follow only with cost approval."
  },
  {
    id: "workflow", document: "00-introduction/README.md", era: "1970s",
    title: "Inspect, decide, change, review",
    caption: "The agent changes the application. You compare the evidence.",
    description: "Assess source and risks. Plan changes and checks. Execute the application changes. Review the evidence yourself. If a requirement was missed, return to the plan and correct it."
  },
  {
    id: "investigation", document: "01-assessment/README.md", era: "1980s",
    title: "Follow the evidence",
    caption: "Turn a finding into an action with a check you can explain.",
    description: "Start with a finding. Inspect its source. Identify the affected behavior. Choose an action. Define a check for that action. The finding alone does not prove what the application needs."
  },
  {
    id: "plan", document: "02-planning/README.md", era: "1990s",
    title: "A plan you can check",
    caption: "Connect each requirement to a decision and a runnable check.",
    description: "For the requirement to preserve stored values, choose the data approach and define a check that compares the selected records. Organize the work into runnable groups. Review the evidence at each boundary before continuing."
  },
  {
    id: "architecture", document: "03-upgrade-execution/README.md", era: "2000s-2010s",
    title: "Inside the upgraded application",
    caption: "Follow the request to the database and the rendered response back to the browser.",
    description: "The browser sends a request to BooksController. The controller uses the injected ApplicationDbContext, which executes operations against BookCatalogModernizedLab. The controller selects a Razor view. The view renders the response for the browser."
  },
  {
    id: "azure", document: "04-cloud/README.md", era: "2020s",
    title: "A proposed home in Azure",
    caption: "Separate runtime access from administrator setup. This picture is a plan, not a deployed environment.",
    description: "A public sample user reaches BookCatalog on App Service. The app reads its connection setting from Key Vault and accesses Books in Azure SQL. Its runtime managed identity authorizes both operations. An approved administrator handles schema setup and selected-record copying separately. Use disposable sample data only; the sample has no application-user authentication."
  }
];

export function illustrationPath(id, mode) {
  if (!illustrations.some(item => item.id === id)) throw new Error(`Unknown illustration: ${id}`);
  if (!["light", "dark"].includes(mode)) throw new Error(`Unknown color mode: ${mode}`);
  return `docs/illustrations/${id}-${mode}.svg`;
}
