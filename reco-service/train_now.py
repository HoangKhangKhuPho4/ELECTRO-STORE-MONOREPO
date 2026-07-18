"""Train model va sinh file reco_model.pkl (chay tay, khong can bat server).

Cach chay (tu thu muc reco-service):
    python train_now.py
"""

import sys

from app.database import SessionLocal, check_connection
from app.services.model_store import model_path
from app.services.train import train_model


def main() -> int:
    print("[1/2] Kiem tra ket noi MySQL...")
    try:
        check_connection()
        print("     OK.")
    except Exception as exc:  # noqa: BLE001
        print(f"     LOI ket noi DB: {exc}")
        print("     -> Kiem tra file .env (MYSQL_HOST/PORT/USER/PASSWORD/DATABASE).")
        return 1

    db = SessionLocal()
    try:
        print("[2/2] Dang train model...")
        model = train_model(db)
        print("     Train xong.")
        print(f"     users={model.n_users}, items={model.n_items}, ratings={model.n_ratings}")
        print(f"     popular={len(model.popular_product_ids)} san pham")
        print(f"     File model da luu tai: {model_path}")
        return 0
    except Exception as exc:  # noqa: BLE001
        print(f"     LOI khi train: {exc}")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
