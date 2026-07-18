from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import RecommendResponse, RetrainResponse, RecommendExplainResponse
from app.services import recommend as recommend_service

router = APIRouter(tags=["recommendations"])


# Entry Inference: statistics-service gọi GET /recommend/{user_id}?top_k=10
@router.get("/recommend/{user_id}", response_model=RecommendResponse)
def recommend(
    user_id: int,
    top_k: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    # Ủy thác sang service layer — load .pkl + KNNBaseline / purchase / popular
    return recommend_service.get_recommendations(db, user_id=user_id, top_n=top_k)


@router.post("/api/retrain", response_model=RetrainResponse)
def retrain(db: Session = Depends(get_db)):
    return recommend_service.trigger_retrain(db)


@router.get("/recommend_explain/{user_id}", response_model=RecommendExplainResponse)
def recommend_explain(
    user_id: int,
    top_k: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    return recommend_service.get_recommendations_with_explanation(db, user_id=user_id, top_n=top_k)
