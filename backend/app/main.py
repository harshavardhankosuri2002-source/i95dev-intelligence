import os
import sys
import shutil
import sqlite3

# Fix sys.path for Vercel Serverless environment
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
ROOT_DIR = os.path.dirname(BACKEND_DIR)

for path in [BACKEND_DIR, CURRENT_DIR, ROOT_DIR]:
    if path not in sys.path:
        sys.path.insert(0, path)

# Setup writable SQLite DB in /tmp for Vercel
if os.getenv("VERCEL") or os.path.exists("/tmp"):
    tmp_db = "/tmp/i95dev.db"
    orig_db = os.path.join(BACKEND_DIR, "data", "i95dev.db")
    if not os.path.exists(tmp_db) and os.path.exists(orig_db):
        try:
            shutil.copyfile(orig_db, tmp_db)
        except Exception as e:
            print(f"Error copying DB to /tmp: {e}")
    if os.path.exists(tmp_db):
        os.environ["SQLITE_DB_PATH"] = tmp_db

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from apscheduler.schedulers.background import BackgroundScheduler

from app.database import init_db, get_db_connection, DB_PATH
from app.synthetic_generator import generate_all_synthetic_data
from app.feature_engineering import build_analytical_features
from app.clustering import run_kmeans_clustering, get_current_clustering
from app.automation_engine import evaluate_automation_triggers

# Import routers
from app.routes.customers import router as customers_router
from app.routes.segmentation import router as segmentation_router
from app.routes.recommendations import router as recommendations_router
from app.routes.automation import router as automation_router
from app.routes.messages import router as messages_router
from app.routes.analytics import router as analytics_router
from app.routes.ai_analyst import router as ai_analyst_router
from app.routes.data_mgmt import router as data_mgmt_router
from app.routes.impact import router as impact_router

scheduler = BackgroundScheduler()

def scheduled_automation_tick():
    try:
        evaluate_automation_triggers()
    except Exception as e:
        print(f"Scheduled automation tick encountered error: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cust_count = cursor.execute("SELECT COUNT(*) as c FROM customers").fetchone()["c"]
    conn.close()

    if cust_count == 0:
        print("Empty database detected. Generating initial synthetic data...")
        generate_all_synthetic_data(seed=42, count=1000)
        build_analytical_features()
        run_kmeans_clustering(k=5)
    else:
        # Ensure clusters are computed
        get_current_clustering()

    # Start background scheduler if not in serverless runtime
    if not os.getenv("VERCEL"):
        try:
            scheduler.add_job(scheduled_automation_tick, 'interval', minutes=10, id='automation_tick', replace_existing=True)
            scheduler.start()
            print("Background automation scheduler started (10-minute heartbeat).")
        except Exception as e:
            print(f"Failed to start scheduler: {e}")
    else:
        print("Running in serverless environment - background scheduler disabled.")

    yield

    # Shutdown
    if scheduler.running:
        scheduler.shutdown()
        print("Scheduler shut down.")

app = FastAPI(
    title="i95Dev AI-Powered Customer Intelligence & Automated Follow-Up Platform",
    description="Enterprise B2B customer intelligence, behavioral segmentation, and automated follow-up engine.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(customers_router)
app.include_router(segmentation_router)
app.include_router(recommendations_router)
app.include_router(automation_router)
app.include_router(messages_router)
app.include_router(analytics_router)
app.include_router(ai_analyst_router)
app.include_router(data_mgmt_router)
app.include_router(impact_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "i95dev-intelligence-backend",
        "version": "1.0.0",
        "database_connected": os.path.exists(DB_PATH)
    }

# Mount static frontend build
dist_candidates = [
    os.path.join(ROOT_DIR, "dist"),
    os.path.join(ROOT_DIR, "frontend", "dist"),
    os.path.join(CURRENT_DIR, "dist"),
    os.path.join(BACKEND_DIR, "dist"),
]
dist_dir = None
for candidate in dist_candidates:
    if os.path.exists(os.path.join(candidate, "index.html")):
        dist_dir = candidate
        break

if dist_dir:
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str = ""):
        if full_path.startswith("api/") or full_path == "api":
            return {"error": "Not Found", "status": 404}
        file_path = os.path.join(dist_dir, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_dir, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

