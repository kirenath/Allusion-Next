import { shell } from 'electron';
import { observer } from 'mobx-react-lite';
import SysPath from 'path';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { IconSet } from 'widgets';
import { MenuItem, MenuRadioItem, MenuSubItem } from 'widgets/menus';
import { useStore } from '../../contexts/StoreContext';
import { ClientFile } from '../../entities/File';
import {
  ClientDateSearchCriteria,
  ClientFileSearchCriteria,
  ClientNumberSearchCriteria,
  ClientStringSearchCriteria,
  ClientTagSearchCriteria,
} from '../../entities/SearchCriteria';
import { ClientTag } from '../../entities/Tag';
import { LocationTreeItemRevealer } from '../Outliner/LocationsPanel';
import { TagsTreeItemRevealer } from '../Outliner/TagsPanel/TagsTree';
import { ClientExtraProperty } from 'src/frontend/entities/ExtraProperty';
import { isFileExtensionVideo } from 'common/fs';
import { runInAction } from 'mobx';

export const MissingFileMenuItems = observer(() => {
  const { uiStore, fileStore } = useStore();
  const { t } = useTranslation();
  return (
    <>
      <MenuItem
        onClick={fileStore.fetchMissingFiles}
        text={t('content.openRecoveryPanel')}
        icon={IconSet.WARNING_BROKEN_LINK}
        disabled={fileStore.showsMissingContent}
      />
      <MenuItem onClick={uiStore.copyTagsToClipboard} text={t('content.copyTags')} icon={IconSet.TAG_GROUP} />
      <MenuItem
        onClick={uiStore.openToolbarFileRemover}
        text={t('content.deleteMissingFileData')}
        icon={IconSet.DELETE}
      />
    </>
  );
});

export const FileViewerMenuItems = ({ file }: { file: ClientFile }) => {
  const { uiStore, locationStore, fileStore } = useStore();
  const { t } = useTranslation();

  const handleClearSelectedFileTags = () => {
    // Currently copy tags to clipboard as backup in case of error by the user
    // ToDo: add a confirm dialog?
    uiStore.copyTagsToClipboard();
    runInAction(() => {
      uiStore.dispatchToFileSelection(async (files) => files.forEach((f) => f.clearTags()));
    });
  };

  const handleViewFullSize = () => {
    uiStore.selectFile(file, true);
    uiStore.enableSlideMode();
  };

  const handlePreviewWindow = () => {
    // Only clear selection if file is not already selected
    uiStore.selectFile(file, !uiStore.fileSelection.has(file));
    uiStore.openPreviewWindow();
  };

  const handleSearchSimilar = (
    e: React.MouseEvent,
    crit: ClientFileSearchCriteria | ClientFileSearchCriteria[],
  ) => {
    const crits = Array.isArray(crit) ? crit : [crit];
    if (e.ctrlKey) {
      uiStore.addSearchCriterias(crits);
    } else {
      uiStore.replaceSearchCriterias(crits);
    }
  };

  const handleCopyImageToClipboard = () => {
    uiStore.selectFile(file, true);
    uiStore.copyImageToClipboard();
  };

  return (
    <>
      <MenuItem onClick={handleViewFullSize} text={t('content.viewAtFullSize')} icon={IconSet.SEARCH} />
      <MenuItem
        onClick={handleCopyImageToClipboard}
        text={t('content.copyImageToClipboard')}
        icon={IconSet.COPY}
        disabled={isFileExtensionVideo(file.extension)}
      />
      <MenuItem
        onClick={handlePreviewWindow}
        text={t('content.openInPreviewWindow')}
        icon={IconSet.PREVIEW}
      />
      <MenuSubItem text={t('content.tagging')} icon={IconSet.TAG_ADD}>
        <MenuItem
          onClick={uiStore.openFileTagsEditor}
          text={t('content.openTagSelector')}
          icon={IconSet.TAG}
        />
        <MenuItem
          onClick={fileStore.tagSelectedFilesUsingTaggingService}
          text={t('content.autoTagSelected')}
          icon={IconSet.TAG_ADD}
          disabled={fileStore.isTaggingWithService}
        />
        <MenuItem
          onClick={fileStore.readTagsFromSelectedFiles}
          text={t('content.importTagsFromMetadata')}
          icon={IconSet.TAG_ADD}
        />
        <MenuItem
          onClick={fileStore.writeTagsToSelectedFiles}
          text={t('content.overwriteTagsInMetadata')}
          icon={IconSet.WARNING}
        />
        <MenuItem
          onClick={handleClearSelectedFileTags}
          text={t('content.clearSelectedFilesTags')}
          icon={IconSet.TAG_BLANCO}
        />
      </MenuSubItem>
      <MenuItem onClick={uiStore.copyTagsToClipboard} text={t('content.copyTags')} icon={IconSet.TAG_GROUP} />
      <MenuItem
        onClick={uiStore.pasteTags}
        text={t('content.pasteTags')}
        icon={IconSet.TAG_GROUP_OPEN}
        disabled={uiStore.isTagClipboardEmpty()}
      />
      <MenuSubItem text={t('content.searchSimilarImages')} icon={IconSet.MORE}>
        <MenuItem
          onClick={(e) =>
            handleSearchSimilar(
              e,
              file.tags
                .toJSON()
                .map((t) => new ClientTagSearchCriteria(undefined, 'tags', t.id, 'contains')),
            )
          }
          text={t('content.sameTags')}
          icon={IconSet.TAG}
        />
        <MenuItem
          onClick={(e) =>
            handleSearchSimilar(
              e,
              new ClientStringSearchCriteria(
                undefined,
                'absolutePath',
                SysPath.dirname(file.absolutePath) + SysPath.sep,
                'startsWith',
              ),
            )
          }
          text={t('content.sameDirectory')}
          icon={IconSet.FOLDER_CLOSE}
        />
        <MenuItem
          onClick={(e) =>
            handleSearchSimilar(
              e,
              new ClientStringSearchCriteria(
                undefined,
                'absolutePath',
                locationStore.get(file.locationId)!.path + SysPath.sep,
                'startsWith',
              ),
            )
          }
          text={t('content.sameLocation')}
        />
        <MenuItem
          onClick={(e) =>
            handleSearchSimilar(
              e,
              new ClientStringSearchCriteria(undefined, 'extension', file.extension, 'equals'),
            )
          }
          text={t('content.sameFileType')}
          icon={IconSet.FILTER_FILE_TYPE}
        />
        <MenuItem
          onClick={(e) =>
            handleSearchSimilar(e, [
              new ClientNumberSearchCriteria(undefined, 'width', file.width, 'equals'),
              new ClientNumberSearchCriteria(undefined, 'height', file.height, 'equals'),
            ])
          }
          text={t('content.sameResolution')}
          icon={IconSet.ARROW_RIGHT}
        />
        <MenuItem
          onClick={(e) =>
            handleSearchSimilar(
              e,
              new ClientNumberSearchCriteria(undefined, 'size', file.size, 'equals'),
            )
          }
          text={t('content.sameFileSize')}
          icon={IconSet.FILTER_FILTER_DOWN}
        />
        <MenuItem
          onClick={(e) =>
            handleSearchSimilar(
              e,
              new ClientDateSearchCriteria(undefined, 'dateCreated', file.dateCreated, 'equals'),
            )
          }
          text={t('content.sameCreationDate')}
          icon={IconSet.FILTER_DATE}
        />
        <MenuItem
          onClick={(e) =>
            handleSearchSimilar(
              e,
              new ClientDateSearchCriteria(
                undefined,
                'dateModifiedOS',
                file.dateModifiedOS,
                'equals',
              ),
            )
          }
          text={t('content.sameModificationDate')}
        />
        <MenuItem
          onClick={(e) =>
            handleSearchSimilar(
              e,
              new ClientDateSearchCriteria(undefined, 'dateModified', file.dateModified, 'equals'),
            )
          }
          text={t('content.sameModificationDateInApp')}
        />
      </MenuSubItem>
    </>
  );
};

