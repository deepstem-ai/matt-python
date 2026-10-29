#!/usr/bin/env node
/* Checks the course catalogue (assets/data/*.js) for consistency.
   Run from the project folder:  node tools/check_catalogue.js
   - every course code is unique and has a track, a group and full bilingual details
   - every track belongs to exactly one group
   - every course code mentioned anywhere in the data (paths, exams, SI blocks, admissions…) exists */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const FILES = ["content.js", "courses-details.js", "courses-more.js", "admissions.js", "catalogue.js", "insights.js", "si.js"];
const ctx = { window: {}, console };
vm.createContext(ctx);
for (const f of FILES) {
  const p = path.join(root, "assets", "data", f);
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: f });
}
const D = ctx.window.DD_CONTENT;
const errors = [];
const err = (m) => errors.push(m);
const bi = (v, where) => { if (!v || typeof v !== "object" || !String(v.en || "").trim() || !String(v.th || "").trim()) err(`${where}: missing English or Thai text`); };

const codes = new Set();
for (const c of D.courses) {
  if (codes.has(c.code)) err(`duplicate course code ${c.code}`);
  codes.add(c.code);
  if (!/^[A-Z]{2,4}\d{2,3}$|^INNO$/.test(c.code)) err(`${c.code}: unusual code format`);
  if (!D.tracks.some((t) => t.id === c.track)) err(`${c.code}: unknown track "${c.track}"`);
  if (!c.group || !D.groups.some((g) => g.id === c.group)) err(`${c.code}: no group`);
  if (!(c.level >= 1 && c.level <= 4)) err(`${c.code}: level must be 1–4`);
  bi(c.title, `${c.code} title`); bi(c.text, `${c.code} text`);
  if (!Array.isArray(c.tools) || !c.tools.length) err(`${c.code}: no tools`);
  const d = D.details[c.code];
  if (!d) { err(`${c.code}: no details`); continue; }
  if (!d.modes || !d.modes.length || d.modes.some((m) => !D.modes[m])) err(`${c.code}: bad modes`);
  if (!d.modules || d.modules.length < 3) err(`${c.code}: fewer than 3 modules`);
  (d.modules || []).forEach((m, i) => bi(m, `${c.code} module ${i + 1}`));
  (d.outcomes || []).forEach((m, i) => bi(m, `${c.code} outcome ${i + 1}`));
  if (!d.outcomes || !d.outcomes.length) err(`${c.code}: no outcomes`);
  bi(d.prereq, `${c.code} prerequisite`); bi(d.project, `${c.code} project`);
}
for (const code of Object.keys(D.details)) if (!codes.has(code)) err(`details for unknown course ${code}`);

for (const t of D.tracks) {
  const owners = D.groups.filter((g) => g.tracks.includes(t.id));
  if (owners.length !== 1) err(`track ${t.id} is in ${owners.length} groups (must be exactly 1)`);
  bi(t.name, `track ${t.id} name`); bi(t.text, `track ${t.id} text`);
}
for (const g of D.groups) {
  bi(g.name, `group ${g.id} name`); bi(g.text, `group ${g.id} text`);
  for (const t of g.tracks) if (!D.tracks.some((x) => x.id === t)) err(`group ${g.id}: unknown track ${t}`);
  if (!D.courses.some((c) => c.group === g.id)) err(`group ${g.id} has no courses`);
}

// course codes referenced elsewhere in the data
const refs = [];
const CODE_LIKE = /^[A-Z]{2,4}\d{3}$/;
const walk = (v, where) => {
  if (typeof v === "string") { if (CODE_LIKE.test(v)) refs.push([v, where]); return; }
  if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${where}[${i}]`));
  else if (v && typeof v === "object") for (const k of Object.keys(v)) {
    const x = v[k];
    if ((k === "code" || k === "courses" || k === "codes") && where.split(".")[0] !== "courses") {
      (Array.isArray(x) ? x : [x]).forEach((c) => typeof c === "string" && refs.push([c, `${where}.${k}`]));
    } else if (k !== "details") walk(x, `${where}.${k}`);
  }
};
for (const k of Object.keys(D)) if (!["courses", "details"].includes(k)) walk(D[k], k);
for (const [c, where] of refs) if (!codes.has(c)) err(`${where} refers to unknown course ${c}`);

const by = {};
D.courses.forEach((c) => { by[c.group] = (by[c.group] || 0) + 1; });
console.log(`${D.courses.length} courses · ${D.tracks.length} tracks · ${D.groups.length} groups · ${refs.length} cross-references`);
D.groups.forEach((g) => console.log(`  ${g.id.padEnd(12)} ${String(by[g.id] || 0).padStart(3)}  ${g.name.en}  [${g.tracks.join(", ")}]`));
if (errors.length) { console.log(`\n${errors.length} problem(s):`); errors.forEach((e) => console.log("  ✗ " + e)); process.exit(1); }
console.log("Catalogue OK");
