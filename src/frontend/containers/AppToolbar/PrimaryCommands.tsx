import { observer } from 'mobx-react-lite';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { IconSet } from 'widgets';
import { ToolbarButton } from 'widgets/toolbar';
import { FileRemoval } from '../../components/RemovalAlert';
import { useStore } from '../../contexts/StoreContext';
import {
  SortCommand,
  ThumbnailSizeToolbarSlider,
  ViewCommand,
  ViewSegmentedControl,
} from './Menus';
import Searchbar from './Searchbar';
import {
  FileExifEditorButton,
  FileExtraPropertiesEditorButton,
  FileTagEditorButton,
  InspectorButton,
} from './ToolbarButtons';

const OutlinerToggle = observer(() => {
  const { uiStore } = useStore();
  const { t } = useTranslation();

  return (
    <ToolbarButton
      id="outliner-toggle"
      text={t('toolbar.toggleOutliner')}
      icon={uiStore.isOutlinerOpen ? IconSet.DOUBLE_CARET : IconSet.MENU_HAMBURGER}
      controls="outliner"
      pressed={uiStore.isOutlinerOpen}
      onClick={uiStore.toggleOutliner}
      tabIndex={0}
    />
  );
});

const MultiSelectToggle = observer(() => {
  const { uiStore } = useStore();
  const { t } = useTranslation();

  return (
    <ToolbarButton
      id="multi-select-toggle"
      text={t('toolbar.multiSelect')}
      icon={IconSet.MULTI_SELECT}
      pressed={uiStore.isMultiSelectMode}
      onClick={uiStore.toggleMultiSelectMode}
      tooltip={t('toolbar.multiSelectTooltip')}
    />
  );
});

const PrimaryCommands = observer(() => {
  const { fileStore } = useStore();

  return (
    <>
      <OutlinerToggle />
      <MultiSelectToggle />
      <FileSelectionCommand />

      <ViewSegmentedControl />
      <ThumbnailSizeToolbarSlider />
      <SortCommand />
      <ViewCommand />

      <Searchbar />

      {/* TODO: Put back tag button (or just the T hotkey) */}
      {fileStore.showsMissingContent ? (
        // Only show option to remove selected files in toolbar when viewing missing files */}
        <RemoveFilesPopover />
      ) : (
        // Only show when not viewing missing files (so it is replaced by the Delete button)
        //<div className="expandable-button-list">
        <>
          <FileTagEditorButton />
          <FileExtraPropertiesEditorButton />
          <FileExifEditorButton />
          <InspectorButton />
        </>
        //</div>
      )}
    </>
  );
});

export default PrimaryCommands;

export const SlideModeCommand = () => {
  const { uiStore } = useStore();
  const { t } = useTranslation();
  return (
    <>
      <ToolbarButton
        isCollapsible={false}
        icon={IconSet.ARROW_LEFT}
        onClick={uiStore.disableSlideMode}
        text={t('toolbar.back')}
        tooltip={t('toolbar.backToContent')}
      />

      <div className="spacer" />

      <FileTagEditorButton />
      <FileExtraPropertiesEditorButton />
      <FileExifEditorButton />

      <InspectorButton />
    </>
  );
};

const FileSelectionCommand = observer(() => {
  const { uiStore, fileStore } = useStore();
  const { t } = useTranslation();
  const fileLoadedCount = fileStore.numLoadedFiles;
  const fileCount = fileStore.showsMissingContent ? fileLoadedCount : fileStore.numFilteredFiles;
  const allFilesSelected = uiStore.isAllFilesSelected;
  const selectionCount = allFilesSelected ? fileCount : uiStore.fileSelection.size;

  // If everything is selected, deselect all. Else, select all
  const handleToggleSelect = () => {
    allFilesSelected ? uiStore.clearFileSelection() : uiStore.selectAllFiles();
  };

  return (
    <ToolbarButton
      isCollapsible={false}
      icon={allFilesSelected ? IconSet.SELECT_ALL_CHECKED : IconSet.SELECT_ALL}
      onClick={handleToggleSelect}
      pressed={allFilesSelected}
      text={fileCount == 0 ? '0' : selectionCount + ' / ' + fileCount}
      tooltip={t('toolbar.selectTooltip', { count: fileLoadedCount })}
      disabled={fileCount === 0}
    />
  );
});

const RemoveFilesPopover = observer(() => {
  const { uiStore } = useStore();
  const { t } = useTranslation();
  return (
    <>
      <ToolbarButton
        icon={IconSet.DELETE}
        disabled={uiStore.fileSelection.size === 0}
        onClick={uiStore.openToolbarFileRemover}
        text={t('toolbar.delete')}
        tooltip={t('toolbar.deleteMissingTooltip')}
      />
      <FileRemoval />
    </>
  );
});
