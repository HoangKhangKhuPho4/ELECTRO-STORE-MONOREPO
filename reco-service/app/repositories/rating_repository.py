from typing import Any

from sqlalchemy.orm import Session

from app.models import ReviewRating


def fetch_approved_ratings(db: Session) -> list[dict[str, Any]]:
    rows = (
        db.query(
            ReviewRating.user_id,
            ReviewRating.product_id,
            ReviewRating.rating,
        )
        .filter(ReviewRating.is_approved.is_(True))
        .filter(ReviewRating.user_id.isnot(None))
        .filter(ReviewRating.product_id.isnot(None))
        .filter(ReviewRating.rating.isnot(None))
        .all()
    )

    return [
        {
            "user_id": int(user_id),
            "product_id": int(product_id),
            "rating": float(rating),
        }
        for user_id, product_id, rating in rows
    ]
