import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Terms.css';

const Terms = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('bao-mat');

  const navItems = [
    { id: 'bao-mat', label: t('terms.navPrivacy') },
    { id: 'doi-tra', label: t('terms.navReturns') },
    { id: 'bao-hanh', label: t('terms.navWarranty') },
    { id: 'van-chuyen', label: t('terms.navShipping') },
  ];

  const handleScrollToSection = (e, id) => {
    e.preventDefault();
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
         top: offsetPosition,
         behavior: "smooth"
      });
    }
  };

  return (
    <div className="terms-page">
      <div className="terms-header">
        <h1>{t('terms.title')}</h1>
        <p>{t('terms.subtitle')}</p>
      </div>

      <div className="terms-container">
        <aside className="terms-sidebar">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`terms-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={(e) => handleScrollToSection(e, item.id)}
            >
              {item.label}
            </a>
          ))}
        </aside>

        <main className="terms-content">
          <section id="bao-mat" className="terms-section">
            <h2>{t('terms.privacyTitle')}</h2>
            <p>{t('terms.privacyIntro')}</p>
            <h3>{t('terms.privacyH1')}</h3>
            <p>{t('terms.privacyP1')}</p>
            <ul>
              <li>{t('terms.privacyL1')}</li>
              <li>{t('terms.privacyL2')}</li>
              <li>{t('terms.privacyL3')}</li>
            </ul>
            <h3>{t('terms.privacyH2')}</h3>
            <p>{t('terms.privacyP2')}</p>
          </section>

          <section id="doi-tra" className="terms-section">
            <h2>{t('terms.returnsTitle')}</h2>
            <p>{t('terms.returnsIntro')}</p>
            <h3>{t('terms.returnsH1')}</h3>
            <ul>
              <li>{t('terms.returnsL1')}</li>
              <li>{t('terms.returnsL2')}</li>
              <li>{t('terms.returnsL3')}</li>
            </ul>
            <h3>{t('terms.returnsH2')}</h3>
            <p>{t('terms.returnsP1')}</p>
          </section>

          <section id="bao-hanh" className="terms-section">
            <h2>{t('terms.warrantyTitle')}</h2>
            <h3>{t('terms.warrantyH1')}</h3>
            <p>{t('terms.warrantyP1')}</p>
            <h3>{t('terms.warrantyH2')}</h3>
            <p>{t('terms.warrantyP2')}</p>
          </section>

          <section id="van-chuyen" className="terms-section">
            <h2>{t('terms.shippingTitle')}</h2>
            <h3>{t('terms.shippingH1')}</h3>
            <p>{t('terms.shippingP1')}</p>
            <h3>{t('terms.shippingH2')}</h3>
            <ul>
              <li><strong>{t('terms.shippingL1')}</strong></li>
              <li><strong>{t('terms.shippingL2')}</strong></li>
              <li><strong>{t('terms.shippingL3')}</strong></li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Terms;