export const SlideFileViewerMenuItems = observer(({ file }: { file: ClientFile }) => {
  const { uiStore } = useStore();
  const { t } = useTranslation();

  const handlePreviewWindow = () => {
    uiStore.selectFile(file, true);
    uiStore.openPreviewWindow();
  };

  const handleCopyImageToClipboard = () => {
    uiStore.selectFile(file, true);
    uiStore.copyImageToClipboard();
  };

  const handleCopyTagsToClipboard = () => {
    uiStore.selectFile(file, true);
    uiStore.copyTagsToClipboard();
  };

  const handlePasteTags = () => {
    uiStore.selectFile(file, true);
    uiStore.pasteTags();
  };

  return (
    <>
      <MenuItem
        onClick={handleCopyImageToClipboard}
        text={t('content.copyImageToClipboard')}
        icon={IconSet.COPY}
        disabled={isFileExtensionVideo(file.extension)}
      />
      <MenuItem onClick={handleCopyTagsToClipboard} text={t('content.copyTags')} icon={IconSet.TAG_GROUP} />
      <MenuItem
        onClick={handlePasteTags}
        text={t('content.pasteTags')}
        icon={IconSet.TAG_GROUP_OPEN}
        disabled={uiStore.isTagClipboardEmpty()}
      />
      <MenuItem
        onClick={handlePreviewWindow}
        text={t('content.openInPreviewWindow')}
        icon={IconSet.PREVIEW}
      />

      <MenuSubItem text={t('content.upscaleFiltering')} icon={IconSet.VIEW_GRID}>
        <MenuRadioItem
          onClick={uiStore.setUpscaleModeSmooth}
          checked={uiStore.upscaleMode === 'smooth'}
          text={t('content.upscaleSmooth')}
        />
        <MenuRadioItem
          onClick={uiStore.setUpscaleModePixelated}
          checked={uiStore.upscaleMode === 'pixelated'}
          text={t('content.upscalePixelated')}
        />
      </MenuSubItem>
    </>
  );
});

