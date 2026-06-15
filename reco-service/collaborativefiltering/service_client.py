"""
service_client.py — HTTP client gọi REST API các microservice qua Eureka.

Thay thế truy vấn SQL trực tiếp vào database của các service khác,
tuân thủ nguyên tắc "Database per Service" của microservices.

============================================================
  📌 HƯỚNG DẪN DÀNH CHO TEAM MEMBERS
  Hoàn thiện từng hàm theo gợi ý bên dưới.
  File này là tầng HTTP client — KHÔNG chứa business logic.
============================================================
"""

import logging
import os
from typing import Any, Dict, List, Optional

import httpx
import py_eureka_client.eureka_client as eureka_client

logger = logging.getLogger(__name__)

# Timeout cho HTTP requests (seconds)
HTTP_TIMEOUT = 30.0
HTTP_TIMEOUT_BULK = 120.0  # Cho các request lấy dữ liệu lớn (training)

# Fallback URLs khi Eureka chưa sẵn sàng
_FALLBACK_URLS = {
    "review-service": os.getenv("REVIEW_SERVICE_URL", "http://localhost:8087"),
    "order-service": os.getenv("ORDER_SERVICE_URL", "http://localhost:8086"),
    "catalog-service": os.getenv("CATALOG_SERVICE_URL", "http://localhost:8082"),
}


def _resolve_service_url(service_name: str) -> str:
    """Resolve URL của service từ Eureka, fallback sang localhost.

    Gợi ý triển khai:
    -----------------
    1. Gọi eureka_client.get_instance(service_name) trong try/except.
    2. Nếu thành công và có instance:
       - host = instance.get("hostName") or instance.get("ipAddr", "localhost")
       - port = instance.get("port", {})
       - port_num = port.get("$", 8080) if isinstance(port, dict) else port
       - return f"http://{host}:{port_num}"
    3. Nếu lỗi: log debug, fall through.
    4. return _FALLBACK_URLS.get(service_name, "http://localhost:8080")

    Returns:
        str: Base URL của service (vd: "http://localhost:8087")
    """
    # TODO: Bước 1-3 — Lookup từ Eureka
    # try:
    #     instance = eureka_client.get_instance(service_name)
    #     if instance:
    #         host = instance.get("hostName") or instance.get("ipAddr", "localhost")
    #         port = instance.get("port", {})
    #         port_num = port.get("$", 8080) if isinstance(port, dict) else port
    #         return f"http://{host}:{port_num}"
    # except Exception as exc:
    #     logger.debug("Eureka lookup '%s' thất bại: %s — dùng fallback", service_name, exc)

    # TODO: Bước 4 — Fallback về URL cố định
    # return _FALLBACK_URLS.get(service_name, "http://localhost:8080")
    return _FALLBACK_URLS.get(service_name, "http://localhost:8080")


def _call_service(
    service_name: str,
    path: str,
    params: Optional[Dict[str, Any]] = None,
    timeout: float = HTTP_TIMEOUT,
) -> Any:
    """Gọi REST API của một microservice.

    Gợi ý triển khai:
    -----------------
    1. base_url = _resolve_service_url(service_name)
    2. url = f"{base_url}{path}"
    3. Dùng httpx.Client(timeout=timeout) để gửi GET request:
       - response = client.get(url, params=params)
       - response.raise_for_status()  ← raise nếu status >= 400
       - return response.json()
    4. Xử lý từng loại exception:
       - httpx.HTTPStatusError: log HTTP status code và response text
       - httpx.ConnectError   : log không kết nối được
       - Exception            : log lỗi chung
       → Tất cả đều raise lại exception

    Returns:
        Any: Dữ liệu JSON đã parse (dict hoặc list).

    Raises:
        httpx.HTTPStatusError: Khi server trả về HTTP error.
        httpx.ConnectError   : Khi không kết nối được service.
    """
    # TODO: Triển khai theo gợi ý trên
    # base_url = _resolve_service_url(service_name)
    # url = f"{base_url}{path}"
    # try:
    #     with httpx.Client(timeout=timeout) as client:
    #         response = client.get(url, params=params)
    #         response.raise_for_status()
    #         return response.json()
    # except httpx.HTTPStatusError as exc:
    #     logger.error("HTTP %d từ %s%s: %s", exc.response.status_code, service_name, path, exc.response.text[:200])
    #     raise
    # except httpx.ConnectError as exc:
    #     logger.error("Không thể kết nối %s (%s): %s", service_name, url, exc)
    #     raise
    # except Exception as exc:
    #     logger.error("Lỗi gọi %s%s: %s", service_name, path, exc)
    #     raise
    raise NotImplementedError("TODO: Hãy triển khai _call_service()")


# ═══════════════════════════════════════════════════════════════════════════
# Review Service API
# ═══════════════════════════════════════════════════════════════════════════

def fetch_user_ratings_via_api(user_id: int, limit: int = 5) -> list:
    """Lấy danh sách rating của user từ review-service API.

    Endpoint: GET /api/reviews/internal/user/{user_id}/ratings?limit={limit}

    Gợi ý triển khai:
    -----------------
    - Gọi _call_service("review-service", f"/api/reviews/internal/user/{user_id}/ratings", params={"limit": limit})
    - Parse response: mỗi item có keys productId và rating.
    - return [(item["productId"], float(item["rating"])) for item in data]
    - Nếu lỗi: log error, return []

    Returns:
        List[Tuple[int, float]]: [(product_id, rating), ...]
    """
    # TODO: Triển khai theo gợi ý trên
    # try:
    #     data = _call_service(
    #         "review-service",
    #         f"/api/reviews/internal/user/{user_id}/ratings",
    #         params={"limit": limit},
    #     )
    #     return [(item["productId"], float(item["rating"])) for item in data]
    # except Exception as exc:
    #     logger.error("fetch_user_ratings_via_api lỗi (user_id=%s): %s", user_id, exc)
    #     return []
    return []


