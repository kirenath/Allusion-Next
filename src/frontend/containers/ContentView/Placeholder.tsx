import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import LOGO_FC from 'resources/logo/svg/full-color/allusion-logomark-fc.svg';
import { IS_PREVIEW_WINDOW } from 'common/window';

import { useStore } from '../../contexts/StoreContext';

const Placeholder = observer(() => {
  const { fileStore, tagStore } = useStore();

  if (IS_PREVIEW_WINDOW) {
    return <PreviewWindowPlaceholder />;
  }
  if (fileStore.showsAllContent && tagStore.isEmpty) {
    // No tags exist, and no images added: Assuming it's a new user -> Show a welcome screen
    return <Welcome />;
  } else if (fileStore.showsAllContent) {
    return <NoContentFound />;
  } else if (fileStore.showsQueryContent) {
    return <NoQueryContent />;
  } else if (fileStore.showsUntaggedContent) {
    return <NoUntaggedContent />;
  } else if (fileStore.showsMissingContent) {
    return <NoMissingContent />;
  } else {
    return <BugReport />;
  }
});

export default Placeholder;

import { IconSet, Button, ButtonGroup, SVG } from 'widgets';
import { RendererMessenger } from 'src/ipc/renderer';
import useMountState from 'src/frontend/hooks/useMountState';

const PreviewWindowPlaceholder = observer(() => {
  const { fileStore } = useStore();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [, isMounted] = useMountState();
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileStore.fileListLastRefetch]);

  if (isLoading) {
    return (
      <ContentPlaceholder title={t('content.loadingDotDotDot')} icon={<SVG src={LOGO_FC} />}>
        {IconSet.LOADING}
      </ContentPlaceholder>
    );
  }

  // There should always be images to preview.
  // If the placeholder is shown, something went wrong (probably the DB of the preview window is out of sync with the main window)
  return (
    <ContentPlaceholder title={t('content.notSupposedToHappen')} icon={<SVG src={LOGO_FC} />}>
      <p>{t('content.somethingWentWrongPreview')}</p>

      <div className="divider" />

      <Button
        styling="outlined"
        text={t('content.reloadAllusion')}
        onClick={() => RendererMessenger.reload()}
      />
    </ContentPlaceholder>
  );
});

const Welcome = () => {
  const { uiStore } = useStore();
  const { t } = useTranslation();
  return (
    <ContentPlaceholder title={t('content.welcomeToAllusion')} icon={<SVG src={LOGO_FC} />}>
      <p>
        {t('content.welcomeDescription')}
      </p>
      <p>
        {t('content.welcomeNeedsToKnow')}
        <br />
        {t('content.welcomeAddLocation')}
      </p>

      <div className="divider" />

      <p>{t('content.welcomeNewToAllusion')}</p>
      <Button styling="outlined" text={t('content.welcomeOpenHelpCenter')} onClick={uiStore.toggleHelpCenter} />

      <br />
      <br />
      <br />

      {/* Mention principles (?) */}
      <small>{t('content.welcomeReadonly')}</small>
    </ContentPlaceholder>
  );
};

const NoContentFound = () => {
  const { uiStore } = useStore();
  const { t } = useTranslation();
  return (
    <ContentPlaceholder title={t('content.noImages')} icon={IconSet.MEDIA}>
      <p>{t('content.noImagesDescription')}</p>
      <Button onClick={uiStore.toggleOutliner} text={t('content.toggleOutliner')} styling="outlined" />
    </ContentPlaceholder>
  );
};

const NoQueryContent = () => {
  const { fileStore } = useStore();
  const { t } = useTranslation();
  return (
    <ContentPlaceholder title={t('content.noImagesFound')} icon={IconSet.SEARCH}>
      <p>{t('content.trySearchingElsewhere')}</p>
      {/* TODO: when search includes a Hidden tag, remind the user that's what might be causing them to see no results */}
      <ButtonGroup align="center">
        <Button
          text={t('content.allImages')}
          icon={IconSet.MEDIA}
          onClick={fileStore.fetchAllFiles}
          styling="outlined"
        />
        <Button
          text={t('content.untagged')}
          icon={IconSet.TAG_BLANCO}
          onClick={fileStore.fetchUntaggedFiles}
          styling="outlined"
        />
      </ButtonGroup>
    </ContentPlaceholder>
  );
};

const NoUntaggedContent = () => {
  const { fileStore } = useStore();
  const { t } = useTranslation();
  return (
    <ContentPlaceholder title={t('content.noUntaggedImages')} icon={IconSet.TAG}>
      <p>{t('content.allImagesTagged')}</p>
      <Button
        text={t('content.allImagesLabel')}
        icon={IconSet.MEDIA}
        onClick={fileStore.fetchAllFiles}
        styling="outlined"
      />
    </ContentPlaceholder>
  );
};

const NoMissingContent = () => {
  const { fileStore } = useStore();
  const { t } = useTranslation();
  return (
    <ContentPlaceholder title={t('content.noMissingImages')} icon={IconSet.WARNING_BROKEN_LINK}>
      <p>{t('content.trySearchingElsewhere')}</p>
      <ButtonGroup align="center">
        <Button
          text={t('content.allImages')}
          icon={IconSet.MEDIA}
          onClick={fileStore.fetchAllFiles}
          styling="outlined"
        />
        <Button
          text={t('content.untagged')}
          icon={IconSet.TAG_BLANCO}
          onClick={fileStore.fetchUntaggedFiles}
          styling="outlined"
        />
      </ButtonGroup>
    </ContentPlaceholder>
  );
};

const BugReport = () => {
  const { t } = useTranslation();
  return (
    <ContentPlaceholder title={t('content.bugEncountered')} icon={IconSet.WARNING_FILL}>
      <p>{t('content.reportBug')}</p>
    </ContentPlaceholder>
  );
};

interface IContentPlaceholder {
  icon: JSX.Element;
  title: string;
  children: React.ReactNode | React.ReactNodeArray;
}

const ContentPlaceholder = (props: IContentPlaceholder) => {
  return (
    <div id="content-placeholder">
      <span className="custom-icon-128">{props.icon}</span>
      <h2 className="dialog-title">{props.title}</h2>
      {props.children}
    </div>
  );
};
