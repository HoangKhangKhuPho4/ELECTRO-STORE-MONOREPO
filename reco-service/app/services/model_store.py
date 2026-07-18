import os
import pickle
import threading
from dataclasses import dataclass
from typing import Any, Optional

reco_model_dir = os.getenv("RECO_MODEL_DIR", "models")
reco_model_file = os.getenv("RECO_MODEL_FILE", "reco_model.pkl")
model_path = os.path.join(reco_model_dir, reco_model_file)


@dataclass
class RecoModel:
    algo: Any
    popular_product_ids: list[int]
    trained_at: str
    n_users: int
    n_items: int
    n_ratings: int


_lock = threading.Lock()
_cached: Optional[RecoModel] = None


def save_model(model: RecoModel) -> str:
    os.makedirs(reco_model_dir, exist_ok=True)
    with open(model_path, "wb") as f:
        pickle.dump(model, f)

    global _cached
    with _lock:
        _cached = model
    return model_path


def load_model(force_reload: bool = False) -> Optional[RecoModel]:
    global _cached
    with _lock:
        if _cached is not None and not force_reload:
            return _cached
        if not os.path.exists(model_path):
            return None
        with open(model_path, "rb") as f:
            _cached = pickle.load(f)
        return _cached


def model_exists() -> bool:
    return _cached is not None or os.path.exists(model_path)
