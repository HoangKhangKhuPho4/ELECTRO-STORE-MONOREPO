from sqlalchemy import BigInteger, Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ReviewRating(Base):
    """Map bảng reviews (electro_review_db) — nguồn rating cho KNNBaseline."""

    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    variant_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    user_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    order_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_verified_purchase: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    is_approved: Mapped[bool | None] = mapped_column(Boolean, nullable=True, default=False)
    helpful_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