export const ExternalAppMenuItems = observer(({ file }: { file: ClientFile }) => {
  const { uiStore } = useStore();
  const { t } = useTranslation();
  return (
    <>
      <MenuItem
        onClick={() => uiStore.openExternal()}
        text={t('content.openExternal')}
        icon={IconSet.OPEN_EXTERNAL}
        disabled={file.isBroken}
      />
      <MenuItem
        onClick={() =>
          LocationTreeItemRevealer.instance.revealSubLocation(file.locationId, file.absolutePath)
        }
        text={t('content.revealInLocationsPanel')}
        icon={IconSet.TREE_LIST}
      />
      <MenuItem
        onClick={() => shell.showItemInFolder(file.absolutePath)}
        text={t('content.revealInFileBrowser')}
        icon={IconSet.FOLDER_CLOSE}
        disabled={file.isBroken}
      />
      <MenuItem
        onClick={uiStore.openMoveFilesToTrash}
        text={uiStore.fileSelection.size > 1 ? t('content.deleteFiles') : t('content.deleteFile')}
        icon={IconSet.DELETE}
        disabled={file.isBroken}
      />
    </>
  );
});

export const FileTagMenuItems = observer(({ file, tag }: { file?: ClientFile; tag: ClientTag }) => {
  const { uiStore } = useStore();
  const { t } = useTranslation();
  const ctxTags = uiStore.getTagContextItems(tag.id);
  return (
    <>
      <MenuItem
        onClick={() => TagsTreeItemRevealer.instance.revealTag(tag)}
        text={t('content.revealInTagsPanel')}
        icon={IconSet.TREE_LIST}
        disabled={file ? file.isBroken : false}
      />
      <MenuItem
        onClick={() => uiStore.openTagPropertiesEditor(tag)}
        text={t('content.editTag')}
        icon={IconSet.EDIT}
      />
      <MenuItem
        onClick={() => uiStore.openTagMovePanel(tag)}
        text={t('content.moveTagTo')}
        icon={IconSet.TAG_GROUP}
      />
      <MenuItem
        onClick={() => uiStore.openTagMergePanel(tag)}
        text={t('content.mergeTagWith')}
        icon={IconSet.TAG_GROUP}
        disabled={ctxTags.some((tag) => tag.subTags.length > 0)}
      />
      <MenuItem
        onClick={() => file && file.removeTag(tag)}
        text={t('content.unassignTagFromFile')}
        icon={IconSet.TAG_BLANCO}
      />
    </>
  );
});

export const EditorTagSummaryItems = ({
  tag,
  beforeSelect,
}: {
  tag: ClientTag;
  beforeSelect: () => void;
}) => {
  const { uiStore } = useStore();
  const { t } = useTranslation();
  const ctxTags = uiStore.getTagContextItems(tag.id);
  return (
    <>
      <MenuItem
        onClick={() => {
          beforeSelect();
          TagsTreeItemRevealer.instance.revealTag(tag);
        }}
        text={t('content.revealInTagsPanel')}
        icon={IconSet.TREE_LIST}
      />
      <MenuItem
        onClick={() => {
          beforeSelect();
          uiStore.openTagPropertiesEditor(tag);
        }}
        text={t('content.editTag')}
        icon={IconSet.EDIT}
      />
      <MenuItem
        onClick={() => uiStore.openTagMovePanel(tag)}
        text={t('content.moveTo')}
        icon={IconSet.TAG_GROUP}
      />
      <MenuItem
        onClick={() => uiStore.openTagMergePanel(tag)}
        text={t('content.mergeWith')}
        icon={IconSet.TAG_GROUP}
        disabled={ctxTags.some((tag) => tag.subTags.length > 0)}
      />
    </>
  );
};

export const FileExtraPropertyMenuItems = observer(
  ({
    extraProperty,
    onDelete,
    onRemove,
    onRename,
  }: {
    extraProperty: ClientExtraProperty;
    onDelete: (extraProperty: ClientExtraProperty) => void;
    onRemove: (extraProperty: ClientExtraProperty) => void;
    onRename: (extraProperty: ClientExtraProperty) => void;
  }) => {
    const { uiStore } = useStore();
    const { t } = useTranslation();

    const isMultiple = uiStore.fileSelection.size > 1;
    return (
      <>
        <MenuItem
          onClick={() => onRemove(extraProperty)}
          text={isMultiple ? t('content.removeExtraPropertyFromFiles') : t('content.removeExtraPropertyFromFile')}
          icon={IconSet.CLOSE}
        />
        <MenuItem onClick={() => onRename(extraProperty)} text={t('common.rename')} icon={IconSet.EDIT} />
        <MenuItem
          onClick={() => onDelete(extraProperty)}
          text={t('content.deleteExtraProperty')}
          icon={IconSet.DELETE}
        />
      </>
    );
  },
);
