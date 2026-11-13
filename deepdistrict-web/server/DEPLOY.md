# Running and hosting the DeepDistrict back office

## 1. On your own computer (now)

Requirements: **Python 3.9+** (macOS/Linux usually have it; on Windows install it from
python.org and tick "Add Python to PATH"). No other installs.

```bash
./start.sh          # Windows: double-click start.bat
```

- Website: <http://localhost:8000/> · Back office: <http://localhost:8000/admin/>
- The browser opens by itself. If port 8000 is busy (often an older DeepDistrict window still open), the server says so and uses 8001, 8002, …; close old windows first. The footer and the start-up message show the version (e.g. 4.6 r2).
- First visit: create the admin account.
- Data: `server/data/deepdistrict.db` (one file). A copy is made every day in
  `server/data/backups/` (last 30 days plus the 1st of every month, kept for good). Nothing in the database is ever deleted — every earlier version and every archived record stays in the `archive` table. **Never commit or share this folder** — it holds
  learners' personal data.
- **Updating to a new version:** extract the new zip over the old folder (the zip never contains
  `server/data/`, so your data stays). The database is also copied every day to `~/deepdistrict-safe-copies/`
  (outside the website folder; set `DD_SAFE_DIR` to choose another place). If `server/data/` is ever
  missing, the newest safe copy is restored automatically when the server starts.
- Teachers or parents on the **same Wi-Fi**: run `./start.sh --lan` and give them
  `http://<your-computer's-IP>:8000/admin/`. This is plain HTTP, fine inside your own
  network but not across the internet.

## 2. Free hosting later — PythonAnywhere (free "Beginner" plan)

The server is a standard WSGI app using only the Python standard library and SQLite, so it
runs on PythonAnywhere's free plan without changes. You get `https://<username>.pythonanywhere.com`
with HTTPS.

1. Create a free account at pythonanywhere.com.
2. Upload the `deepdistrict-web` folder (Files tab → upload the zip, then unzip in a Bash
   console: `unzip deepdistrict-web-*.zip`).
3. Web tab → *Add a new web app* → *Manual configuration* → Python 3.x.
4. Edit the WSGI configuration file so it contains only:
   ```python
   import sys
   sys.path.insert(0, "/home/<username>/deepdistrict-web-<version>/server")
   from wsgi import application
   ```
5. Reload the web app, open `https://<username>.pythonanywhere.com/admin/` and create the admin
   (or sign in and use **Settings → Import backup** to bring your local data over).
6. Download a backup regularly (Settings → Export backup).

