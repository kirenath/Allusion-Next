import { observer } from 'mobx-react-lite';
import React from 'react';
import { useTranslation } from 'react-i18next';
import PopupWindow from '../components/PopupWindow';
import { useStore } from '../contexts/StoreContext';

import Logo_About from 'resources/images/helpcenter/logo-about-helpcenter-dark.jpg';
import { RendererMessenger } from 'src/ipc/renderer';
import ExternalLink from '../components/ExternalLink';

const About = observer(() => {
  const { uiStore } = useStore();
  const { t } = useTranslation();

  if (!uiStore.isAboutOpen) {
    return null;
  }
  return (
    <PopupWindow onClose={uiStore.closeAbout} windowName="about" closeOnEscape>
      <div id="about" className="light">
        <img src={Logo_About} alt="Logo" />
        <small>
          {t('about.version')} <strong>{RendererMessenger.getVersion()}</strong>
        </small>
        <p>
          {t('about.description')}
          <br />
          {t('about.freeAndOpenSource')}
        </p>
        <span>
          <ExternalLink url="https://allusion-app.github.io/">allusion-app.github.io</ExternalLink>.
        </span>
        <ul>
          <li>{t('about.generalInformation')}</li>
        </ul>
        <ExternalLink url="https://github.com/RafaUC/Allusion">
          github.com/RafaUC/Allusion
        </ExternalLink>
        <ul>
          <li>{t('about.downloadLatestVersion')}</li>
          <li>🤓 {t('about.viewSourceCode')}</li>
          <li>🐛 {t('about.provideFeedback')}</li>
          <li>👥 {t('about.learnAboutContributing')}</li>
        </ul>
        {/* TODO: Licensing info here? */}
      </div>
    </PopupWindow>
  );
});

export default About;
