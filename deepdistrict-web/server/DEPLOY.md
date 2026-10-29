# Running and hosting the DeepDistrict back office

## 1. On your own computer (now)

Requirements: **Python 3.9+** (macOS/Linux usually have it; on Windows install it from
python.org and tick "Add Python to PATH"). No other installs.

```bash
./start.sh          # Windows: double-click start.bat
```

- Website: <http://localhost:8000/> · Back office: <http://localhost:8000/admin/>
- First visit: create the admin account.
- Data: `server/data/deepdistrict.db` (one file). A copy is made every day in
  `server/data/backups/` (last 30 days). **Never commit or share this folder** — it holds
  learners' personal data.
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

Free-plan limits to know (check PythonAnywhere's current terms): one web app, about
512 MB disk, a monthly click to keep the free app running, and community support only.
For a custom domain (e.g. `portal.deepdistrict.si`) a paid plan is needed.

## Email

Settings → Email in the back office. With Gmail / Google Workspace: host `smtp.gmail.com`, port
587, STARTTLS, your address as username and an **app password** (Google account → Security →
App passwords). Hosting providers may restrict outgoing email on free plans; if sending fails the
back office falls back to downloading the file and opening the mail app.

## Security checklist before real use

- Use strong admin passwords; give teachers their own accounts.
- Remove or change the demo accounts (`parent@demo.test`, `student@demo.test`, …).
- Only use `--lan` on a trusted network; on the internet always use HTTPS (PythonAnywhere
  provides it).
- Keep backups somewhere private; delete learners' data when they ask (PDPA).
