from collections import defaultdict
from typing import Any

from sqlalchemy.orm import Session

from app.repositories.order_repository import fetch_user_purchases
from app.schemas import (
    BaselineUI, 
    CandidateExplanation,
    ExplanationTerm,
    RecommendExplainResponse,
    RecommendItem,
    RecommendResponse,
    RetrainResponse,
)    
from app.services.model_store import load_model
from app.services.train import train_model

def _normalize_top_n(top_n: int) -> int:
    try:
        value = int(top_n)
    except (TypeError, ValueError):
        return 10
    return max(1, min(value, 50))


def _clip(est: float, low: float = 1.0, high: float = 5.0) -> float:
    return max(low, min(high, est))


def _fill_with_popular(
    recommendations: list[RecommendItem],
    popular_product_ids: list[int],
    excluded: set[int],
    top_n: int,
) -> None:
    existing = {r.product_id for r in recommendations}
    for pid in popular_product_ids:
        if len(recommendations) >= top_n:
            break
        pid = int(pid)
        if pid in existing or pid in excluded:
            continue
        recommendations.append(RecommendItem(product_id=pid, predicted_rating=None))
        existing.add(pid)


def _get_bu(algo: Any, inner_uid: int) -> float:
    if inner_uid < 0:
        return 0.0
    try:
        return float(algo.bu[inner_uid])
    except Exception:
        return 0.0


def _get_bi(algo: Any, inner_iid: int) -> float:
    if inner_iid < 0:
        return 0.0
    try:
        return float(algo.bi[inner_iid])
    except Exception:
        return 0.0


def _baseline_ui(algo: Any, inner_uid: int, inner_iid: int, global_mean: float) -> BaselineUI:
    mu = float(global_mean)
    bu = _get_bu(algo, inner_uid)
    bi = _get_bi(algo, inner_iid)
    return BaselineUI(mu=mu, bu=bu, bi=bi, b_ui=mu + bu + bi)


def item_based_knn_baseline_predict_single(
    algo: Any,
    trainset: Any,
    inner_uid: int,
    raw_iid: int,
    k: int = 40,
) -> float:
    global_mean = float(trainset.global_mean)
    
    try:
        inner_iid = trainset.to_inner_iid(raw_iid)
    except ValueError:
        bu = _get_bu(algo, inner_uid)
        return _clip(global_mean + bu)

    bu = _get_bu(algo, inner_uid)
    bj = _get_bi(algo, inner_iid)
    b_uj = global_mean + bu + bj

    try:
        user_ratings = trainset.ur[inner_uid]
    except (IndexError, KeyError):
        return _clip(b_uj)

    rated_dict = {iid: r for iid, r in user_ratings}
    neighbors = algo.get_neighbors(inner_iid, k=k)
    
    numerator = 0.0
    denominator = 0.0

    for neighbor_iid in neighbors:
        if neighbor_iid not in rated_dict:
            continue

        sim_ji = float(algo.sim[inner_iid, neighbor_iid])

        if sim_ji <= 0:
            continue

        r_ui = float(rated_dict[neighbor_iid])
        bi_neighbor = _get_bi(algo, neighbor_iid)
        b_ui = global_mean + bu + bi_neighbor
        residual = r_ui - b_ui

        numerator += sim_ji * residual
        denominator += sim_ji

    if denominator > 0:
        est = b_uj + (numerator / denominator)
    else:
        est = b_uj

    return _clip(est)   


def item_based_knn_baseline_predict(
    algo: Any,
    trainset: Any,
    inner_uid: int,
    k: int = 40,
) -> list[tuple[int, float]]:   
    try:
        rated_set = {iid for iid, _ in trainset.ur[inner_uid]}
    except (IndexError, KeyError):
        return []

    predictions = []
    for inner_iid in trainset.all_items():
        if inner_iid in rated_set:
            continue
        raw_iid = int(trainset.to_raw_iid(inner_iid))
        est = item_based_knn_baseline_predict_single(algo, trainset, inner_uid, raw_iid, k=k)
        predictions.append((raw_iid, round(est, 4)))

    predictions.sort(key=lambda x: x[1], reverse=True)

    return predictions


