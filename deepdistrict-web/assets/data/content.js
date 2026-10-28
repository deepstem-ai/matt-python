/* ==========================================================================
   DeepDistrict.si — site content
   --------------------------------------------------------------------------
   Plain JS (not JSON) so the site works when opened straight from disk
   (file://), where browsers block fetch(). When a backend or CMS exists,
   replace this file with an API call that returns the same shape.
   ========================================================================== */

window.DD_CONTENT = {
  stats: [
    { value: 6, suffix: "", label: "Regional SI nodes" },
    { value: 9, suffix: "", label: "Research programs" },
    { value: 2500, suffix: "+", label: "Academy seats by 2030" },
    { value: 100, suffix: "%", label: "Open-science commitment" }
  ],

  // Research programs. category drives the filter tabs on research.html.
  programs: [
    { id: "SI-01", icon: "core", category: "foundations", title: "SI Reasoning Core", text: "Systems that plan, verify and explain their own reasoning across many steps, measured on open, reproducible benchmarks.", meta: "Foundations · Ljubljana" },
    { id: "SI-02", icon: "network", category: "foundations", title: "Slovenian Language Intelligence", text: "Models that speak Slovenian natively, including dialects, and translate across the region's languages.", meta: "Foundations · Maribor" },
    { id: "SI-03", icon: "shield", category: "foundations", title: "Safety & Alignment", text: "Interpretability, evaluation and governance methods so that SI stays understandable, auditable and under human control.", meta: "Foundations · Ljubljana" },
    { id: "SI-04", icon: "health", category: "society", title: "SI for Health", text: "Earlier diagnosis, personalised care pathways and faster clinical research, built privacy-first.", meta: "Society · Ljubljana / Maribor" },
    { id: "SI-05", icon: "leaf", category: "society", title: "Alpine Climate Twin", text: "A digital twin of the Alps, the Karst and the coast to model water, forests, snow and extreme weather.", meta: "Society · Kranj" },
    { id: "SI-06", icon: "academy", category: "society", title: "SI in Education", text: "Personal tutors and teacher co-pilots aligned with the national curriculum.", meta: "Society · Novo mesto" },
    { id: "SI-07", icon: "lab", category: "industry", title: "Industry 5.0 Lab", text: "Autonomous design, quality control and robotics for regional manufacturers and suppliers.", meta: "Industry · Celje / Novo mesto" },
    { id: "SI-08", icon: "rocket", category: "industry", title: "Blue Economy & Logistics", text: "Port, maritime and supply-chain optimisation with SI agents on the Adriatic coast.", meta: "Industry · Koper" },
    { id: "SI-09", icon: "network", category: "industry", title: "Cross-Border Innovation", text: "Joint labs with neighbouring regions on energy, mobility and public services.", meta: "Industry · Nova Gorica" }
  ],

  // Mission manifest shown on the home page. status: live | next | planned
  missions: [
    { date: "2026 Q4", name: "District Launch", text: "DeepDistrict.si opens as an online hub with its first research calls and Academy pilot.", status: "live" },
    { date: "2027 Q1", name: "Academy Cohort 01", text: "First 120 fellows across six regional nodes. Tracks for school, university and industry.", status: "next" },
    { date: "2027 Q3", name: "SI Compute Pod", text: "A shared research compute cluster, open to member universities and startups.", status: "planned" },
    { date: "2028 Q2", name: "Slovenian SI Model v1", text: "An open-weight model fluent in Slovenian, released with safety evaluations.", status: "planned" },
    { date: "2029", name: "Alpine Climate Twin", text: "A live digital twin for water, snow and forest risk, with public dashboards.", status: "planned" },
    { date: "2030", name: "SI District Complete", text: "A connected campus network of labs, Academy and venture studio in every region.", status: "planned" }
  ],

  nodes: [
    { city: "Ljubljana", role: "HQ · SI Reasoning, Safety, Health", status: "live" },
    { city: "Maribor", role: "Language Intelligence · Health", status: "next" },
    { city: "Koper", role: "Blue Economy · Logistics", status: "next" },
    { city: "Kranj", role: "Alpine Climate Twin", status: "planned" },
    { city: "Nova Gorica", role: "Cross-Border Innovation", status: "planned" },
    { city: "Novo mesto", role: "Industry 5.0 · Education", status: "planned" }
  ],

  roadmap: [
    { year: "2026", title: "Ignition", text: "The concept, website, founding charter and first partner conversations.", done: true },
    { year: "2027", title: "Academy & Compute", text: "First Academy cohort, a shared compute pod and the first nine research programs.", done: false },
    { year: "2028", title: "Open Models", text: "An open Slovenian SI model, published evaluations, first spin-out companies.", done: false },
    { year: "2030", title: "District Complete", text: "Six connected regional nodes, 2,500 Academy seats and a venture studio.", done: false },
    { year: "2035", title: "Super Intelligence for Society", text: "SI systems that measurably speed up science, healthcare and climate resilience, developed openly and safely.", done: false }
  ],

  ticker: [
    "<b>Live</b> District launch, 2026",
    "<b>Open call</b> Academy Cohort 01 pre-registration",
    "<b>Research</b> 9 programs in formation",
    "<b>Nodes</b> Ljubljana · Maribor · Koper · Kranj · Nova Gorica · Novo mesto",
    "<b>Principle</b> Open science, human control"
  ]
};
