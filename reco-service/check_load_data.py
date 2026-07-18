import sys

from app.database import SessionLocal, check_connection
from app.repositories.rating_repository import fetch_approved_ratings
from app.services.load_data import load_data_from_db


def main() -> int:
    print("=" * 60)
    print("[1/3] Kiem tra ket noi MySQL...")
    try:
        check_connection()
        print("     OK - ket noi DB thanh cong.")
    except Exception as exc:
        print(f"     LOI ket noi DB: {exc}")
        print("     -> Kiem tra lai file .env (MYSQL_HOST/PORT/USER/PASSWORD/DATABASE).")
        return 1

    db = SessionLocal()
    try:
        print("=" * 60)
        print("[2/3] Lay danh sach rating da duyet (fetch_approved_ratings)...")
        rows = fetch_approved_ratings(db)
        print(f"     So ban ghi lay duoc: {len(rows)}")
        if rows:
            print(f"     Vi du 3 ban ghi dau: {rows[:3]}")
        else:
            print("     CANH BAO: khong co rating nao (is_approved=true & khong null).")
            print("     -> Kiem tra bang 'reviews' co du lieu da duyet hay chua.")
            return 1

        print("=" * 60)
        print("[3/3] Goi load_data_from_db (build Dataset + DataFrame)...")
        data, df = load_data_from_db(db)

        print(f"     DataFrame shape      : {df.shape}")
        print(f"     So user duy nhat     : {df['user_id'].nunique()}")
        print(f"     So product duy nhat  : {df['product_id'].nunique()}")
        print(f"     Rating min/max       : {df['rating'].min()} / {df['rating'].max()}")
        print(f"     Kieu du lieu cot     :\n{df.dtypes.to_string()}")
        print("     5 dong dau cua DataFrame:")
        print(df.head().to_string(index=False))

        trainset = data.build_full_trainset()
        print(f"     Surprise trainset: {trainset.n_users} users, "
              f"{trainset.n_items} items, {trainset.n_ratings} ratings.")

        print("=" * 60)
        print("KET QUA: load_data hoat dong OK.")
        return 0
    except Exception as exc:
        print(f"     LOI khi load_data: {exc}")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