def fetch_user_reviewed_products_via_api(user_id: int) -> set:
    """Lấy set product_id mà user đã review từ review-service API.

    Endpoint: GET /api/reviews/internal/user/{user_id}/reviewed-products

    Gợi ý triển khai:
    -----------------
    - Gọi _call_service("review-service", f"/api/reviews/internal/user/{user_id}/reviewed-products")
    - response là list các product_id.
    - return set(int(pid) for pid in data)
    - Nếu lỗi: log error, return set()

    Returns:
        Set[int]: Tập hợp product_id đã review.
    """
    # TODO: Triển khai theo gợi ý trên
    # try:
    #     data = _call_service(
    #         "review-service",
    #         f"/api/reviews/internal/user/{user_id}/reviewed-products",
    #     )
    #     return set(int(pid) for pid in data)
    # except Exception as exc:
    #     logger.error("fetch_user_reviewed_products lỗi (user_id=%s): %s", user_id, exc)
    #     return set()
    return set()


def fetch_popular_products_via_api(limit: int = 50) -> list:
    """Lấy danh sách product_id phổ biến từ review-service API.

    Endpoint: GET /api/reviews/internal/popular-products?limit={limit}

    Gợi ý triển khai:
    -----------------
    - Gọi _call_service("review-service", "/api/reviews/internal/popular-products", params={"limit": limit})
    - Mỗi item trong response có key "productId".
    - return [int(item["productId"]) for item in data]
    - Nếu lỗi: log error, return []

    Returns:
        List[int]: Danh sách product_id phổ biến.
    """
    # TODO: Triển khai theo gợi ý trên
    # try:
    #     data = _call_service(
    #         "review-service",
    #         "/api/reviews/internal/popular-products",
    #         params={"limit": limit},
    #     )
    #     return [int(item["productId"]) for item in data]
    # except Exception as exc:
    #     logger.error("fetch_popular_products_via_api lỗi: %s", exc)
    #     return []
    return []


def fetch_all_ratings_via_api() -> list:
    """Lấy TOÀN BỘ ratings đã duyệt từ review-service (cho training).

    Endpoint: GET /api/reviews/internal/all-ratings
    ⚠️  Dùng HTTP_TIMEOUT_BULK (120s) vì dữ liệu lớn.

    Gợi ý triển khai:
    -----------------
    - Gọi _call_service("review-service", "/api/reviews/internal/all-ratings", timeout=HTTP_TIMEOUT_BULK)
    - return data trực tiếp (là list[dict] với keys: userId, productId, rating)
    - Nếu lỗi: log error, return []

    Returns:
        List[dict]: [{"userId": int, "productId": int, "rating": float}, ...]
    """
    # TODO: Triển khai theo gợi ý trên
    # try:
    #     data = _call_service(
    #         "review-service",
    #         "/api/reviews/internal/all-ratings",
    #         timeout=HTTP_TIMEOUT_BULK,
    #     )
    #     return data
    # except Exception as exc:
    #     logger.error("fetch_all_ratings_via_api lỗi: %s", exc)
    #     return []
    return []


# ═══════════════════════════════════════════════════════════════════════════
# Order Service API
# ═══════════════════════════════════════════════════════════════════════════

def fetch_user_purchased_products_via_api(user_id: int) -> list:
    """Lấy danh sách product_id đã mua (status hợp lệ) từ order-service API.

    Endpoint: GET /api/orders/internal/users/{user_id}/purchased-products

    Gợi ý triển khai:
    -----------------
    - Gọi _call_service("order-service", f"/api/orders/internal/users/{user_id}/purchased-products")
    - response là list product_id.
    - return [int(pid) for pid in data]
    - Nếu lỗi: log error, return []

    Returns:
        List[int]: Danh sách product_id đã mua.
    """
    # TODO: Triển khai theo gợi ý trên
    # try:
    #     data = _call_service(
    #         "order-service",
    #         f"/api/orders/internal/users/{user_id}/purchased-products",
    #     )
    #     return [int(pid) for pid in data]
    # except Exception as exc:
    #     logger.error("fetch_user_purchased_products lỗi (user_id=%s): %s", user_id, exc)
    #     return []
    return []


def fetch_all_purchased_products_via_api() -> list:
    """Lấy TOÀN BỘ cặp (user_id, product_id) đã mua (cho training).

    Endpoint: GET /api/orders/internal/all-purchased-products
    ⚠️  Dùng HTTP_TIMEOUT_BULK (120s) vì dữ liệu lớn.

    Gợi ý triển khai:
    -----------------
    - Gọi _call_service("order-service", "/api/orders/internal/all-purchased-products", timeout=HTTP_TIMEOUT_BULK)
    - return data trực tiếp (là list[dict] với keys: userId, productId)
    - Nếu lỗi: log error, return []

    Returns:
        List[dict]: [{"userId": int, "productId": int}, ...]
    """
    # TODO: Triển khai theo gợi ý trên
    # try:
    #     data = _call_service(
    #         "order-service",
    #         "/api/orders/internal/all-purchased-products",
    #         timeout=HTTP_TIMEOUT_BULK,
    #     )
    #     return data
    # except Exception as exc:
    #     logger.error("fetch_all_purchased_products_via_api lỗi: %s", exc)
    #     return []
    return []
