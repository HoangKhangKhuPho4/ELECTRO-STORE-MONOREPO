"""
train.py — Huấn luyện Item-based Collaborative Filtering.

Lấy dữ liệu từ các microservice qua REST API (tuân thủ microservices architecture).
Lưu artifact vào collaborativefiltering/asset/ (metadata.json, *.npz, *.pkl).

Chạy:
  python collaborativefiltering/train.py
  hoặc: .\\scripts\\RUN_TRAINING.ps1

============================================================
  📌 HƯỚNG DẪN DÀNH CHO TEAM MEMBERS
  Hoàn thiện từng hàm theo gợi ý bên dưới.
  Không được thay đổi tên hàm, tên biến, hoặc phần import.
============================================================
"""

import os
import sys
import time
import json
import pickle
import logging

import numpy as np
import pandas as pd
from scipy.sparse import coo_matrix, csr_matrix, save_npz
from sklearn.metrics.pairwise import cosine_similarity
from surprise import Dataset, Reader, KNNWithMeans

from config.settings import (
    FAKE_PURCHASE_RATING,
    MODEL_DIR,
)
from collaborativefiltering.service_client import (
    fetch_all_ratings_via_api,
    fetch_all_purchased_products_via_api,
    fetch_popular_products_via_api,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Hằng số cấu hình (KHÔNG THAY ĐỔI)
# ---------------------------------------------------------------------------
KNN_SURPRISE_K = 40

MIN_USER_INTERACTIONS = 2
MAX_USER_INTERACTIONS = 500
MIN_PRODUCT_INTERACTIONS = 2
TOP_K_NEIGHBORS = 50
MOCK_NUM_RECORDS = 8000
MOCK_NUM_USERS_RANGE = (10001, 10091)
MOCK_NUM_PRODUCTS_RANGE = (20001, 20181)
HOT_ITEMS_LIMIT = 50
SEED_NUM_USERS = 80


# ===================================================================
# 1. Đọc dữ liệu từ các Microservice qua REST API
# ===================================================================

def fetch_training_ratings():
    """Đọc ratings thật + mua chưa review từ các microservice API.

    Gợi ý triển khai:
    -----------------
    1. Gọi `fetch_all_ratings_via_api()` để lấy danh sách ratings đã duyệt
       từ review-service. Mỗi phần tử là dict với keys: userId, productId, rating.
       → Tạo df_reviews, rename camelCase sang snake_case (user_id, product_id),
         ép kiểu cột "rating" sang float.

    2. Gọi `fetch_all_purchased_products_via_api()` để lấy tất cả cặp
       (userId, productId) đã mua từ order-service.
       → Tạo df_purchases, gán cột "rating" = FAKE_PURCHASE_RATING.

    3. Loại bỏ các cặp (user_id, product_id) trong df_purchases nếu cặp đó
       đã xuất hiện trong df_reviews (người dùng đã review rồi thì không cần
       fake rating nữa).
       → Dùng set để tạo reviewed_pairs rồi lọc df_purchases bằng .apply().

    4. Return (df_reviews, df_purchases).

    Returns:
        df_reviews  (pd.DataFrame): columns=[user_id, product_id, rating]
        df_purchases(pd.DataFrame): columns=[user_id, product_id, rating]
    """
    logger.info("Đọc dữ liệu train từ review-service và order-service API...")

    # TODO: Bước 1 — Lấy ratings từ review-service
    # ratings_data = fetch_all_ratings_via_api()
    # ...
    df_reviews = pd.DataFrame(columns=["user_id", "product_id", "rating"])

    # TODO: Bước 2 — Lấy purchased products từ order-service
    # purchases_data = fetch_all_purchased_products_via_api()
    # ...
    df_purchases = pd.DataFrame(columns=["user_id", "product_id", "rating"])

    # TODO: Bước 3 — Loại bỏ cặp (user, product) đã có review thật
    # reviewed_pairs = set(zip(...))
    # mask = df_purchases.apply(lambda r: ..., axis=1)
    # df_purchases = df_purchases[mask]

    logger.info("   [Reviews API] %d bản ghi đã duyệt.", len(df_reviews))
    logger.info("   [Purchases API] %d cặp user-product chưa review.", len(df_purchases))

    return df_reviews, df_purchases


# ===================================================================
# 2. Làm sạch và lọc nhiễu
# ===================================================================
def build_clean_dataframe(df_reviews, df_purchases):
    """Hợp nhất reviews + purchases; ưu tiên rating thật cao hơn.

    Gợi ý triển khai:
    -----------------
    1. Dùng pd.concat() để gộp df_reviews và df_purchases thành df_all.

    2. Group by [user_id, product_id] rồi lấy max rating (để giữ rating thật
       nếu có, bỏ fake rating thấp hơn).
       → df_merged = df_all.groupby([...], as_index=False)["rating"].max()

    3. Lọc user theo số lần tương tác:
       - Tính value_counts() của user_id.
       - Chỉ giữ user có: MIN_USER_INTERACTIONS <= count <= MAX_USER_INTERACTIONS.

    4. Lọc product theo số lần tương tác:
       - Tính value_counts() của product_id.
       - Chỉ giữ product có: count >= MIN_PRODUCT_INTERACTIONS.

    5. Return df_filtered.

    Returns:
        df_filtered (pd.DataFrame): Dữ liệu sạch, columns=[user_id, product_id, rating]
    """
    logger.info("Bắt đầu dọn dẹp & lọc nhiễu (Denoising)...")

    # TODO: Bước 1 — Concat 2 dataframe
    # df_all = pd.concat([df_reviews, df_purchases], ignore_index=True)

    # TODO: Bước 2 — Groupby lấy max rating
    # df_merged = df_all.groupby([...], as_index=False)["rating"].max()

    # TODO: Bước 3 — Lọc user hợp lệ (MIN_USER_INTERACTIONS <= count <= MAX_USER_INTERACTIONS)
    # user_counts = ...
    # valid_users = user_counts[(user_counts >= ...) & (user_counts <= ...)].index
    # df_filtered = df_merged[df_merged["user_id"].isin(valid_users)]

    # TODO: Bước 4 — Lọc product hợp lệ (count >= MIN_PRODUCT_INTERACTIONS)
    # product_counts = ...
    # df_filtered = df_filtered[df_filtered["product_id"].isin(...)]

    df_filtered = pd.DataFrame(columns=["user_id", "product_id", "rating"])  # REMOVE dòng này khi code xong
    logger.info(
        "   Bộ dữ liệu sạch: %d tương tác | %d users | %d products",
        len(df_filtered), df_filtered["user_id"].nunique(), df_filtered["product_id"].nunique(),
    )
    return df_filtered


# ===================================================================
# 4. Trích xuất Hot Items
# ===================================================================
def extract_popular_products(top_n=HOT_ITEMS_LIMIT):
    """Sản phẩm phổ biến từ review-service API.

    Gợi ý triển khai:
    -----------------
    - Wrap lời gọi `fetch_popular_products_via_api(limit=top_n)` trong try/except.
    - Nếu thành công, log số lượng và return list.
    - Nếu thất bại, log lỗi và return [].

    Returns:
        List[int]: Danh sách product_id phổ biến nhất.
    """
    # TODO: Gọi fetch_popular_products_via_api(limit=top_n)
    # try:
    #     hot_list = fetch_popular_products_via_api(limit=top_n)
    #     ...
    #     return hot_list
    # except Exception as exc:
    #     ...
    #     return []
    return []


# ===================================================================
# 5. Mock Fallback Data
# ===================================================================
def _get_mock_fallback_data():
    """Tự sinh dữ liệu giả lập chất lượng cao nếu API không khả dụng.

    Gợi ý triển khai:
    -----------------
    1. Dùng np.random.seed(42) để đảm bảo tái tạo được.

    2. Sinh ngẫu nhiên:
       - user_ids: MOCK_NUM_RECORDS giá trị trong MOCK_NUM_USERS_RANGE
       - product_ids: MOCK_NUM_RECORDS giá trị trong MOCK_NUM_PRODUCTS_RANGE
       - ratings: np.random.choice([1.5, 3.0, 3.5, 5.0], ..., p=[0.55, 0.20, 0.15, 0.10])

    3. Tạo DataFrame, groupby lấy max rating (giống build_clean_dataframe).

    4. Lọc user/product theo MIN_USER_INTERACTIONS và MIN_PRODUCT_INTERACTIONS.

    5. Tính hot_items: group by product_id, sum rating, sort desc, lấy HOT_ITEMS_LIMIT đầu.
       → hot_items = [int(x) for x in pop_series.sort_values(ascending=False).index[:HOT_ITEMS_LIMIT]]

    6. Return (df_clean, hot_items).

    Returns:
        df_clean   (pd.DataFrame): Mock training data đã lọc.
        hot_items  (List[int])   : Danh sách product_id phổ biến trong mock data.
    """
    logger.warning("Không thể gọi API microservices. Chuyển sang Chế độ Giả lập (Mock Data Fallback)...")

    # TODO: Sinh dữ liệu giả lập theo gợi ý trên
    # np.random.seed(42)
    # user_ids = np.random.randint(*MOCK_NUM_USERS_RANGE, MOCK_NUM_RECORDS)
    # ...

    df_clean = pd.DataFrame(columns=["user_id", "product_id", "rating"])  # REMOVE khi code xong
    hot_items = []  # REMOVE khi code xong

    logger.info(
        "   Mock Data Fallback: %d tương tác | %d users | %d products",
        len(df_clean), df_clean["user_id"].nunique(), df_clean["product_id"].nunique(),
    )
    return df_clean, hot_items


# ===================================================================
# 6. Surprise KNN item-based (artifact)
# ===================================================================
def _train_surprise_item_knn(df_clean):
    """Huấn luyện KNN item-based (Surprise) — lưu best_knn_model.pkl.

    Gợi ý triển khai:
    -----------------
    1. Copy df_clean và ép kiểu user_id, product_id sang str.

    2. Dùng Reader(rating_scale=(1.0, 5.0)) và Dataset.load_from_df() để chuẩn
       bị dữ liệu cho thư viện Surprise.
       → data = Dataset.load_from_df(df_knn[[...]], reader)
       → trainset = data.build_full_trainset()

    3. Tạo KNNWithMeans với:
       - k = KNN_SURPRISE_K
       - sim_options = {"name": "cosine", "user_based": False}  ← item-based!

    4. Gọi model.fit(trainset) để huấn luyện.

    5. Return (model, trainset).

    Returns:
        model    (KNNWithMeans): Model KNN item-based đã train.
        trainset (Trainset)    : Trainset của Surprise.
    """
    # TODO: Triển khai theo gợi ý trên
    # df_knn = df_clean.copy()
    # df_knn["user_id"] = df_knn["user_id"].astype(str)
    # ...
    # reader = Reader(rating_scale=(1.0, 5.0))
    # data = Dataset.load_from_df(df_knn[[...]], reader)
    # trainset = data.build_full_trainset()
    # sim_options = {"name": "cosine", "user_based": False}
    # model = KNNWithMeans(k=KNN_SURPRISE_K, sim_options=sim_options)
    # model.fit(trainset)
    # return model, trainset
    raise NotImplementedError("TODO: Hãy triển khai _train_surprise_item_knn()")


# ===================================================================
# 7. Xây dựng KNN Matrix & Cosine Similarity
# ===================================================================
def _build_knn_artifacts(df_clean):
    """Xây dựng ma trận User-Item và tính Cosine Similarity Top-K.

    Gợi ý triển khai:
    -----------------
    1. Lấy danh sách unique user_ids và product_ids từ df_clean.

    2. Tạo 2 dict ánh xạ:
       - user_to_index:    {int(uid): i for i, uid in enumerate(user_ids)}
       - product_to_index: {int(pid): i for i, pid in enumerate(product_ids)}

    3. Map các cột u_idx và p_idx vào df_clean.

    4. Xây dựng sparse matrix (User × Item) bằng coo_matrix() rồi .tocsr().
       → shape = (len(user_ids), len(product_ids))
       → giá trị = cột "rating"

    5. Tính item_sim = cosine_similarity(matrix.T)
       → np.fill_diagonal(item_sim, 0)  ← loại self-similarity

    6. Giữ lại Top-K neighbors: với mỗi hàng i, nếu số non-zero > k,
       đặt các giá trị nhỏ hơn kth_val = np.partition(row, -k)[-k] về 0.

    7. Chuyển item_sim → csr_matrix(item_sim) để tiết kiệm RAM.

    8. Return (matrix, item_sim_sparse, user_to_index, product_to_index).

    Returns:
        matrix           (csr_matrix): Ma trận User-Item.
        item_sim_sparse  (csr_matrix): Ma trận Item-Item similarity (sparse).
        user_to_index    (dict)      : {user_id: row_index}
        product_to_index (dict)      : {product_id: col_index}
    """
    logger.info("Đang xây dựng Ma Trận User-Item & Cosine Similarities...")

    # TODO: Bước 1-2: Lấy unique ids và tạo index map
    # user_ids = df_clean["user_id"].unique()
    # product_ids = df_clean["product_id"].unique()
    # user_to_index = {int(uid): i for i, uid in enumerate(user_ids)}
    # product_to_index = ...

    # TODO: Bước 3: Map index vào df
    # df_clean = df_clean.copy()
    # df_clean["u_idx"] = df_clean["user_id"].map(user_to_index)
    # df_clean["p_idx"] = df_clean["product_id"].map(product_to_index)

    # TODO: Bước 4: Xây dựng sparse matrix
    # matrix = coo_matrix(
    #     (df_clean["rating"], (df_clean["u_idx"], df_clean["p_idx"])),
    #     shape=(len(user_ids), len(product_ids)),
    # ).tocsr()

    # TODO: Bước 5: Tính cosine similarity item-item
    # item_sim = cosine_similarity(matrix.T)
    # np.fill_diagonal(item_sim, 0)

    # TODO: Bước 6: Giữ lại Top-K neighbors
    # k = min(TOP_K_NEIGHBORS, len(product_ids) - 1)
    # for i in range(item_sim.shape[0]):
    #     row = item_sim[i]
    #     if np.count_nonzero(row) > k:
    #         kth_val = np.partition(row, -k)[-k]
    #         row[row < kth_val] = 0
    #         item_sim[i] = row

    # TODO: Bước 7: Convert sang sparse
    # item_sim_sparse = csr_matrix(item_sim)

    raise NotImplementedError("TODO: Hãy triển khai _build_knn_artifacts()")


# ===================================================================
# 8. Serialize & Xuất Artifacts
# ===================================================================
def _build_offline_user_ratings(df_clean):
    """Map user_id -> list [product_id, rating] cho nhóm user đã có trong train set.

    Gợi ý triển khai:
    -----------------
    - Dùng df_clean.groupby("user_id") để duyệt từng user.
    - Với mỗi user, tạo list [[product_id, rating], ...].
    - Key của dict là str(int(uid)), value là list trên.

    Returns:
        dict: {str(user_id): [[product_id, rating], ...]}
    """
    # TODO: Triển khai theo gợi ý trên
    # offline = {}
    # for uid, grp in df_clean.groupby("user_id"):
    #     offline[str(int(uid))] = [
    #         [int(row["product_id"]), float(row["rating"])]
    #         for _, row in grp.iterrows()
    #     ]
    # return offline
    return {}


def _serialize_all_artifacts(
    knn_model, trainset, matrix, item_sim_sparse,
    user_to_index, product_to_index, popular_items, df_clean, use_fallback,
):
    """Lưu toàn bộ model artifacts ra disk.

    Gợi ý triển khai:
    -----------------
    A. Lưu KNN model (pickle):
       - Tạo dict knn_artifact gồm: model, model_type, trained_at, n_users, n_items, n_ratings.
       - Pickle dump vào: os.path.join(MODEL_DIR, "best_knn_model.pkl")

    B. Lưu sparse matrices (npz):
       - item_similarity_topk.npz: save_npz(path, item_sim_sparse)
       - user_item_matrix.npz    : save_npz(path, matrix)

    C. Lưu metadata (json):
       - Tạo dict metadata gồm: version, model_type, data_source, trained_at,
         stats (users, products, interactions), user_map, product_map,
         reverse_product_map, popular_products, best_sellers, offline_user_ratings.
       - data_source = "MockDataEngine" nếu use_fallback else "microservices-api"
       - reverse_product_map = {str(v): int(k) for k, v in product_to_index.items()}
       - Gọi _build_offline_user_ratings(df_clean) để lấy offline_user_ratings.
       - json.dump vào: os.path.join(MODEL_DIR, "metadata.json")
    """
    logger.info("Đang serialize & đồng bộ hóa Model Artifacts...")

    # TODO: A — Lưu KNN model dạng pickle
    # knn_filepath = os.path.join(MODEL_DIR, "best_knn_model.pkl")
    # knn_artifact = {...}
    # with open(knn_filepath, "wb") as fh:
    #     pickle.dump(knn_artifact, fh)

    # TODO: B — Lưu sparse matrices
    # knn_matrix_path = os.path.join(MODEL_DIR, "item_similarity_topk.npz")
    # user_matrix_path = os.path.join(MODEL_DIR, "user_item_matrix.npz")
    # save_npz(knn_matrix_path, item_sim_sparse)
    # save_npz(user_matrix_path, matrix)

    # TODO: C — Lưu metadata JSON
    # metadata = {
    #     "version": "4.0.0-item-cf",
    #     "model_type": "item_based_cf",
    #     "data_source": "MockDataEngine" if use_fallback else "microservices-api",
    #     "trained_at": time.time(),
    #     "stats": {...},
    #     "user_map": {str(k): int(v) for k, v in user_to_index.items()},
    #     "product_map": {str(k): int(v) for k, v in product_to_index.items()},
    #     "reverse_product_map": {str(v): int(k) for k, v in product_to_index.items()},
    #     "popular_products": popular_items,
    #     "best_sellers": popular_items,
    #     "offline_user_ratings": _build_offline_user_ratings(df_clean),
    # }
    # metadata_filepath = os.path.join(MODEL_DIR, "metadata.json")
    # with open(metadata_filepath, "w", encoding="utf-8") as fh:
    #     json.dump(metadata, fh, indent=4, ensure_ascii=False)
    pass


# ===================================================================
# Main Pipeline
# ===================================================================
def main():
    """Chạy pipeline huấn luyện Item-based Collaborative Filtering.

    Gợi ý luồng thực hiện:
    ----------------------
    1. os.makedirs(MODEL_DIR, exist_ok=True) — đảm bảo thư mục tồn tại.
    2. Gọi fetch_training_ratings() → df_reviews, df_purchases.
    3. Nếu cả 2 rỗng → đặt use_fallback = True.
    4. Nếu có dữ liệu thật:
       - Gọi build_clean_dataframe(df_reviews, df_purchases) → df_clean
       - Gọi extract_popular_products(top_n=HOT_ITEMS_LIMIT) → popular_items
    5. Nếu API lỗi (catch Exception) → use_fallback = True.
    6. Nếu use_fallback → gọi _get_mock_fallback_data() → df_clean, popular_items.
    7. Gọi _train_surprise_item_knn(df_clean) → knn_model, trainset.
    8. Gọi _build_knn_artifacts(df_clean) → matrix, item_sim_sparse, user_to_index, product_to_index.
    9. Gọi _serialize_all_artifacts(...) để lưu toàn bộ ra disk.
    10. Log thời gian hoàn thành.
    """
    t_start = time.time()
    logger.info("=" * 70)
    logger.info("BẮT ĐẦU HUẤN LUYỆN ITEM-BASED CF (via Microservices API)")
    logger.info("=" * 70)

    os.makedirs(MODEL_DIR, exist_ok=True)

    use_fallback = False
    popular_items = []

    # TODO: Bước 2-5: Lấy dữ liệu thật hoặc set use_fallback
    # try:
    #     df_reviews, df_purchases = fetch_training_ratings()
    #     if len(df_reviews) == 0 and len(df_purchases) == 0:
    #         use_fallback = True
    #     else:
    #         df_clean = build_clean_dataframe(df_reviews, df_purchases)
    #         popular_items = extract_popular_products(top_n=HOT_ITEMS_LIMIT)
    # except Exception as api_err:
    #     logger.error("Lỗi gọi API microservices: %s", api_err)
    #     use_fallback = True

    # TODO: Bước 6: Fallback
    # if use_fallback:
    #     df_clean, popular_items = _get_mock_fallback_data()

    # TODO: Bước 7-9: Train, build, serialize
    # knn_model, trainset = _train_surprise_item_knn(df_clean)
    # matrix, item_sim_sparse, user_to_index, product_to_index = _build_knn_artifacts(df_clean)
    # _serialize_all_artifacts(
    #     knn_model, trainset, matrix, item_sim_sparse,
    #     user_to_index, product_to_index, popular_items, df_clean, use_fallback,
    # )

    t_end = time.time()
    logger.info("=" * 70)
    logger.info("HUẤN LUYỆN & ĐÓNG GÓI HOÀN THÀNH TRONG %.2fs!", t_end - t_start)
    logger.info("=" * 70)


if __name__ == "__main__":
    main()
