"""WSGI entry point for hosting (e.g. PythonAnywhere).

In the PythonAnywhere "Web" tab, set the WSGI configuration file to import this:

    import sys
    sys.path.insert(0, "/home/<username>/deepdistrict-web/server")
    from wsgi import application

Data is stored in server/data/ next to this file unless DD_DATA_DIR is set.
"""
from app import application  # noqa: F401
