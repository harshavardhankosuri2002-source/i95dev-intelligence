import sys
import os
import shutil

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Ensure database exists in writable /tmp directory on Vercel Serverless
ORIG_DB = os.path.join(BACKEND_DIR, "data", "i95dev.db")
TMP_DB = "/tmp/i95dev.db"

if os.path.exists("/tmp"):
    if not os.path.exists(TMP_DB) and os.path.exists(ORIG_DB):
        try:
            shutil.copyfile(ORIG_DB, TMP_DB)
        except Exception as e:
            print(f"Error copying DB to /tmp: {e}")
    if os.path.exists(TMP_DB):
        os.environ["SQLITE_DB_PATH"] = TMP_DB

from app.main import app
