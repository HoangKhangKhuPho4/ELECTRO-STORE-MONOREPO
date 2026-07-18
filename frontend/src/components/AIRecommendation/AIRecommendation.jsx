import RecommendOutlinedIcon from "@mui/icons-material/RecommendOutlined";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import ProductCard from "../ProductCard/ProductCard";
import { selectUser } from "../../redux/appSlice";
import httpClient from "../../services/httpClient";
import { API_PREFIX } from "../../config/api";
import { unwrapPageContent } from "../../utils/apiResponse";
import { mapProductForCard } from "../../utils/productMapper";
import { getBestSellers, getProductDetail } from "../../services/productService";
import "./AIRecommendation.css";

const AIRecommendation = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const user = useSelector(selectUser);
  // Xác định đối tượng gợi ý: user đăng nhập → user.id; guest → fallback 9003
  const currentUserId = user?.id || 9003;

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        let rawProducts = [];

        try {
          // Gọi API Gateway: /api/recommendations/user/{userId}
          // (Vite proxy → :8080 → route statistics-service → reco-service Inference)
          const response = await httpClient.get(
            `${API_PREFIX}/recommendations/user/${currentUserId}`,
          );
          rawProducts = response.data?.data || [];
        } catch (err) {
          console.warn("Recommendations API unavailable:", err.message);
        }

        // BFF thường chỉ trả { id, name } → thiếu price/images thì lấy chi tiết từ catalog
        if (rawProducts.length > 0 && !rawProducts[0].price && !rawProducts[0].images) {
          const enriched = await Promise.all(
            rawProducts.map(async (item) => {
              try {
                return await getProductDetail(item.id);
              } catch {
                return item;
              }
            }),
          );
          rawProducts = enriched.filter(Boolean);
        }

        // AI/BFF rỗng hoặc lỗi → fallback sản phẩm bán chạy để UI không trống
        if (rawProducts.length === 0) {
          const bestRes = await getBestSellers(0, 8);
          rawProducts = unwrapPageContent(bestRes);
        }

        setProducts(rawProducts.map(mapProductForCard));
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      }
    };

    fetchRecommendations();
  }, [currentUserId]);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="product-recommendations" id="product-recommendations">
      <div className="product-recommendations__inner">
        <div className="product-recommendations__header">
          <div className="product-recommendations__title-row">
            <RecommendOutlinedIcon className="product-recommendations__icon" aria-hidden />
            <div>
              <h2 className="product-recommendations__title">{t("home.recommendations")}</h2>
              <p className="product-recommendations__subtitle">
                {user
                  ? t("home.recommendationsLoggedIn")
                  : t("home.recommendationsGuest")}
              </p>
            </div>
          </div>
        </div>

        <div className="product-recommendations__grid">
          {products.map((p) => (
            <div key={p.id} className="product-recommendations__item">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AIRecommendation;
