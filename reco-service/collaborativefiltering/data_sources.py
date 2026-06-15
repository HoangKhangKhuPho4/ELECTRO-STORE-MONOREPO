"""
data_sources.py — Lấy dữ liệu rating / mua hàng từ các microservice qua REST API.

Tuân thủ nguyên tắc "Database per Service":
- review-service: ratings, popular products
- order-service: lịch sử mua hàng

KHÔNG truy vấn trực tiếp vào database của các service khác.

============================================================
  📌 HƯỚNG DẪN DÀNH CHO TEAM MEMBERS
  Hoàn thiện từng hàm theo gợi ý bên dưới.
  Không thay đổi tên hàm hoặc return type.
============================================================
"""

import logging
from typing import List, Tuple

from config.settings import FAKE_PURCHASE_RATING, MAX_LATEST_RATINGS
from collaborativefiltering.service_client import (
    fetch_user_ratings_via_api,
    fetch_user_reviewed_products_via_api,
    fetch_user_purchased_products_via_api,
    fetch_popular_products_via_api,
)

logger = logging.getLogger(__name__)


def fetch_latest_user_ratings(user_id: int, limit: int = MAX_LATEST_RATINGS) -> List[Tuple[int, float]]:
    """Lấy rating mới nhất của user từ review-service API.

    Gợi ý triển khai:
    -----------------
    - Chỉ cần gọi trực tiếp: return fetch_user_ratings_via_api(user_id, limit=limit)
    - Hàm này là wrapper đơn giản.

    Returns:
        List[Tuple[int, float]]: [(product_id, rating), ...]
    """
    # TODO: Triển khai — gọi fetch_user_ratings_via_api(user_id, limit=limit)
    # return fetch_user_ratings_via_api(user_id, limit=limit)
    return []


def fetch_purchases_without_review(user_id: int) -> List[Tuple[int, float]]:
    """Lấy danh sách sản phẩm đã mua nhưng chưa review.

    Gợi ý triển khai:
    -----------------
    Gọi 2 API rồi tính hiệu:
    1. fetch_user_purchased_products_via_api(user_id) → purchased_ids (List[int])
       - Nếu rỗng → return []

    2. fetch_user_reviewed_products_via_api(user_id) → reviewed_ids (Set[int])

    3. unreviewed = [pid for pid in purchased_ids if pid not in reviewed_ids]

    4. return [(pid, FAKE_PURCHASE_RATING) for pid in unreviewed]
       (Gán fake rating = FAKE_PURCHASE_RATING vì chưa có rating thật)

    Returns:
        List[Tuple[int, float]]: [(product_id, FAKE_PURCHASE_RATING), ...]
    """
    # TODO: Bước 1 — Lấy danh sách đã mua
    # purchased_ids = fetch_user_purchased_products_via_api(user_id)
    # if not purchased_ids:
    #     return []

    # TODO: Bước 2 — Lấy danh sách đã review
    # reviewed_ids = fetch_user_reviewed_products_via_api(user_id)

    # TODO: Bước 3 — Tính chênh lệch (mua mà chưa review)
    # unreviewed = [pid for pid in purchased_ids if pid not in reviewed_ids]

    # TODO: Bước 4 — Gán fake rating và return
    # return [(pid, FAKE_PURCHASE_RATING) for pid in unreviewed]
    return []


def fetch_user_seed_ratings(user_id: int) -> Tuple[List[Tuple[int, float]], str]:
    """Kết hợp ratings thật + mua chưa review làm seed cho CF.

    Gợi ý triển khai:
    -----------------
    1. ratings   = fetch_latest_user_ratings(user_id)
    2. purchases = fetch_purchases_without_review(user_id)

    3. Merge: ưu tiên giữ ratings thật, thêm purchases nếu product chưa có.
       - seen = {pid for pid, _ in ratings}
       - merged = list(ratings)
       - for pid, score in purchases:
             if pid not in seen:
                 merged.append((pid, score))
                 seen.add(pid)

    4. Xác định label (source):
       - Cả 2 có data   → "ratings_and_purchases"
       - Chỉ ratings    → "ratings_only"
       - Chỉ purchases  → "purchases_only"
       - Không có gì    → "none"

    5. return merged, label

    Returns:
        Tuple[List[Tuple[int, float]], str]:
            - merged: [(product_id, rating), ...]
            - label : tên nguồn dữ liệu (dùng để log/debug)
    """
    # TODO: Bước 1-2: Lấy ratings và purchases
    # ratings = fetch_latest_user_ratings(user_id)
    # purchases = fetch_purchases_without_review(user_id)

    # TODO: Bước 3: Merge (tránh trùng product)
    # seen = {pid for pid, _ in ratings}
    # merged = list(ratings)
    # for pid, score in purchases:
    #     if pid not in seen:
    #         merged.append((pid, score))
    #         seen.add(pid)

    # TODO: Bước 4: Xác định label
    # if ratings and purchases:
    #     label = "ratings_and_purchases"
    # elif ratings:
    #     label = "ratings_only"
    # elif purchases:
    #     label = "purchases_only"
    # else:
    #     label = "none"

    # TODO: Bước 5: Return
    # return merged, label
    return [], "none"


def fetch_popular_product_ids(limit: int = 50) -> List[int]:
    """Lấy danh sách product_id phổ biến từ review-service API.

    Gợi ý triển khai:
    -----------------
    - Chỉ cần gọi: return fetch_popular_products_via_api(limit=limit)

    Returns:
        List[int]: Danh sách product_id phổ biến nhất.
    """
    # TODO: Triển khai — gọi fetch_popular_products_via_api(limit=limit)
    # return fetch_popular_products_via_api(limit=limit)
    return []
