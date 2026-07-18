from typing import Any, Optional

from pydantic import BaseModel, Field


class RecommendRequest(BaseModel):
    user_id: int = Field(..., description="ID người dùng cần gợi ý")
    top_n: int = Field(10, ge=1, le=50, description="Số sản phẩm gợi ý")


class RecommendItem(BaseModel):
    product_id: int
    predicted_rating: Optional[float] = None


class RecommendResponse(BaseModel):
    user_id: int
    status: str = "success"
    strategy: str = ""
    top_k: int
    recommendations: list[RecommendItem] = []


class HealthResponse(BaseModel):
    status: str
    detail: Optional[dict[str, Any]] = None


class RetrainResponse(BaseModel):
    status: str
    message: str
