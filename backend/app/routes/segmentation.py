from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.clustering import get_current_clustering, run_kmeans_clustering

router = APIRouter(prefix="/api/segmentation", tags=["Segmentation"])

class ReclusterRequest(BaseModel):
    k: int = 5

@router.get("")
def get_segmentation_stats():
    return get_current_clustering()

@router.post("/recluster")
def recluster_accounts(req: ReclusterRequest):
    if req.k < 3 or req.k > 8:
        raise HTTPException(status_code=400, detail="Cluster count k must be between 3 and 8.")
    return run_kmeans_clustering(k=req.k)
