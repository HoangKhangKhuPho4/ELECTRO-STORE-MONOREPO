package com.electro.statistics.service;

import com.electro.statistics.client.CatalogClient;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AIRecommendationService {

    private final RestTemplate recoRestTemplate;
    private final CatalogClient catalogClient;

    /** Base URL reco-service (Eureka name), mặc định http://reco-service */
    @Value("${app.ai.url:http://reco-service}")
    private String aiServiceUrl;

    public AIRecommendationService(
            @Qualifier("recoRestTemplate") RestTemplate recoRestTemplate,
            CatalogClient catalogClient) {
        this.recoRestTemplate = recoRestTemplate;
        this.catalogClient = catalogClient;
    }

    /**
     * BFF: điều phối gợi ý — gọi reco-service suy luận, rồi enrich tên từ catalog.
     * Không chạy thuật toán AI tại đây.
     */
    public List<Map<String, Object>> getRecommendationsForUser(Integer userId) {
        List<Map<String, Object>> result = new ArrayList<>();
        try {
            // INPUT: userId + top_k=10  →  gọi reco-service bắt đầu Inference (KNNBaseline)
            // OUTPUT kỳ vọng: recommendations[{ product_id, predicted_rating }]
            String url = aiServiceUrl + "/recommend/" + userId + "?top_k=10";
            Map body = recoRestTemplate.getForObject(url, Map.class);
            if (body != null && body.containsKey("recommendations")) {
                List<Map<String, Object>> recommendedList = (List<Map<String, Object>>) body.get("recommendations");
                for (Map<String, Object> rec : recommendedList) {
                    Integer productId = ((Number) rec.get("product_id")).intValue();
                    try {
                        // Enrich: reco chỉ trả ID + điểm → catalog lấy name để FE hiển thị
                        CatalogClient.ProductResponse product = catalogClient.getProductById(productId);
                        Map<String, Object> item = Map.of(
                                "id", product.getId(),
                                "name", product.getName() != null ? product.getName() : ""
                        );
                        result.add(item);
                    } catch (Exception ignored) {
                        // Sản phẩm không tồn tại / catalog lỗi → bỏ qua item, không fail cả list
                    }
                }
            }
        } catch (Exception ignored) {
            // reco-service down / timeout → trả list rỗng; FE sẽ fallback best-sellers
        }
        return result;
    }
}