def _purchased_inner_items(db: Session, trainset: Any, user_id: int) -> tuple[list[int], list[int]]:
    """Lấy product_id user đã mua (order_db), map sang inner id của trainset để làm seed.
    Trả về (purchases_raw, seed_items). Item không có trong model sẽ bị bỏ qua.
    """
    purchases = fetch_user_purchases(db, user_id)
    seed_items = []
    for pid in purchases:
        try:
            seed_items.append(trainset.to_inner_iid(pid))
        except ValueError:
            continue
    return purchases, seed_items


def _score_from_seeds(
    algo: Any, trainset: Any, seed_items: list[int], top_n: int,
    k: int = 40, purchase_rating: float = 3.5,
):
    """Cold-start: coi mỗi item đã mua = rating giả (mặc định 3.5), chạy Item-KNNBaseline
    để ước điểm các sản phẩm chưa mua; trả Top-N (raw product_id, est).
    """
    global_mean = float(trainset.global_mean)
    seed_set = set(seed_items)
    numerators: dict[int, float] = defaultdict(float)
    denominators: dict[int, float] = defaultdict(float)

    for inner_p in seed_items:
        resid = purchase_rating - (global_mean + _get_bi(algo, inner_p))
        for inner_j in algo.get_neighbors(inner_p, k=k):
            if inner_j in seed_set:
                continue
            sim_ij = float(algo.sim[inner_p, inner_j])
            
            # Surprise KNNBaseline chỉ xét láng giềng có độ tương đồng > 0
            if sim_ij <= 0:
                continue
                
            numerators[inner_j] += sim_ij * resid
            # Surprise dùng tổng sim, không dùng trị tuyệt đối
            denominators[inner_j] += sim_ij

    preds = []
    for inner_j, num in numerators.items():
        den = denominators[inner_j]
        est = global_mean + _get_bi(algo, inner_j) + (num / den if den > 0 else 0.0)
        est = _clip(est)
        preds.append((int(trainset.to_raw_iid(inner_j)), est))

    preds.sort(key=lambda x: x[1], reverse=True)
    return preds[:top_n]

def _user_rated_raw_items(trainset: Any, user_id: int) -> tuple[set[int], bool]:
    """Kiểm tra user đã có rating trong model chưa.
    Trả về (tập product_id đã rate, user_known). False = cold-start (chưa từng đánh giá).
    """
    try:
        inner_uid = trainset.to_inner_uid(user_id)
        rated = {int(trainset.to_raw_iid(iid)) for iid, _ in trainset.ur[inner_uid]}
        return rated, True
    except ValueError:
        return set(), False


def _recommend_known_user(
    algo: Any,
    trainset: Any,
    user_id: int,
    rated_items: set[int],
    top_n: int,
    neighbor_k: int = 100,
) -> list[RecommendItem]:
    """User đã có rating: thu hẹp ứng viên theo neighbor của item đã rate, rồi ước điểm
    bằng item_based_knn_baseline_predict_single (thay cho algo.predict / cộng điểm qua sim).
    """
    try:
        inner_uid = trainset.to_inner_uid(user_id)
        rated_items_inner = list(trainset.ur[inner_uid])
    except ValueError:
        return []

    if not rated_items_inner:
        return []

    rated_items_set = {iid for iid, _ in rated_items_inner}

    # Ứng viên = union láng giềng của các item đã rate (loại item đã rate)
    candidates: set[int] = set()
    for i_cf, _ in rated_items_inner:
        for j_cf in algo.get_neighbors(i_cf, k=neighbor_k):
            if j_cf not in rated_items_set:
                candidates.add(j_cf)

    predictions: list[tuple[int, float]] = []
    for j_cf in candidates:
        raw_iid = int(trainset.to_raw_iid(j_cf))
        est = item_based_knn_baseline_predict_single(
            algo, trainset, inner_uid, raw_iid, k=neighbor_k
        )
        predictions.append((raw_iid, est))

    predictions.sort(key=lambda x: x[1], reverse=True)

    return [
        RecommendItem(product_id=pid, predicted_rating=round(float(est), 4))
        for pid, est in predictions[:top_n]
    ]


def _recommend_from_purchases(
    db: Session, algo: Any, trainset: Any, user_id: int, top_n: int
) -> tuple[list[RecommendItem], set[int], bool]:
    """Cold-start: kiểm tra lịch sử mua hàng.
    - Có mua (seed hợp lệ) → gợi ý bằng _score_from_seeds, matched=True
    - Chưa mua / không map được item → [], matched=False (caller dùng popular)
    """
    purchases, seed_items = _purchased_inner_items(db, trainset, user_id)
    if not seed_items:
        return [], set(), False

    top_preds = _score_from_seeds(algo, trainset, seed_items, top_n)
    recommendations = [
        RecommendItem(product_id=pid, predicted_rating=round(est, 4))
        for pid, est in top_preds
    ]
    return recommendations, set(purchases), True


