import os
import random
from datetime import datetime, timedelta

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
REVIEW_DB = os.getenv("MYSQL_DATABASE", "electro_review_db")
CATALOG_DB = os.getenv("CATALOG_DB_NAME", "electro_catalog_db")
USER_DB = os.getenv("USER_DB_NAME", "electro_user_db")

NUM_USERS = 100
NUM_PRODUCTS = 40
RATINGS_PER_USER = 15
NUM_CLUSTERS = 4
TARGET_MEAN = 3.5
SEED = 42

random.seed(SEED)


def _url(db_name: str) -> str:
    return (
        f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}"
        f"@{MYSQL_HOST}:{MYSQL_PORT}/{db_name}?charset=utf8mb4"
    )


def fetch_ids(url: str, sql: str) -> list[int]:
    engine = create_engine(url, pool_pre_ping=True)
    try:
        with engine.connect() as conn:
            rows = conn.execute(text(sql)).fetchall()
    finally:
        engine.dispose()
    return [int(r[0]) for r in rows]


def build_ratings(user_ids: list[int], product_ids: list[int]) -> list[dict]:
    product_cluster = {pid: random.randrange(NUM_CLUSTERS) for pid in product_ids}
    item_bias = {pid: random.gauss(0.0, 0.5) for pid in product_ids}
    user_bias = {uid: random.gauss(0.0, 0.4) for uid in user_ids}
    user_affinity = {
        uid: [random.gauss(0.0, 0.8) for _ in range(NUM_CLUSTERS)]
        for uid in user_ids
    }

    take = min(RATINGS_PER_USER, len(product_ids))
    raw_scores = []
    for uid in user_ids:
        chosen = random.sample(product_ids, take)
        for pid in chosen:
            score = (
                TARGET_MEAN
                + user_bias[uid]
                + item_bias[pid]
                + user_affinity[uid][product_cluster[pid]]
                + random.gauss(0.0, 0.5)
            )
            raw_scores.append((uid, pid, score))

    mean_raw = sum(s for _, _, s in raw_scores) / len(raw_scores)
    shift = TARGET_MEAN - mean_raw

    now = datetime.now()
    ratings = []
    for uid, pid, score in raw_scores:
        star = round(score + shift)
        star = max(1, min(5, star))
        created = now - timedelta(days=random.randint(0, 365))
        ratings.append(
            {
                "product_id": pid,
                "user_id": uid,
                "rating": star,
                "created_at": created,
                "updated_at": created,
            }
        )
    return ratings


def wipe_reviews(engine) -> None:
    with engine.begin() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
        conn.execute(text("TRUNCATE TABLE review_images"))
        conn.execute(text("TRUNCATE TABLE reviews"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))


def insert_reviews(engine, ratings: list[dict]) -> None:
    sql = text(
        "INSERT INTO reviews "
        "(product_id, user_id, rating, is_approved, is_verified_purchase, "
        "helpful_count, title, content, created_at, updated_at) "
        "VALUES (:product_id, :user_id, :rating, 1, 1, 0, "
        "'Seed review', 'Auto-generated review for testing.', "
        ":created_at, :updated_at)"
    )
    with engine.begin() as conn:
        conn.execute(sql, ratings)


def main() -> None:
    product_ids = fetch_ids(
        _url(CATALOG_DB),
        f"SELECT id FROM products WHERE is_active = 1 ORDER BY id LIMIT {NUM_PRODUCTS}",
    )
    if len(product_ids) < 2:
        raise SystemExit(f"Khong du san pham trong {CATALOG_DB}.products (can >= 2).")

    user_ids = fetch_ids(
        _url(USER_DB),
        f"SELECT id FROM users ORDER BY id LIMIT {NUM_USERS}",
    )
    if len(user_ids) < 2:
        raise SystemExit(f"Khong du user trong {USER_DB}.users (can >= 2).")

    ratings = build_ratings(user_ids, product_ids)

    review_engine = create_engine(_url(REVIEW_DB), pool_pre_ping=True)
    try:
        wipe_reviews(review_engine)
        insert_reviews(review_engine, ratings)
    finally:
        review_engine.dispose()

    total = len(ratings)
    mean = sum(r["rating"] for r in ratings) / total
    dist = {s: 0 for s in range(1, 6)}
    for r in ratings:
        dist[r["rating"]] += 1

    print(f"Products used: {len(product_ids)} | Users used: {len(user_ids)}")
    print(f"Inserted reviews: {total}")
    print(f"Global mean: {mean:.3f}")
    print("Rating distribution:")
    for s in range(1, 6):
        pct = 100.0 * dist[s] / total
        print(f"  {s} star: {dist[s]:5d} ({pct:5.1f}%)")


if __name__ == "__main__":
    main()
