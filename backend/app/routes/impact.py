from fastapi import APIRouter
from app.impact_evaluation import evaluate_business_impact

router = APIRouter(prefix="/api/impact", tags=["Business Impact"])

@router.get("/evaluation")
def get_impact_evaluation():
    return evaluate_business_impact()
