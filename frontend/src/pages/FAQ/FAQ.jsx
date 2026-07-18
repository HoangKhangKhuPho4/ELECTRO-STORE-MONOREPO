import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './FAQ.css';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';

const AccordionItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="support-accordion">
      <div 
        className="support-accordion-header" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <h4 className="support-question">{question}</h4>
        <KeyboardArrowDownIcon 
          fontSize="small"
          className={`support-accordion-icon ${isOpen ? 'open' : ''}`} 
        />
      </div>
      <div className={`support-accordion-body ${isOpen ? 'open' : ''}`}>
        <p className="support-answer">{answer}</p>
      </div>
    </div>
  );
};

const FAQ = () => {
  const { t, i18n } = useTranslation();

  const faqs = useMemo(
    () => t('faq.items', { returnObjects: true }),
    [t, i18n.language]
  );

  const categories = [
    { icon: <LocalShippingOutlinedIcon />, label: t('faq.catOrders') },
    { icon: <Inventory2OutlinedIcon />, label: t('faq.catShipping') },
    { icon: <VerifiedUserOutlinedIcon />, label: t('faq.catWarranty') },
    { icon: <PersonOutlineOutlinedIcon />, label: t('faq.catAccount') },
  ];

  return (
    <div className="support-center">
      <div className="support-header">
        <h1>{t('faq.title')}</h1>
        <div className="support-search">
          <SearchIcon className="support-search-icon" />
          <input 
            type="text" 
            placeholder={t('faq.searchPlaceholder')} 
          />
        </div>
      </div>

      <div className="support-categories-wrapper">
        <div className="support-categories">
          {categories.map((cat) => (
            <div key={cat.label} className="support-category-card">
              <div className="support-category-icon">{cat.icon}</div>
              <div className="support-category-title">{cat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="support-faq-section">
        <h2 className="support-faq-title">{t('faq.sectionTitle')}</h2>
        {Array.isArray(faqs) && faqs.map((faq, index) => (
          <AccordionItem 
            key={index}
            question={faq.q}
            answer={faq.a}
          />
        ))}
      </div>

      <div className="support-contact">
        <h3>{t('faq.contactTitle')}</h3>
        <p>{t('faq.contactDesc')}</p>
        <button className="btn-contact">
          <SupportAgentIcon fontSize="small" /> {t('faq.contactBtn')}
        </button>
      </div>
    </div>
  );
};

export default FAQ;
