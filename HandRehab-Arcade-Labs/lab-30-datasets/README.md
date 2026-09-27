# Lab 30 — Download Datasets Like a Professional
### ดาวน์โหลดชุดข้อมูลอย่างมืออาชีพ

**Goal:** find and use public hand datasets properly — with backup links, file verification and a complete provenance record.
เป้าหมาย: ใช้ชุดข้อมูลสาธารณะอย่างถูกต้อง มีลิงก์สำรอง ตรวจไฟล์ และบันทึกที่มาครบ

## How to run / วิธีเปิด
- Windows: double-click `start.bat`
- Mac / Linux: `bash start.sh`
- Or: `python -m http.server 8000` in this folder, then open http://localhost:8000
  (must be served — `fetch()` of `datasets/` files does not work from `file://`)

Then: choose a dataset → read the licence box → tick **"ฉันอ่านเงื่อนไขครบแล้ว"** → press **⬇️ ดาวน์โหลดชุดข้อมูล**.
Works fully offline: the bundled synthetic samples in `datasets/` are the last link in each chain.

## Files
| File | What it is |
|---|---|
| `index.html` | = **dataset-viewer.html**: dataset dropdown, prominent licence (collapsible, must be acknowledged), download button + progress bar + per-link attempt log, "load from my computer" file picker, "save file" button, total record count + file size, first 20 records table, random hand-drawing sampler |
| `js/dataset-loader.js` | `fetchWithFallback(links, {timeoutMs:15000, expect:'json'|'csv'|'binary', minBytes, magic, onProgress, manualUrl, fileName})`, `readLocalFile(file, opts)`, `verifyData`, `parseCSV`, `formatBytes` |
| `js/datasets-config.js` | the datasets: links in try-order, licence summary, manual-download instructions (keep in sync with SOURCES.md) |
| `js/records.js` | turns JSON (HaGRID object / arrays / FreiHAND xyz) / CSV / zip (.task) into table rows (pure) |
| `js/viewer.js` | page logic |
| `js/ui.js`, `css/*` | shared core (copied) |
| `datasets/SOURCES.md` | provenance table, 6 columns, 3 real rows + 2 rows for our synthetic samples, size/record-count table |
| `datasets/sample-hagrid-annotations.json` | **synthetic** 42-record sample in HaGRID's annotation format (clearly labelled in its `_README` key) |
| `datasets/sample-landmarks.csv` | **synthetic** 21-point landmarks, 5 gestures × 12 (column `source = synthetic`) |
| `docs/why-provenance.md` | Thai explanation: why provenance matters in research |

### How verification works (the two blanks)
1. **Type check:** reject `content-type: text/html` and any file starting with `<!doctype`/`<html` (school filter pages); for binaries search for the magic bytes (`PK\x03\x04` for the MediaPipe `.task` zip — note the real file has 2 leading zero bytes, so we search the first 64 bytes rather than only offset 0).
2. **Size + parse check:** at least `minBytes` (5 MB for the model) and the content must parse (valid JSON / CSV with header + ≥1 row / readable zip directory).
Each link gets its own `AbortController` with a 15 s timeout covering the whole download. If every link fails, the error carries a Thai message, the manual download link and where to place the file (`datasets/<name>`), and the page shows retry + "open link" buttons.

To use the **real** data: put HaGRID's annotation file for one class at `datasets/hagrid-annotations.json`, your own CSV at `datasets/landmarks.csv`, the model at `datasets/hand_landmarker.task` — those links are tried before the samples (a 404 in the console for them is expected until you do).

## Blanks we filled in
| Blank in the prompt | Value we chose |
|---|---|
| Timeout per link | **15 seconds** |
| Verify genuine data by checking ___ and ___ | **file type** (content-type / not-HTML / magic bytes) and **plausible size + successful parse** |
| Three datasets | **HaGRID** (CC BY-SA 4.0), **FreiHAND** (research-only, verify), **MediaPipe Hand Landmarker model + model card** (Apache 2.0, verify) |
| Team placeholders | "HandRehab Arcade", "ทีม NeonHands", "โรงเรียนของเรา" ⚠️ *team: change to your own* |
| Download dates in SOURCES.md | 2026-09-27 ⚠️ *team: replace with the date you actually downloaded* |

Licence cells marked **verify** must be checked against the full licence text on the source website before you submit.

## How to verify (MUST / PASS checklist)
- [ ] Download button is disabled until the licence checkbox is ticked; switching dataset un-ticks it and hides the data.
- [ ] Choose **HaGRID** → download → attempt log shows ❌ `datasets/hagrid-annotations.json — HTTP 404` then ✅ sample → 42 records, 46.9 KB, 20-row table.
- [ ] Choose **MediaPipe model** (with internet) → progress bar climbs 0 → 100 % → 2 records (files inside the zip), 7.46 MB.
- [ ] Disconnect the internet and choose the model again → Thai message with manual link and "put it in datasets/hand_landmarker.task".
- [ ] SHOULD: try at school — if the filter returns an HTML page, the log shows "ได้หน้าเว็บ (text/html) มาแทนไฟล์ข้อมูล".
- [ ] `datasets/SOURCES.md` has all six columns filled for every row (**PASS**), plus size and record count for Chapter 3.
- Pitfall: school network blocks it → download at home, bring it on USB, use **📂 โหลดจากเครื่อง** — and still record provenance.
