import { observer } from 'mobx-react-lite';
import React from 'react';
import { useTranslation } from 'react-i18next';
import PopupWindow from '../components/PopupWindow';
import { useStore } from '../contexts/StoreContext';

import Logo_About from 'resources/images/helpcenter/logo-about-helpcenter-dark.jpg';
import ExternalLink from '../components/ExternalLink';

const gitVersion = typeof __GIT_VERSION__ !== 'undefined' ? __GIT_VERSION__ : 'dev';
const buildDate = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '';

const About = observer(() => {
  const { uiStore } = useStore();
  const { t } = useTranslation();

  if (!uiStore.isAboutOpen) {
    return null;
  }

  return (
    <PopupWindow onClose={uiStore.closeAbout} windowName="about" closeOnEscape>
      <div id="about">
        <img src={Logo_About} alt="Allusion-Next" />
        <h1>Allusion-Next</h1>
        <p className="about-tagline">{t('about.tagline')}</p>
        <p className="about-version">
          {gitVersion} ({buildDate})
        </p>
        <p className="about-github">
          <ExternalLink url="https://github.com/kirenath/Allusion-Next">GitHub</ExternalLink>
        </p>
        <footer className="about-footer">
          <p>{t('about.copyright')}</p>
          <p>
            {t('about.forkPrefix')}
            <ExternalLink url="https://github.com/allusion-app/Allusion">Allusion</ExternalLink>
            {t('about.forkMiddle')}
            <ExternalLink url="https://github.com/RafaUC/Allusion">RafaUC</ExternalLink>
            {t('about.forkSuffix')}
          </p>
        </footer>
      </div>
    </PopupWindow>
  );
});

export default About;
