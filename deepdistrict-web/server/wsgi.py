"""WSGI entry point for hosting (e.g. PythonAnywhere).

In the PythonAnywhere "Web" tab, set the WSGI configuration file to import this:

    import sys
    sys.path.insert(0, "/home/<username>/deepdistrict-web/server")
    from wsgi import application

Data is stored in server/data/ next to this file unless DD_DATA_DIR is set. Every day the database is also
copied to ~/deepdistrict-safe-copies/ (outside the website folder; DD_SAFE_DIR changes it). If you install a
new version and server/data/ is missing, the newest safe copy is restored automatically on start.
"""
from app import application  # noqa: F401
