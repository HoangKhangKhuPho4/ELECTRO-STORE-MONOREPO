from datetime import datetime, timezone

import pandas as pd
from sqlalchemy.orm import Session
from surprise import KNNBaseline

from app.services.load_data import load_data_from_db
from app.services.model_store import RecoModel, save_model

sim_options = {
    "name": "pearson_baseline",
    "user_based": False,
}


def _compute_popular(df: pd.DataFrame, top_n: int = 200) -> list[int]:
    grouped = df.groupby("product_id")
    
    product_stats = grouped.agg(
        rating_count=("rating", "size"),
        rating_mean=("rating", "mean"),
    ).reset_index()

    ranked_products = product_stats.sort_values(
        by=["rating_count", "rating_mean"],
        ascending=[False, False],
    )

    top_products = ranked_products.head(top_n)
    return top_products["product_id"].astype(int).tolist()


def train_model(db: Session) -> RecoModel:
    data, df = load_data_from_db(db)

    trainset = data.build_full_trainset()

    algo = KNNBaseline(sim_options=sim_options)
    algo.fit(trainset)

    popular = _compute_popular(df)

    model = RecoModel(
        algo=algo,
        popular_product_ids=popular,
        trained_at=datetime.now(timezone.utc).isoformat(),
        n_users=trainset.n_users,
        n_items=trainset.n_items,
        n_ratings=trainset.n_ratings,
    )

    save_model(model)
    return model
