import { observer } from 'mobx-react-lite';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'src/frontend/contexts/StoreContext';
import { INTERACTION_PATH_ATTRIBUTE_NAME } from 'src/frontend/hooks/useScopeInteraction';
import { IconSet } from 'widgets/icons';
import { ToolbarButton } from 'widgets/toolbar';

export const FileTagEditorButton = observer(() => {
  const { uiStore } = useStore();
  const { t } = useTranslation();
  if (!uiStore.toolbarButtonsVisibility['fileTags']) {
    return null;
  }
  return (
    <div {...{ [INTERACTION_PATH_ATTRIBUTE_NAME]: 'floating-panel/file-tags-editor-button' }}>
      <ToolbarButton
        id="file-tags-editor-button"
        icon={IconSet.TAG_LINE}
        onClick={uiStore.toggleFileTagsEditor}
        text={t('toolbar.tagSelectedFiles')}
        tooltip={t('toolbar.tagSelectedFilesTooltip')}
      />
    </div>
  );
});

export const FileExtraPropertiesEditorButton = observer(() => {
  const { uiStore } = useStore();
  const { t } = useTranslation();
  if (!uiStore.toolbarButtonsVisibility['extraProperties']) {
    return null;
  }
  return (
    <div {...{ [INTERACTION_PATH_ATTRIBUTE_NAME]: 'floating-panel/file-tags-editor-button' }}>
      <ToolbarButton
        id="file-extra-properties-editor-button"
        icon={IconSet.OUTLINER4}
        onClick={uiStore.toggleFileExtraPropertiesEditor}
        text={t('toolbar.fileExtraProperties')}
        tooltip={t('toolbar.fileExtraPropertiesTooltip')}
        {...{ [INTERACTION_PATH_ATTRIBUTE_NAME]: 'floating-panel/file-tags-editor-button' }}
      />
    </div>
  );
});

export const FileExifEditorButton = observer(() => {
  const { uiStore } = useStore();
  const { t } = useTranslation();
  if (!uiStore.toolbarButtonsVisibility['info']) {
    return null;
  }
  return (
    <div {...{ [INTERACTION_PATH_ATTRIBUTE_NAME]: 'floating-panel/file-tags-editor-button' }}>
      <ToolbarButton
        id="file-exif-editor-button"
        icon={IconSet.META_INFO_2}
        onClick={uiStore.toggleFileExtifEditor}
        text={t('toolbar.fileInfo')}
        tooltip={t('toolbar.fileInfoTooltip')}
        {...{ [INTERACTION_PATH_ATTRIBUTE_NAME]: 'floating-panel/file-tags-editor-button' }}
      />
    </div>
  );
});

export const InspectorButton = observer(() => {
  const { uiStore } = useStore();
  const { t } = useTranslation();
  const isSlide = uiStore.isSlideMode;
  const name = isSlide ? 'slideInspector' : 'overviewInspector';
  if (!uiStore.toolbarButtonsVisibility[name]) {
    return null;
  }
  return (
    <ToolbarButton
      icon={IconSet.INFO}
      onClick={isSlide ? uiStore.toggleSlideInspector : uiStore.toggleOverviewInspector}
      checked={isSlide ? uiStore.isSlideInspectorOpen : uiStore.isOverviewInspectorOpen}
      text={t('toolbar.toggleInspector')}
      tooltip={t('toolbar.toggleInspector')}
    />
  );
});
