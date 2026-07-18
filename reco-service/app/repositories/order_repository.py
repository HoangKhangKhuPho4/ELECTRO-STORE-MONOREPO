import logging

from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import ORDER_DB_NAME

logger = logging.getLogger(__name__)


def fetch_user_purchases(db: Session, user_id: int) -> list[int]:
    """Truy vấn electro_order_db: danh sách product_id user đã từng mua (DISTINCT).
    Lỗi DB → log + trả [] để cold-start fallback sang popular, không crash API.
    """
    query = text(f"""
        SELECT DISTINCT od.product_id
        FROM {ORDER_DB_NAME}.orders o
        JOIN {ORDER_DB_NAME}.order_details od ON o.id = od.order_id
        WHERE o.user_id = :user_id
          AND od.product_id IS NOT NULL
    """)
    try:
        rows = db.execute(query, {"user_id": user_id}).fetchall()
        return [row[0] for row in rows]
    except SQLAlchemyError as exc:
        logger.warning("fetch_user_purchases loi khi truy van order-db cho user %s: %s", user_id, exc)
        try:
            db.rollback()
        except SQLAlchemyError:
            pass
        return []
