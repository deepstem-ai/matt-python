/* ==========================================================================
   DeepDistrict.si — site content
   --------------------------------------------------------------------------
   Plain JS (not JSON) so the site works when opened straight from disk
   (file://), where browsers block fetch(). When a backend or CMS exists,
   replace this file with an API call that returns the same shape.
   All figures below are concept targets: review before publishing.
   ========================================================================== */

window.DD_CONTENT = {
  stats: [
    { value: 9, suffix: "", label: "Research programs in formation" },
    { value: 6, suffix: "", label: "Regional nodes across Slovenia" },
    { value: 2500, suffix: "+", label: "Academy seats targeted by 2030" },
    { value: 100, suffix: "%", label: "Commitment to open science" }
  ],

  // Research programs. category drives the filter tabs on research.html.
  programs: [
    { id: "SI-01", icon: "core", category: "foundations", title: "SI Reasoning Core", text: "Systems that plan, verify and explain their own reasoning across many steps, measured on open, reproducible benchmarks.", meta: "Foundations · Ljubljana" },
    { id: "SI-02", icon: "network", category: "foundations", title: "Language Intelligence", text: "Models fluent in Slovenian and the languages of the region, built so that smaller languages are first-class in the age of SI.", meta: "Foundations · Maribor" },
    { id: "SI-03", icon: "shield", category: "foundations", title: "Safety & Alignment", text: "Interpretability, evaluation and governance methods that keep SI understandable, auditable and under human control.", meta: "Foundations · Ljubljana" },
    { id: "SI-04", icon: "health", category: "society", title: "SI for Health", text: "Earlier diagnosis, personalised care pathways and faster clinical research, built privacy-first.", meta: "Society · Ljubljana / Maribor" },
    { id: "SI-05", icon: "leaf", category: "society", title: "Alpine Climate Twin", text: "A digital twin of the Alps, the Karst and the coast that models water, forests, snow and extreme weather.", meta: "Society · Kranj" },
    { id: "SI-06", icon: "academy", category: "society", title: "SI in Education", text: "Personal tutors and teacher co-pilots that support, not replace, great teaching.", meta: "Society · Novo mesto" },
    { id: "SI-07", icon: "lab", category: "industry", title: "Industry 5.0 Lab", text: "Autonomous design, quality control and human-centred robotics for manufacturers and their suppliers.", meta: "Industry · Celje / Novo mesto" },
    { id: "SI-08", icon: "network", category: "industry", title: "Blue Economy & Logistics", text: "Port, maritime and supply-chain optimisation with SI agents on the Adriatic coast.", meta: "Industry · Koper" },
    { id: "SI-09", icon: "core", category: "industry", title: "Cross-Border Innovation", text: "Joint labs with neighbouring regions and international partners on energy, mobility and public services.", meta: "Industry · Nova Gorica" }
  ],

  // Milestones shown on the home page. status: live | next | planned
  milestones: [
    { date: "2026 Q4", name: "DeepDistrict opens", text: "The hub launches online with the founding charter, first research calls and Academy pre-registration.", status: "live" },
    { date: "2027 Q1", name: "Academy Cohort 01", text: "120 fellows across six nodes, with places reserved for international and remote participants.", status: "next" },
    { date: "2027 Q3", name: "Shared SI compute", text: "A research compute cluster open to member universities, Academy fellows and startups.", status: "planned" },
    { date: "2028 Q2", name: "Open language model v1", text: "An open-weight model fluent in Slovenian, released with full safety evaluations.", status: "planned" },
    { date: "2029", name: "Alpine Climate Twin", text: "Live public dashboards for water, snow and forest risk.", status: "planned" },
    { date: "2030", name: "District complete", text: "Six connected nodes with labs, the Academy and a venture studio, linked to partners worldwide.", status: "planned" }
  ],

  nodes: [
    { city: "Ljubljana", role: "Headquarters · Reasoning, Safety, Health", status: "live" },
    { city: "Maribor", role: "Language Intelligence · Health", status: "next" },
    { city: "Koper", role: "Blue Economy · Logistics", status: "next" },
    { city: "Kranj", role: "Alpine Climate Twin", status: "planned" },
    { city: "Nova Gorica", role: "Cross-Border Innovation", status: "planned" },
    { city: "Novo mesto", role: "Industry 5.0 · Education", status: "planned" }
  ],

  roadmap: [
    { year: "2026", title: "Foundation", text: "The concept, website, founding charter and first partner conversations.", done: true },
    { year: "2027", title: "Academy & compute", text: "First Academy cohort, a shared compute cluster and the first nine research programs.", done: false },
    { year: "2028", title: "Open models", text: "An open Slovenian language model, published evaluations and the first spin-out companies.", done: false },
    { year: "2030", title: "District complete", text: "Six connected regional nodes, 2,500 Academy seats, a venture studio and a global partner network.", done: false },
    { year: "2035", title: "SI for society", text: "SI systems that measurably speed up science, healthcare and climate resilience, developed openly and safely.", done: false }
  ],

  ticker: [
    "<b>Now</b>DeepDistrict.si launches, 2026",
    "<b>Open</b>Academy Cohort 01 pre-registration",
    "<b>Research</b>9 programs in formation",
    "<b>Nodes</b>Ljubljana · Maribor · Koper · Kranj · Nova Gorica · Novo mesto",
    "<b>Global</b>International and remote fellows welcome",
    "<b>Principle</b>Open science, human oversight"
  ]
};