**Plans in 2026 (check PythonAnywhere's current terms):** the paid tiers were merged into one
**Developer** plan (about $10/month) with unrestricted internet access and scheduled tasks.
Free accounts created from mid-January 2026 have **no scheduled tasks and no MySQL**, and
internet access is restricted to an allowlist. This app needs neither: it uses its own SQLite
file, and reminders can be driven by the *Online hosting timer* URL from any free external cron
service. It runs as a normal **WSGI** app, so it does not depend on PythonAnywhere's ASGI
support, which is still in beta.

Free-plan limits to know (check PythonAnywhere's current terms): one web app, about
512 MB disk, a monthly click to keep the free app running, and community support only.
For a custom domain (e.g. `portal.deepdistrict.si`) a paid plan is needed.

## AI (Claude): news blog writer and online tests

The news blog writer, the cover drawings, AI-drafted exam items and IELTS Writing feedback use
Claude through the official Anthropic SDK. Everything else works without it.

1. **Install the SDK** (once). Locally: `pip install anthropic`. On PythonAnywhere, in a Bash
   console: `pip3.13 install --user anthropic` (use the same Python version as the web app).
2. **API key** — create one at console.anthropic.com and set a monthly spend limit there too.
   Give it to the server as the environment variable `ANTHROPIC_API_KEY`. Never commit it, never
   paste it into the back office or a chat.
   * Locally (Windows PowerShell): `$env:ANTHROPIC_API_KEY="…"` before `python server/app.py`;
     macOS/Linux: `export ANTHROPIC_API_KEY=…`.
   * PythonAnywhere: add these two lines at the top of the WSGI configuration file (it is private
     to your account), then reload the web app:
     ```python
     import os
     os.environ["ANTHROPIC_API_KEY"] = "…your key…"
     ```
3. **Back office → AI settings**: switch AI on, enter the model id (from Anthropic's models page),
   the monthly job and dollar limits, and the token prices from Anthropic's pricing page so the
   cost estimate works. Every AI call is logged there with tokens, web searches and cost.
4. **Internet access**: the server must reach `api.anthropic.com` (Claude) and
   `api.openverse.org` (free-licence photos). On PythonAnywhere this needs a paid plan.
5. **Timer**: scheduled posts and the automatic writer run from the same *Online hosting timer*
   URL as reminders (Back office → Notifications). Call it every 5–15 minutes from a free cron
   service, or from a PythonAnywhere scheduled task (paid plan).

How the AI work runs: the request returns at once and the work continues in a background thread
of the web worker; pages refresh by themselves. If a worker restarts mid-job, the job is marked
"interrupted" after 15 minutes and can simply be started again.

## Email

Settings → Email in the back office. With Gmail / Google Workspace: host `smtp.gmail.com`, port
587, STARTTLS, your address as username and an **app password** (Google account → Security →
App passwords). Hosting providers may restrict outgoing email on free plans; if sending fails the
back office falls back to downloading the file and opening the mail app.

## LINE notifications (LINE Official Account, free plan)

1. Create a LINE Official Account (free plan ≈ 300 push messages a month) and, in its settings,
   enable the **Messaging API**. This creates a channel in LINE Developers.
2. In LINE Developers → the channel → *Messaging API*: issue a **Channel access token
   (long-lived)**; copy the **Channel secret** from *Basic settings*.
3. Back office → Notifications → *Admin: notifications & LINE* → **Set up**: paste the token,
   the secret and the account's LINE ID (e.g. `@123abcde`).
4. Copy the **Webhook URL** shown there (`https://<your-site>/api/line/webhook`) into LINE
   Developers → *Webhook URL*, press *Verify*, and switch **Use webhook** on. In the OA Manager,
   switch auto-reply messages off so only DeepDistrict answers. The webhook needs HTTPS, so it
   works once the site is online (PythonAnywhere), not on `localhost`.
5. Everyone connects their own LINE in *Notifications → My settings & LINE → Connect LINE*: they
   add the account as a friend and send the 6-digit code. Replies in the chat ("schedule",
   "hours") are free; only pushed notifications count against the monthly limit, and several
   notifications for one person are sent together as one message.

**Background sending.** `start.sh` sends notifications straight away and checks for reminders
every 20 seconds. Under WSGI hosting (PythonAnywhere) there is no background loop, so use the
**Online hosting timer** link shown on the same page: call it every 10–15 minutes from a free
cron service (e.g. cron-job.org) or a PythonAnywhere scheduled task, so that reminders go out.
Keep this link private.

**Free-plan note.** PythonAnywhere's free plan only allows outgoing connections to an allowlist
of sites. If LINE messages fail with a connection error, check whether `api.line.me` is on the
allowlist (or ask PythonAnywhere to add it), or use the cheapest paid plan, which has
unrestricted internet access. The same applies to email: on the free plan only Gmail's SMTP
server is reachable.

## Ready-made content

On first start the server adds the 12 ready-made practice sets in `server/exam_sets/` (SAT, IELTS,
Suankularb M.1 GATE and EP) and 7 starter news posts. Each is added only once — deleting one keeps it
deleted. Set `DD_SEED=0` to start with an empty bank and blog instead.

## Security checklist before real use

- Use strong admin passwords; give teachers their own accounts.
- Remove or change the demo accounts (`parent@demo.test`, `student@demo.test`, …).
- Only use `--lan` on a trusted network; on the internet always use HTTPS (PythonAnywhere
  provides it).
- Keep backups somewhere private; delete learners' data when they ask (PDPA).

## News from other sources (RSS) and automatic lesson records

- The same timer URL (`/api/cron?key=…`, Back office → Notifications) also records past lessons nobody
  updated as regular lessons, and fetches the RSS headlines when they are due (every 3 hours by default).
- **PythonAnywhere free accounts** can only reach sites on PythonAnywhere's allow-list. Sources outside it
  show an error in Back office → News blog → *News from other sources (RSS)*; switch those off, or use a
  paid account (unrestricted internet). Photos for posts are loaded by visitors' browsers, so they work on
  any plan.

