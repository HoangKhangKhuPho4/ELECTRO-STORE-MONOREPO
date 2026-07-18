from typing import Any, Optional

from pydantic import BaseModel

from app.schemas.recommend import RecommendItem


class BaselineUI(BaseModel):
    mu: float
    bu: float
    bi: float
    b_ui: float


class ExplanationTerm(BaseModel):
    from_item_id: int
    sim_ij: float
    r_ui: float
    baseline_ui: BaselineUI
    residual_r_ui: float
    contrib: float


class CandidateExplanation(BaseModel):
    candidate_product_id: int
    baseline_uj: BaselineUI
    terms: list[ExplanationTerm]
    numerator: float
    denominator: float
    prediction: float


class RecommendExplainResponse(BaseModel):
    user_id: int
    status: str = "success"
    strategy: str = ""
    top_k: int
    global_mean: Optional[float] = None
    rated_items: list[dict[str, Any]] = []
    recommendations: list[RecommendItem] = []
    explanations: list[CandidateExplanation] = []
