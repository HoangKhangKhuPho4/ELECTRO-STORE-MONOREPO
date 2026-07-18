import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

host = os.getenv("MYSQL_HOST", "localhost")
port = os.getenv("MYSQL_PORT", "3306")
user = os.getenv("MYSQL_USER", "root")
pw = os.getenv("MYSQL_PASSWORD", "")
catalog_db = os.getenv("CATALOG_DB_NAME", "electro_catalog_db")

url = f"mysql+pymysql://{user}:{pw}@{host}:{port}/{catalog_db}?charset=utf8mb4"
engine = create_engine(url, pool_pre_ping=True)

ids = [26, 37, 14, 13, 40, 9, 7, 27, 10, 23]

with engine.connect() as conn:
    cols = [r[0] for r in conn.execute(text(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA=:db AND TABLE_NAME='products'"
    ), {"db": catalog_db}).fetchall()]
    print("COLUMNS:", cols)

    name_col = "name" if "name" in cols else cols[1]
    extra = ", price" if "price" in cols else ""
    status = ", status" if "status" in cols else (", is_deleted" if "is_deleted" in cols else "")
    q = text(
        f"SELECT id, {name_col}{extra}{status} FROM products "
        f"WHERE id IN ({','.join(str(i) for i in ids)})"
    )
    rows = {r[0]: r for r in conn.execute(q).fetchall()}

    print("\nRANK | product_id | name | extra")
    for rank, pid in enumerate(ids, 1):
        r = rows.get(pid)
        if r:
            print(f"{rank:>2}   | {pid:>3} | {r[1]} | {tuple(r[2:])}")
        else:
            print(f"{rank:>2}   | {pid:>3} | <KHONG TON TAI / da xoa>")
