#!/usr/bin/env sh
# Start DeepDistrict: website + back office (with sign-in) at http://localhost:8000
#   ./start.sh          this computer only
#   ./start.sh --lan    also reachable from phones/computers on the same Wi-Fi
cd "$(dirname "$0")"
command -v python3 >/dev/null 2>&1 || { echo "Python 3 is required: https://www.python.org/downloads/"; exit 1; }
# the server opens the browser itself once it is listening (and picks a free port if 8000 is busy)
exec python3 server/app.py --open "$@"
