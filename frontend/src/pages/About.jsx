import React from 'react';
import { useTranslation } from 'react-i18next';
import './About.css';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';

const About = () => {
  const { t } = useTranslation();

  const teamMembers = [
    { nameKey: 'about.member1Name', roleKey: 'about.member1Role', descKey: 'about.member1Desc', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop' },
    { nameKey: 'about.member2Name', roleKey: 'about.member2Role', descKey: 'about.member2Desc', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop' },
    { nameKey: 'about.member3Name', roleKey: 'about.member3Role', descKey: 'about.member3Desc', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600&auto=format&fit=crop' },
  ];

  return (
    <div className="about-page-light">
      <section className="about-hero">
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-frame" aria-hidden="true" />
        <div className="hero-content">
          <span className="hero-badge">{t('about.badge')}</span>
          <h1>
            {t('about.title')} <span className="highlight-text">{t('about.titleHighlight')}</span>
          </h1>
          <p>{t('about.heroDesc')}</p>
        </div>
      </section>

      <div className="about-container">
        <section className="vision-mission-grid">
          <div className="vm-card">
            <div className="icon-wrapper">
              <VisibilityOutlinedIcon fontSize="large" />
            </div>
            <h2>{t('about.visionTitle')}</h2>
            <p>{t('about.visionDesc')}</p>
          </div>

          <div className="vm-card">
            <div className="icon-wrapper">
              <RocketLaunchOutlinedIcon fontSize="large" />
            </div>
            <h2>{t('about.missionTitle')}</h2>
            <p>{t('about.missionDesc')}</p>
          </div>
        </section>

        <section className="reasons-section">
          <div className="section-header">
            <h2>{t('about.reasonsTitle')}</h2>
            <p>{t('about.reasonsDesc')}</p>
          </div>
          <div className="reasons-grid">
            <div className="reason-card">
              <div className="icon-wrapper" style={{ width: '60px', height: '60px' }}>
                <LocalShippingOutlinedIcon />
              </div>
              <h3>{t('about.fastShippingTitle')}</h3>
              <p>{t('about.fastShippingDesc')}</p>
            </div>
            <div className="reason-card">
              <div className="icon-wrapper" style={{ width: '60px', height: '60px' }}>
                <VerifiedUserOutlinedIcon />
              </div>
              <h3>{t('about.warrantyTitle')}</h3>
              <p>{t('about.warrantyDesc')}</p>
            </div>
            <div className="reason-card">
              <div className="icon-wrapper" style={{ width: '60px', height: '60px' }}>
                <PaymentsOutlinedIcon />
              </div>
              <h3>{t('about.installmentTitle')}</h3>
              <p>{t('about.installmentDesc')}</p>
            </div>
          </div>
        </section>

        <section className="team-section">
          <div className="section-header">
            <span className="team-subtitle">{t('about.teamSubtitle')}</span>
            <h2>{t('about.teamTitle')}</h2>
          </div>
          <div className="team-grid">
            {teamMembers.map((member) => (
              <div key={member.nameKey} className="team-member">
                <div className="member-image">
                  <img src={member.img} alt={t(member.nameKey)} />
                </div>
                <h3>{t(member.nameKey)}</h3>
                <span className="member-role">{t(member.roleKey)}</span>
                <p className="member-desc">{t(member.descKey)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
