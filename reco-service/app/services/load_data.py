from typing import Any

import pandas as pd
from surprise import Dataset, Reader
from surprise.dataset import DatasetAutoFolds
from sqlalchemy.orm import Session

from app.repositories.rating_repository import fetch_approved_ratings

REQUIRED_COLUMNS = ("user_id", "product_id", "rating")

def load_data(
    rating_data: list[dict[str, Any]],
) -> tuple[DatasetAutoFolds, pd.DataFrame]:
    if not rating_data:
        raise ValueError("rating_data rong — khong co lich su danh gia de train.")
    
    df = pd.DataFrame(rating_data)
    
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Thieu cot bat buoc: {missing}")
    
    df = df[list(REQUIRED_COLUMNS)].copy()
    df["user_id"] = df["user_id"].astype(int)
    df["product_id"] = df["product_id"].astype(int)
    df["rating"] = df["rating"].astype(float)
    
    # Lọc bỏ dữ liệu rác (Rating phải nằm trong khoảng 1 đến 5)
    df = df[(df["rating"] >= 1.0) & (df["rating"] <= 5.0)]
    
    reader = Reader(rating_scale=(1, 5))
    data = Dataset.load_from_df(df[["user_id", "product_id", "rating"]], reader)
    return data, df

    
def load_data_from_db(db: Session) -> tuple[DatasetAutoFolds, pd.DataFrame]:
    raw_ratings = fetch_approved_ratings(db)
    return load_data(raw_ratings)
