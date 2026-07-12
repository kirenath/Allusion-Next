import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { IconSet, Toggle } from 'widgets';
import { ContextMenuLayer } from 'widgets/menus';
import { Toolbar, ToolbarButton } from 'widgets/toolbar';
import ContentView from './containers/ContentView';
import ErrorBoundary from './containers/ErrorBoundary';
import { useStore } from './contexts/StoreContext';
import { useWorkerListener } from './image/ThumbnailGeneration';

const PreviewApp = observer(() => {
  const { uiStore, fileStore } = useStore();
  const { t } = useTranslation();

  // Listen to responses of Web Workers
  useWorkerListener();

  useEffect(() => uiStore.enableSlideMode(), [uiStore]);

  const handleLeftButton = useCallback(
    () => uiStore.setFirstItem(Math.max(0, uiStore.firstItemIndex - 1)),
    [uiStore],
  );

  const handleRightButton = useCallback(
    () => uiStore.setFirstItem(Math.min(uiStore.firstItemIndex + 1, fileStore.fileList.length - 1)),
    [fileStore.fileList.length, uiStore],
  );

  // disable fade-in on initalization (when file list changes)
  const [isInitializing, setIsInitializing] = useState(true);
  useEffect(() => {
    setIsInitializing(true);
    setTimeout(() => setIsInitializing(false), 1000);
  }, [fileStore.fileListLastRefetch]);

  return (
    <div
      id="preview"
      className={`${uiStore.theme} scrollbar-classic ${
        isInitializing ? 'preview-window-initializing' : ''
      }`}
    >
      <ErrorBoundary>
        <Toolbar id="toolbar" label="Preview Command Bar" controls="content-view" isCompact>
          <ToolbarButton
            icon={IconSet.ARROW_LEFT}
            text={t('preview.previousImage')}
            onClick={handleLeftButton}
            disabled={uiStore.firstItemIndex === 0}
          />
          <ToolbarButton
            icon={IconSet.ARROW_RIGHT}
            text={t('preview.nextImage')}
            onClick={handleRightButton}
            disabled={uiStore.firstItemIndex === fileStore.fileList.length - 1}
          />
          <Toggle onChange={uiStore.toggleSlideMode} checked={!uiStore.isSlideMode}>
            {t('preview.fullSize')}
          </Toggle>

          <div className="spacer" />

          <ToolbarButton
            icon={IconSet.INFO}
            onClick={uiStore.toggleSlideInspector}
            checked={uiStore.isSlideInspectorOpen}
            text={t('preview.toggleInspector')}
            tooltip={t('preview.toggleInspector')}
          />
        </Toolbar>

        <ContextMenuLayer>
          <ContentView />
        </ContextMenuLayer>
      </ErrorBoundary>
    </div>
  );
});

PreviewApp.displayName = 'PreviewApp';

export default PreviewApp;
