import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import "./Banner.css";
import { getPublicBanners } from "../../services/bannerService";
import { API_BASE_URL } from "../../config/api";

const resolveBannerImage = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Ảnh trong frontend/public — Vite phục vụ trực tiếp, không qua API Gateway
  if (url.startsWith("/images/")) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return url;
};

const BannerLink = ({ link, className, children }) => {
  const href = link || "/shop";
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
};

const Banner = () => {
  const { t } = useTranslation();
  const [heroSlides, setHeroSlides] = useState([]);
  const [sidebarBanner, setSidebarBanner] = useState(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [hero, sidebar] = await Promise.all([
          getPublicBanners("hero"),
          getPublicBanners("sidebar"),
        ]);
        if (cancelled) return;
        setHeroSlides(Array.isArray(hero) ? hero : []);
        setSidebarBanner(Array.isArray(sidebar) && sidebar.length > 0 ? sidebar[0] : null);
      } catch {
        if (!cancelled) {
          setHeroSlides([]);
          setSidebarBanner(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setIndex(0);
  }, [heroSlides.length]);

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const go = (dir) => {
    if (heroSlides.length === 0) return;
    setIndex((prev) => {
      if (dir === "prev") return (prev - 1 + heroSlides.length) % heroSlides.length;
      return (prev + 1) % heroSlides.length;
    });
  };

  const hasHero = heroSlides.length > 0;
  const hasSidebar = Boolean(sidebarBanner?.image);

  if (!loading && !hasHero && !hasSidebar) {
    return null;
  }

  return (
    <section className="banner">
      <div className={`banner-container ${!hasSidebar ? "banner-container--hero-only" : ""}`}>
        <div className="banner-carousel">
          {loading && (
            <div className="banner-placeholder">
              <p>{t("banner.loading")}</p>
            </div>
          )}

          {!loading && !hasHero && (
            <div className="banner-placeholder">
              <p>{t("banner.noHero")}</p>
              <span>{t("banner.noHeroHint")}</span>
            </div>
          )}

          {!loading &&
            heroSlides.map((slide, i) => (
              <div
                key={slide.id}
                className={`banner-slide ${i === index ? "active" : ""}`}
              >
                {slide.image ? (
                  <div className="slide-image-wrap">
                    {slide.link ? (
                      <BannerLink link={slide.link} className="slide-image-link">
                        <img
                          className="slide-image"
                          src={resolveBannerImage(slide.image)}
                          alt={slide.title || "Banner"}
                        />
                      </BannerLink>
                    ) : (
                      <img
                        className="slide-image"
                        src={resolveBannerImage(slide.image)}
                        alt={slide.title || "Banner"}
                      />
                    )}
                  </div>
                ) : (
                  <div className="slide-image-wrap slide-image-wrap--empty" />
                )}
              </div>
            ))}

          {hasHero && heroSlides.length > 1 && (
            <>
              <button
                type="button"
                className="carousel-nav-btn carousel-nav-btn--prev"
                onClick={() => go("prev")}
                aria-label={t("common.prev")}
              >
                <ChevronLeftIcon fontSize="inherit" />
              </button>
              <button
                type="button"
                className="carousel-nav-btn carousel-nav-btn--next"
                onClick={() => go("next")}
                aria-label={t("common.next")}
              >
                <ChevronRightIcon fontSize="inherit" />
              </button>
            </>
          )}

          {hasHero && heroSlides.length > 1 && (
            <div className="carousel-dots" role="tablist" aria-label="Banner slides">
              {heroSlides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Slide ${i + 1}`}
                  className={`carousel-dot ${i === index ? "active" : ""}`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          )}
        </div>

        {hasSidebar && (
          <aside className="banner-ad">
            <div className="banner-ad-media">
              <img
                className="ad-image"
                alt={sidebarBanner.title || t("banner.adAlt")}
                src={resolveBannerImage(sidebarBanner.image)}
              />
            </div>
            <div className="banner-ad-footer">
              <BannerLink
                link={sidebarBanner.link || "/shop"}
                className="banner-ad-detail-btn"
              >
                {t("common.viewDetails")}
              </BannerLink>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
};

export default Banner;
