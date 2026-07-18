package com.electro.catalog.config;

import com.electro.catalog.entity.Banner;
import com.electro.catalog.repository.BannerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/** Seed banner hero/sidebar từ ảnh tĩnh frontend/public/images/banners khi bảng trống. */
@Component
@RequiredArgsConstructor
public class BannerSampleLoader implements ApplicationRunner {

    private static final String BANNER_6 = "/images/banners/banner-6.png";
    private static final String BANNER_7 = "/images/banners/banner-7.png";

    private final BannerRepository bannerRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (bannerRepository.count() == 0) {
            seedAll();
            return;
        }
        // DB đã có dữ liệu: sửa path cũ banner-6.jpg → .png và bổ sung banner-7 nếu thiếu
        syncExisting();
    }

    private void seedAll() {
        saveHero(1, "Thiết bị điện tử chính hãng", "Ưu đãi hấp dẫn mỗi ngày",
                "/images/banners/banner-1.jpg", "/shop");
        saveHero(2, "Electro Store", "Thiết bị điện tử — giá tốt mỗi ngày",
                "/images/banners/banner-2.jpg", "/shop");
        saveHero(3, "Phụ kiện công nghệ", "Sạc, cáp, tai nghe chính hãng",
                "/images/banners/banner-3.jpg", "/shop");
        saveHero(4, "Smart Home & IoT", "Kết nối thông minh cho gia đình bạn",
                "/images/banners/banner-4.jpg", "/shop");
        saveHero(5, "Đồng hồ thông minh", "Theo dõi sức khỏe mọi lúc",
                "/images/banners/banner-5.jpeg", "/shop");
        saveHero(6, "Cyber Monday", "Ưu đãi công nghệ — giảm sốc",
                BANNER_6, "/shop");
        saveHero(7, "Công nghệ mới nhất", "Khám phá sản phẩm nổi bật tuần này",
                BANNER_7, "/shop");

        saveSidebar("Khuyến mãi tuần này", "Giảm giá đến 30%",
                BANNER_7, "/shop");
    }

    private void syncExisting() {
        boolean hasBanner7 = false;
        for (Banner banner : bannerRepository.findAll()) {
            String url = banner.getImageUrl();
            if (url == null) {
                continue;
            }
            if (url.contains("banner-6.jpg")) {
                banner.setImageUrl(BANNER_6);
                bannerRepository.save(banner);
            }
            if (url.contains("banner-7.")) {
                hasBanner7 = true;
            }
        }
        if (!hasBanner7) {
            saveHero(7, "Công nghệ mới nhất", "Khám phá sản phẩm nổi bật tuần này",
                    BANNER_7, "/shop");
        }
    }

    private void saveHero(int priority, String title, String subtitle, String imageUrl, String link) {
        Banner banner = new Banner();
        banner.setTitle(title);
        banner.setSubtitle(subtitle);
        banner.setImageUrl(imageUrl);
        banner.setPosition("hero");
        banner.setStatus("active");
        banner.setLink(link);
        banner.setPriority(priority);
        banner.setClickCount(0L);
        bannerRepository.save(banner);
    }

    private void saveSidebar(String title, String subtitle, String imageUrl, String link) {
        Banner banner = new Banner();
        banner.setTitle(title);
        banner.setSubtitle(subtitle);
        banner.setImageUrl(imageUrl);
        banner.setPosition("sidebar");
        banner.setStatus("active");
        banner.setLink(link);
        banner.setPriority(1);
        banner.setClickCount(0L);
        bannerRepository.save(banner);
    }
}
