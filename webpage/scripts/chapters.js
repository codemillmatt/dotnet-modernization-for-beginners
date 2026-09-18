export const chapters = [
  { slug: "overview", number: "Start", title: "Course overview", path: "README.md", core: false, era: "1960s" },
  { slug: "00-introduction", number: "00", title: "Get ready", path: "00-introduction/README.md", core: true, era: "1970s", exerciseRevision: 2 },
  { slug: "01-assessment", number: "01", title: "Assess the app", path: "01-assessment/README.md", core: true, era: "1980s", exerciseRevision: 2 },
  { slug: "02-planning", number: "02", title: "Choose the plan", path: "02-planning/README.md", core: true, era: "1990s", exerciseRevision: 2 },
  { slug: "03-upgrade-execution", number: "03", title: "Upgrade & check", path: "03-upgrade-execution/README.md", core: true, era: "2000s-2010s", exerciseRevision: 2 },
  { slug: "04-cloud", number: "04", title: "Plan for Azure", path: "04-cloud/README.md", core: true, era: "2020s", exerciseRevision: 2 }
];

export const references = [
  { path: "shared-legacy-app/README.md", title: "Legacy sample" },
  { path: "examples/modernized/README.md", title: "Completed reference" },
  { path: "examples/azure/README.md", title: "Azure helper" },
  { path: "examples/assessments/README.md", title: "Recorded assessment" },
  { path: "00-introduction/code/README.md", title: "Optional console sample" },
  { path: "docs/learner-record.md", title: "Learner record" },
  { path: "04-cloud/deployment.md", title: "Optional Azure deployment" },
  { path: "tools/BookCatalog.Data/README.md", title: "Selected-record helper" },
  { path: "docs/instructor-guide.md", title: "Optional instructor guide" },
  { path: "docs/validation.md", title: "Maintainer validation" },
  { path: "docs/writing.md", title: "Writing guide" },
  { path: "webpage/README.md", title: "Website guide" }
];

export const sectionAliases = {
  "overview": { "course-structure": "course-structure", "getting-started": "work-on-your-own-copy" },
  "00-introduction": {
    "chapter-00-introduction-to-modernization": "chapter-00-get-ready-to-modernize",
    "prerequisites": "check-before-installing",
    "your-first-assessment": "optional-your-first-assessment",
    "checkpoint-can-you-explain-the-starting-state": "checkpoint-what-would-a-build-miss"
  },
  "01-assessment": {
    "chapter-01-assessment": "chapter-01-assess-bookcatalog",
    "running-the-assessment": "ask-for-an-assessment",
    "reading-the-compatibility-report": "read-the-report-in-a-useful-order",
    "what-the-report-means-for-your-timeline": "what-the-numbers-do-not-prove",
    "troubleshooting": "if-the-assessment-differs-or-fails"
  },
  "02-planning": {
    "chapter-02-planning": "chapter-02-choose-the-upgrade-plan",
    "generating-the-upgrade-plan": "ask-for-the-plan",
    "5-task-breakdown": "define-runnable-groups"
  },
  "03-upgrade-execution": {
    "chapter-03-upgrade-execution": "chapter-03-upgrade-and-check-the-application",
    "approving-the-plan": "authorize-one-execution-group",
    "troubleshooting": "recover-without-discarding-your-work"
  },
  "04-cloud": {
    "chapter-04-going-to-the-cloud": "chapter-04-prepare-for-azure",
    "cleaning-up": "delete-the-dedicated-lab-group",
    "verifying-the-live-app": "publish-your-learner-application",
    "prerequisites": "check-tools-access-and-costs-first"
  }
};