def get_recommendations(db: Session, user_id: int, top_n: int = 10) -> RecommendResponse:
    """Inference online (không train): load .pkl → phân nhánh known / purchase / popular → Top-K.
    INPUT: user_id, top_n | OUTPUT: RecommendResponse (product_id + predicted_rating).
    """
    top_n = _normalize_top_n(top_n)

    model = load_model()  # đọc cache RAM hoặc models/reco_model.pkl
    if model is None:
        return RecommendResponse(
            user_id=user_id,
            status="model_not_trained",
            strategy="none",
            top_k=top_n,
            recommendations=[],
        )
    
    algo = model.algo
    trainset = algo.trainset

    rated_items, user_known = _user_rated_raw_items(trainset, user_id)

    if user_known:
        # User đã có rating → neighbor làm ứng viên, chấm điểm bằng predict tự viết
        recommendations = _recommend_known_user(algo, trainset, user_id, rated_items, top_n)
        strategy = "item_knn_baseline"
    else:
        # Cold-start: thử lịch sử mua (order_db); không có thì popular
        recommendations, rated_items, matched = _recommend_from_purchases(
            db, algo, trainset, user_id, top_n
        )
        strategy = "item_knn_baseline+purchase_fallback" if matched else "popular_fallback"

    if len(recommendations) < top_n:
        _fill_with_popular(
            recommendations,
            model.popular_product_ids,
            excluded=rated_items,
            top_n=top_n,
        )
        if user_known and recommendations:
            strategy = "item_knn_baseline+popular"

    return RecommendResponse(
        user_id=user_id,
        status="success",
        strategy=strategy,
        top_k=top_n,
        recommendations=recommendations,
    )


def _resolve_explain_ratings(
    db: Session, trainset: Any, user_id: int, purchase_rating: float = 3.5
) -> tuple[int, list, set[int], set[int], bool, bool]:
    try:
        inner_uid = trainset.to_inner_uid(user_id)
        rated_items_inner = trainset.ur[inner_uid]
        rated_items_set = {iid for iid, _ in rated_items_inner}
        rated_raw_items = {int(trainset.to_raw_iid(iid)) for iid in rated_items_set}
        return inner_uid, rated_items_inner, rated_items_set, rated_raw_items, False, True
    except ValueError:
        inner_uid = -1

    purchases, seed_items = _purchased_inner_items(db, trainset, user_id)
    if seed_items:
        rated_items_inner = [(iid, purchase_rating) for iid in seed_items]
        return inner_uid, rated_items_inner, set(seed_items), set(purchases), True, True

    return inner_uid, [], set(), set(), False, False


def _compute_explanation_scores(
    algo: Any,
    trainset: Any,
    inner_uid: int,
    rated_items_inner: list,
    rated_items_set: set[int],
    global_mean: float,
    k: int = 40,
) -> tuple[list, dict]:
    numerators: dict[int, float] = defaultdict(float)
    denominators: dict[int, float] = defaultdict(float)
    details: dict[int, dict] = {}

    for i_cf, r_ui in rated_items_inner:
        b_i = _baseline_ui(algo, inner_uid, i_cf, global_mean)
        resid = float(r_ui) - b_i.b_ui

        for j_cf in algo.get_neighbors(i_cf, k=k):
            if j_cf in rated_items_set:
                continue
            sim_ij = float(algo.sim[i_cf, j_cf])
            
            # Surprise KNNBaseline chỉ xét láng giềng có độ tương đồng > 0
            if sim_ij <= 0:
                continue
                
            numerators[j_cf] += sim_ij * resid
            # Surprise dùng tổng sim, không dùng trị tuyệt đối
            denominators[j_cf] += sim_ij

            if j_cf not in details:
                details[j_cf] = {
                    "candidate_product_id": int(trainset.to_raw_iid(j_cf)),
                    "baseline_uj": None,
                    "terms": [],
                    "numerator": 0.0,
                    "denominator": 0.0,
                    "prediction": 0.0,
                }

            details[j_cf]["terms"].append(
                ExplanationTerm(
                    from_item_id=int(trainset.to_raw_iid(i_cf)),
                    sim_ij=sim_ij,
                    r_ui=float(r_ui),
                    baseline_ui=b_i,
                    residual_r_ui=resid,
                    contrib=sim_ij * resid,
                )
            )

    predictions = []
    for j_cf, num in numerators.items():
        den = denominators[j_cf]
        b_j = _baseline_ui(algo, inner_uid, j_cf, global_mean)
        est = b_j.b_ui + (num / den) if den > 0 else b_j.b_ui
        est = _clip(est)
        predictions.append((j_cf, est))

        details[j_cf]["baseline_uj"] = b_j
        details[j_cf]["numerator"] = num
        details[j_cf]["denominator"] = den
        details[j_cf]["prediction"] = est

    predictions.sort(key=lambda x: x[1], reverse=True)
    return predictions, details


