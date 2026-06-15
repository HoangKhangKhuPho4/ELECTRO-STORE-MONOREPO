"""
recommend.py — Gợi ý sản phẩm (Item-based CF).

Đọc model từ thư mục asset/ (metadata.json, item_similarity_topk.npz).
Chạy qua FastAPI: app.py import cf_service từ module này.

============================================================
  📌 HƯỚNG DẪN DÀNH CHO TEAM MEMBERS
  Hoàn thiện từng method của class ItemBasedCFService.
  Không được thay đổi tên class, tên method, hay signature.
============================================================
"""

import os
import json
import logging
import pickle
import threading
from collections import defaultdict

import numpy as np
from scipy.sparse import load_npz

from config.settings import MODEL_DIR, ITEM_CF_NEIGHBORS
from collaborativefiltering.data_sources import fetch_user_seed_ratings, fetch_popular_product_ids

logger = logging.getLogger(__name__)

COLD_START_DEFAULT_SCORE = 4.9
FILL_DEFAULT_SCORE = 4.8


class ItemBasedCFService:
    """Item-based CF: tương đồng hàng × rating seed."""

    def __init__(self):
        self.item_sim = None
        self.metadata = None
        self.knn_model = None
        self.is_loading = False
        self._lock = threading.Lock()
        self.load_model()

    # ------------------------------------------------------------------
    # Load Model
    # ------------------------------------------------------------------

    def load_model(self):
        """Tải toàn bộ artifacts từ disk vào RAM.

        Gợi ý triển khai:
        -----------------
        - Kiểm tra self.is_loading; nếu đang load thì return False ngay.
        - Dùng with self._lock để thread-safe.
        - Đặt self.is_loading = True trong try, False trong finally.
        - Gọi lần lượt:
            self._load_knn_matrices()   → trả về False nếu thiếu file
            self._load_metadata()       → trả về False nếu thiếu file
            self._load_knn_model_optional()  → không bắt buộc
        - Log stats từ self.metadata["stats"].
        - Return True nếu thành công, False nếu có lỗi.
        """
        # TODO: Triển khai theo gợi ý trên
        # if self.is_loading:
        #     return False
        # with self._lock:
        #     self.is_loading = True
        #     try:
        #         ...
        #     except Exception as exc:
        #         logger.error("Load model lỗi: %s", exc)
        #         return False
        #     finally:
        #         self.is_loading = False
        return False

    def _load_knn_matrices(self):
        """Load file item_similarity_topk.npz vào self.item_sim.

        Gợi ý:
        - sim_path = os.path.join(MODEL_DIR, "item_similarity_topk.npz")
        - Kiểm tra file tồn tại bằng os.path.exists().
        - Nếu không tồn tại: log warning, return False.
        - Nếu tồn tại: self.item_sim = load_npz(sim_path), return True.
        """
        # TODO: Triển khai theo gợi ý trên
        # sim_path = os.path.join(MODEL_DIR, "item_similarity_topk.npz")
        # if not os.path.exists(sim_path):
        #     logger.warning("Thiếu %s — chạy: python collaborativefiltering/train.py", sim_path)
        #     return False
        # self.item_sim = load_npz(sim_path)
        # return True
        return False

    def _load_metadata(self):
        """Load file metadata.json vào self.metadata.

        Gợi ý:
        - meta_path = os.path.join(MODEL_DIR, "metadata.json")
        - Kiểm tra file tồn tại bằng os.path.exists().
        - Nếu không tồn tại: log warning, return False.
        - Nếu tồn tại: đọc json vào self.metadata, return True.
        """
        # TODO: Triển khai theo gợi ý trên
        # meta_path = os.path.join(MODEL_DIR, "metadata.json")
        # if not os.path.exists(meta_path):
        #     logger.warning("Thiếu %s", meta_path)
        #     return False
        # with open(meta_path, "r", encoding="utf-8") as fh:
        #     self.metadata = json.load(fh)
        # return True
        return False

    def _load_knn_model_optional(self):
        """Load best_knn_model.pkl nếu tồn tại (không bắt buộc).

        Gợi ý:
        - path = os.path.join(MODEL_DIR, "best_knn_model.pkl")
        - Nếu tồn tại: pickle.load, lấy artifact["model"] gán vào self.knn_model.
        - Nếu không: self.knn_model = None.
        """
        # TODO: Triển khai theo gợi ý trên
        # path = os.path.join(MODEL_DIR, "best_knn_model.pkl")
        # if os.path.exists(path):
        #     with open(path, "rb") as fh:
        #         artifact = pickle.load(fh)
        #     self.knn_model = artifact.get("model")
        # else:
        #     self.knn_model = None
        self.knn_model = None

    # ------------------------------------------------------------------
    # Recommendation Pipeline
    # ------------------------------------------------------------------

    def get_recommendations(self, user_id, top_n=10):
        """Entry point: Trả về danh sách gợi ý cho user_id.

        Gợi ý triển khai:
        -----------------
        1. Kiểm tra model đã load chưa (self.metadata is None hoặc self.item_sim is None).
           Nếu chưa, return ("Warming Up (chưa có model Item-CF)", []).

        2. Lấy product_map, popular, user_map từ self.metadata.

        3. Gọi self._resolve_seed_ratings(user_id, str(user_id), user_map)
           → (seed_ratings, source)

        4. Nếu seed_ratings rỗng → gọi self._popular_fallback(popular, top_n, "...").

        5. Nếu có seed_ratings:
           - interacted = {pid for pid, _ in seed_ratings}
           - candidates = self._score_item_neighbors(seed_ratings, product_map, interacted)
           - strategy = "Item-based CF (%s, seeds=%d)" % (source, len(seed_ratings))
           - return self._fill_recommendations(candidates, popular, interacted, top_n, strategy)

        Returns:
            (strategy: str, recommendations: List[dict])
        """
        # TODO: Triển khai theo gợi ý trên
        # if not self.metadata or self.item_sim is None:
        #     return "Warming Up (chưa có model Item-CF)", []
        # ...
        return "Not Implemented", []

    def _resolve_seed_ratings(self, user_id, str_uid, user_map):
        """Merge seed ratings từ live API + offline training data.

        Gợi ý triển khai:
        -----------------
        1. Gọi fetch_user_seed_ratings(user_id) → (live, source).

        2. Nếu str_uid có trong user_map và metadata có "offline_user_ratings":
           a. Lấy offline = metadata["offline_user_ratings"].get(str_uid, [])
           b. Nếu có offline nhưng KHÔNG có live:
              → return [(int(p), float(r)) for p, r in offline], "trained_user_offline"
           c. Nếu có cả 2:
              → Merge: giữ live, thêm offline nếu product chưa có trong seen
              → return merged, "trained_user_hybrid"

        3. Fallback: return live, source.

        Returns:
            (seed_ratings: List[Tuple[int,float]], source: str)
        """
        # TODO: Triển khai theo gợi ý trên
        # live, source = fetch_user_seed_ratings(user_id)
        # if str_uid in user_map and self.metadata.get("offline_user_ratings"):
        #     offline = self.metadata["offline_user_ratings"].get(str_uid, [])
        #     if offline and not live:
        #         return [(int(p), float(r)) for p, r in offline], "trained_user_offline"
        #     if offline:
        #         seen = {p for p, _ in live}
        #         merged = list(live)
        #         for p, r in offline:
        #             if int(p) not in seen:
        #                 merged.append((int(p), float(r)))
        #         return merged, "trained_user_hybrid"
        # return live, source
        return [], "none"

    def _score_item_neighbors(self, seed_ratings, product_map, interacted):
        """Tính điểm gợi ý bằng Item-Item similarity × seed rating.

        Gợi ý triển khai:
        -----------------
        1. Khởi tạo: scores = defaultdict(float)

        2. Với mỗi (pid, rating) trong seed_ratings:
           a. Kiểm tra str(pid) có trong product_map → lấy idx.
           b. Lấy hàng similarity: row = self.item_sim[idx].toarray().flatten()
           c. Nếu row.max() <= 0 → bỏ qua.
           d. Lấy top indices: top_indices = np.argsort(row)[::-1][:ITEM_CF_NEIGHBORS]
           e. Với mỗi n_idx trong top_indices:
              - sim = float(row[n_idx]); nếu sim <= 0 → bỏ qua
              - neighbor_pid = int(metadata["reverse_product_map"][str(n_idx)])
              - Nếu neighbor_pid in interacted → bỏ qua
              - scores[neighbor_pid] += sim * float(rating)

        3. Tạo list candidates = [{"product_id": pid, "predicted_rating": round(score, 4)} ...]
           Sort theo predicted_rating descending.

        4. Return candidates.

        Returns:
            List[dict]: [{"product_id": int, "predicted_rating": float}, ...]
        """
        # TODO: Triển khai theo gợi ý trên
        # scores = defaultdict(float)
        # for pid, rating in seed_ratings:
        #     pid_str = str(pid)
        #     if pid_str not in product_map:
        #         continue
        #     idx = product_map[pid_str]
        #     row = self.item_sim[idx].toarray().flatten()
        #     if row.max() <= 0:
        #         continue
        #     top_indices = np.argsort(row)[::-1][:ITEM_CF_NEIGHBORS]
        #     for n_idx in top_indices:
        #         sim = float(row[n_idx])
        #         if sim <= 0:
        #             continue
        #         neighbor_pid = int(self.metadata["reverse_product_map"][str(n_idx)])
        #         if neighbor_pid in interacted:
        #             continue
        #         scores[neighbor_pid] += sim * float(rating)
        # candidates = [
        #     {"product_id": pid, "predicted_rating": round(score, 4)}
        #     for pid, score in scores.items()
        # ]
        # candidates.sort(key=lambda x: x["predicted_rating"], reverse=True)
        # return candidates
        return []

    def _fill_recommendations(self, candidates, popular, interacted, top_n, strategy):
        """Bổ sung gợi ý bằng popular items nếu chưa đủ top_n.

        Gợi ý triển khai:
        -----------------
        1. Lấy recs = candidates[:top_n].
        2. used = {x["product_id"] for x in recs}
        3. Nếu len(recs) < top_n: lặp qua popular, thêm những pid chưa trong used/interacted
           với predicted_rating = FILL_DEFAULT_SCORE, cho đến khi đủ top_n.
        4. Return (strategy, recs).

        Returns:
            (strategy: str, recs: List[dict])
        """
        # TODO: Triển khai theo gợi ý trên
        # recs = candidates[:top_n]
        # used = {x["product_id"] for x in recs}
        # if len(recs) < top_n:
        #     for pid in popular:
        #         ipid = int(pid)
        #         if ipid in used or ipid in interacted:
        #             continue
        #         recs.append({"product_id": ipid, "predicted_rating": FILL_DEFAULT_SCORE})
        #         used.add(ipid)
        #         if len(recs) >= top_n:
        #             break
        # return strategy, recs
        return strategy, []

    def _popular_fallback(self, popular, top_n, strategy):
        """Fallback: trả về popular items khi không có seed ratings (cold-start).

        Gợi ý triển khai:
        -----------------
        1. Nếu popular rỗng → gọi fetch_popular_product_ids(top_n).
        2. Tạo list recs:
           [{"product_id": int(pid), "predicted_rating": COLD_START_DEFAULT_SCORE}
            for pid in popular[:top_n]]
        3. Return (strategy, recs).

        Returns:
            (strategy: str, recs: List[dict])
        """
        # TODO: Triển khai theo gợi ý trên
        # if not popular:
        #     popular = fetch_popular_product_ids(top_n)
        # recs = [
        #     {"product_id": int(pid), "predicted_rating": COLD_START_DEFAULT_SCORE}
        #     for pid in popular[:top_n]
        # ]
        # return strategy, recs
        return strategy, []


cf_service = ItemBasedCFService()
