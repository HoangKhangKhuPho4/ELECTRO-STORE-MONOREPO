import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './Blog.css';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';

const BLOG_IMAGES = [
  "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1587831990711-23ca6441447b?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=800&auto=format&fit=crop",
];

const Blog = () => {
  const { t, i18n } = useTranslation();

  const featuredArticle = useMemo(() => {
    const f = t('blog.featured', { returnObjects: true });
    return { ...f, image: BLOG_IMAGES[0] };
  }, [t, i18n.language]);

  const newsList = useMemo(() => {
    const articles = t('blog.articles', { returnObjects: true });
    if (!Array.isArray(articles)) return [];
    return articles.map((article, index) => ({
      id: index + 1,
      ...article,
      image: BLOG_IMAGES[index + 1] || BLOG_IMAGES[0],
    }));
  }, [t, i18n.language]);

  const categories = useMemo(
    () => t('blog.categories', { returnObjects: true }),
    [t, i18n.language]
  );

  const popularPosts = useMemo(() => {
    const titles = t('blog.popular', { returnObjects: true });
    if (!Array.isArray(titles)) return [];
    return titles.map((title, index) => ({ id: 10 + index, title }));
  }, [t, i18n.language]);

  return (
    <div className="blog-page">
      <div className="blog-container">
        <div className="blog-header-title">
          <h1>{t('blog.title')} <span className="highlight-text">{t('blog.titleHighlight')}</span></h1>
          <p>{t('blog.subtitle')}</p>
        </div>

        <section className="hero-article">
          <div className="hero-image-wrapper">
            <img src={featuredArticle.image} alt={featuredArticle.title} />
          </div>
          <div className="hero-content">
            <span className="category-badge hero-cat">{featuredArticle.category}</span>
            <h2>{featuredArticle.title}</h2>
            <p className="hero-excerpt">{featuredArticle.excerpt}</p>
            <div className="hero-meta">
              <span className="post-date">
                <AccessTimeIcon fontSize="small" /> {featuredArticle.date}
              </span>
              <button className="btn-read-more">
                {t('common.readMore')} <ArrowForwardIcon fontSize="small" />
              </button>
            </div>
          </div>
        </section>

        <div className="blog-layout">
          <main className="main-content-area">
            <div className="section-heading">
              <h3>{t('blog.latestPosts')}</h3>
            </div>
            
            <div className="news-grid">
              {newsList.map((post) => (
                <article key={post.id} className="news-card">
                  <div className="news-thumbnail">
                    <img src={post.image} alt={post.title} />
                    <span className="category-badge absolute-badge">{post.category}</span>
                  </div>
                  <div className="news-info">
                    <span className="post-date-small">{post.date}</span>
                    <h4 className="news-title">{post.title}</h4>
                    <p className="news-excerpt">{post.excerpt}</p>
                    <a href={`/blog/${post.id}`} className="link-read-more">{t('common.viewDetails')}</a>
                  </div>
                </article>
              ))}
            </div>
            
            <div className="pagination">
              <button className="page-btn active">1</button>
              <button className="page-btn">2</button>
              <button className="page-btn">3</button>
              <span>...</span>
              <button className="page-btn">10</button>
            </div>
          </main>

          <aside className="sidebar">
            <div className="widget search-widget">
              <h4 className="widget-title">{t('blog.searchWidget')}</h4>
              <div className="search-box">
                <input type="text" placeholder={t('blog.searchPlaceholder')} />
                <button aria-label={t('common.search')}><SearchIcon /></button>
              </div>
            </div>

            <div className="widget categories-widget">
              <h4 className="widget-title">{t('blog.categoriesWidget')}</h4>
              <ul className="cat-list">
                {Array.isArray(categories) && categories.map((cat) => (
                  <li key={cat.name}>
                    <LocalOfferOutlinedIcon fontSize="small"/> {cat.name} ({cat.count})
                  </li>
                ))}
              </ul>
            </div>

            <div className="widget popular-widget">
              <h4 className="widget-title">{t('blog.popularWidget')}</h4>
              <ul className="popular-list">
                {popularPosts.map((post, index) => (
                  <li key={post.id}>
                    <span className="rank-number">{index + 1}</span>
                    <a href={`/blog/${post.id}`}>{post.title}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="widget banner-widget">
              <div className="promo-banner">
                <h4>{t('blog.promoTitle')}</h4>
                <p>{t('blog.promoDesc')}</p>
                <button className="btn-promo">{t('common.buyNow')}</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Blog;