def _build_rated_items_verbose(
    algo: Any, trainset: Any, inner_uid: int, rated_items_inner: list, global_mean: float
) -> list[dict]:
    verbose = []
    for i_cf, r_ui in rated_items_inner:
        b_i = _baseline_ui(algo, inner_uid, i_cf, global_mean)
        verbose.append({
            "product_id": int(trainset.to_raw_iid(i_cf)),
            "r_ui": float(r_ui),
            "baseline_ui": b_i.model_dump(),
            "residual": float(r_ui) - b_i.b_ui,
        })
    return verbose


def get_recommendations_with_explanation(
    db: Session, user_id: int, top_n: int = 10
) -> RecommendExplainResponse:
    top_n = _normalize_top_n(top_n)

    model = load_model()
    if model is None:
        return RecommendExplainResponse(
            user_id=user_id, status="model_not_trained", strategy="none", top_k=top_n
        )

    algo = model.algo
    trainset = algo.trainset
    global_mean = float(trainset.global_mean)

    (
        inner_uid,
        rated_items_inner,
        rated_items_set,
        rated_raw_items,
        is_purchase_fallback,
        resolved,
    ) = _resolve_explain_ratings(db, trainset, user_id)

    if not resolved:
        recs: list[RecommendItem] = []
        _fill_with_popular(recs, model.popular_product_ids, rated_raw_items, top_n)
        return RecommendExplainResponse(
            user_id=user_id, status="success", strategy="popular_fallback", top_k=top_n,
            global_mean=global_mean, recommendations=recs,
        )

    predictions, details = _compute_explanation_scores(
        algo, trainset, inner_uid, rated_items_inner, rated_items_set, global_mean
    )
    top_preds = predictions[:top_n]

    recommendations = [
        RecommendItem(product_id=int(trainset.to_raw_iid(j_cf)), predicted_rating=round(est, 4))
        for j_cf, est in top_preds
    ]

    explanations = [
        CandidateExplanation(**details[j_cf])
        for j_cf, _ in top_preds
    ]

    rated_items_verbose = _build_rated_items_verbose(
        algo, trainset, inner_uid, rated_items_inner, global_mean
    )

    strategy = "item_knn_baseline+purchase_fallback" if is_purchase_fallback else "item_knn_baseline"
    if len(recommendations) < top_n:
        _fill_with_popular(
            recommendations,
            model.popular_product_ids,
            rated_raw_items,
            top_n,
        )
        if recommendations:
            strategy += "+popular"

    return RecommendExplainResponse(
        user_id=user_id,
        status="success",
        strategy=strategy,
        top_k=top_n,
        global_mean=global_mean,
        rated_items=rated_items_verbose,
        recommendations=recommendations,
        explanations=explanations,
    )


def get_model_status() -> dict[str, Any]:
    """Trạng thái mô hình gợi ý — dùng bởi Admin AIControlPanel."""
    model = load_model()
    if model is None:
        return {
            "model_loaded": False,
            "is_training": False,
            "total_users": 0,
            "total_products": 0,
            "trained_at": None,
        }
    return {
        "model_loaded": True,
        "is_training": False,
        "total_users": model.n_users,
        "total_products": model.n_items,
        "trained_at": model.trained_at,
    }


def trigger_retrain(db: Session) -> RetrainResponse:
    try:
        model = train_model(db)
    except Exception as exc:
        return RetrainResponse(status="error", message=f"Train that bai: {exc}")

    return RetrainResponse(
        status="success",
        message=(
            f"Train xong luc {model.trained_at}: {model.n_users} users, "
            f"{model.n_items} items, {model.n_ratings} ratings."
        ),
    )
