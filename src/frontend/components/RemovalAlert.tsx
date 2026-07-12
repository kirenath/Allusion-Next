import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { IconSet, Tag } from 'widgets';
import { Alert, DialogButton } from 'widgets/popovers';
import { RendererMessenger } from '../../ipc/renderer';
import { useStore } from '../contexts/StoreContext';
import { ClientLocation, ClientSubLocation } from '../entities/Location';
import { ClientFileSearchItem } from '../entities/SearchItem';
import { ClientTag } from '../entities/Tag';
import { AppToaster } from './Toaster';
import { ClientExtraProperty } from '../entities/ExtraProperty';
import { ClientFile } from '../entities/File';
import { ExtraPropertyValue } from 'src/api/extraProperty';
import { VirtualizedGrid, VirtualizedGridRowProps } from 'widgets/combobox/Grid';

interface IRemovalProps<T> {
  object: T;
  onClose: () => void;
}

export const LocationRemoval = (props: IRemovalProps<ClientLocation>) => {
  const { t } = useTranslation();
  return (
    <RemovalAlert
      open
      title={t('dialogs.deleteLocationConfirm', { name: props.object.name })}
      information={t('dialogs.deleteLocationInfo')}
      onCancel={props.onClose}
      onConfirm={() => {
        props.onClose();
        props.object.delete();
      }}
    />
  );
};

export const SubLocationExclusion = (props: IRemovalProps<ClientSubLocation>) => {
  const { t } = useTranslation();
  return (
    <Alert
      open
      title={t('dialogs.excludeDirectoryConfirm', { name: props.object.name })}
      icon={IconSet.WARNING}
      type="warning"
      primaryButtonText={t('common.exclude')}
      defaultButton={DialogButton.PrimaryButton}
      onClick={(button) => {
        if (button !== DialogButton.CloseButton) {
          props.object.toggleExcluded();
        }
        props.onClose();
      }}
    >
      <p>{t('dialogs.excludeDirectoryInfo')}</p>
    </Alert>
  );
};

export const TagRemoval = observer((props: IRemovalProps<ClientTag>) => {
  const { uiStore } = useStore();
  const { t } = useTranslation();
  const { object } = props;
  const tagsToRemove = Array.from(
    new Map(
      (object.isSelected
        ? [...uiStore.tagSelection].flatMap((obj) => [...obj.getSubTree()])
        : [...object.getSubTree()]
      ).map((t) => [t.id, t]),
    ).values(),
  ).map((t) => <Tag key={t.id} text={t.name} color={t.viewColor} isHeader={t.isHeader} />);

  return (
    <RemovalAlert
      open
      title={t('dialogs.deleteTagConfirm')}
      information={t('dialogs.deleteTagInfo')}
      body={
        tagsToRemove.length > 0 && (
          <div id="tag-remove-overview" className="tag-overview">
            <p>{t('dialogs.selectedTags')}</p>
            {tagsToRemove}
          </div>
        )
      }
      onCancel={props.onClose}
      onConfirm={() => {
        props.onClose();
        object.isSelected ? uiStore.removeSelectedTags() : props.object.delete();
      }}
    />
  );
});

export const ExtraPropertyRemoval = observer((props: IRemovalProps<ClientExtraProperty>) => {
  const { t } = useTranslation();
  return (
    <RemovalAlert
      open
      title={t('dialogs.deleteExtraPropertyConfirm', { name: props.object.name })}
      information={t('dialogs.deleteExtraPropertyInfo')}
      onCancel={props.onClose}
      onConfirm={() => {
        props.onClose();
        props.object.delete();
      }}
    />
  );
});

export const ExtraPropertyUnAssign = observer(
  (
    props: IRemovalProps<{
      files: ClientFile[];
      extraProperty: ClientExtraProperty;
    }>,
  ) => {
    const { extraPropertyStore, uiStore, fileStore } = useStore();
    const { t } = useTranslation();
    const fileCount = uiStore.isAllFilesSelected
      ? fileStore.numFilteredFiles
      : props.object.files.length;
    //If the file selection has less than 2 files auto confirm
    useEffect(() => {
      if (fileCount < 2) {
        props.onClose();
        extraPropertyStore.removeFromFiles(props.object.files, props.object.extraProperty);
      }
    }, [props, extraPropertyStore, fileCount]);

    const extraPropertyName = props.object.extraProperty.name;
    if (fileCount < 2) {
      return <></>;
    }
    return (
      <RemovalAlert
        open
        title={t('dialogs.removeExtraPropertyConfirm', { name: extraPropertyName, count: fileCount })}
        information={t('dialogs.removeExtraPropertyInfo')}
        primaryButtonText={t('common.remove')}
        onCancel={props.onClose}
        onConfirm={() => {
          props.onClose();
          extraPropertyStore.removeFromFiles(props.object.files, props.object.extraProperty);
        }}
      />
    );
  },
);

export const ExtraPropertyOverwrite = observer(
  (
    props: IRemovalProps<{
      files: ClientFile[];
      extraProperty: ClientExtraProperty;
      value: ExtraPropertyValue;
    }>,
  ) => {
    const { extraPropertyStore, uiStore, fileStore } = useStore();
    const { t } = useTranslation();
    const fileCount = uiStore.isAllFilesSelected
      ? fileStore.numFilteredFiles
      : props.object.files.length;
    //If the file selection has less than 2 files auto confirm
    useEffect(() => {
      if (fileCount < 2) {
        props.onClose();
        extraPropertyStore.dispatchOnFiles(
          props.object.files,
          props.object.extraProperty,
          props.object.value,
        );
      }
    }, [props, extraPropertyStore, fileCount]);

    const extraPropertyName = props.object.extraProperty.name;
    if (fileCount < 2) {
      return <></>;
    }
    return (
      <RemovalAlert
        open
        title={t('dialogs.overwriteExtraPropertyConfirm', { name: extraPropertyName, count: fileCount })}
        information={t('dialogs.overwriteExtraPropertyInfo')}
        primaryButtonText={t('common.confirm')}
        onCancel={props.onClose}
        onConfirm={() => {
          props.onClose();
          extraPropertyStore.dispatchOnFiles(
            props.object.files,
            props.object.extraProperty,
            props.object.value,
          );
        }}
      />
    );
  },
);

export const FileRow = ({ index, style, data }: VirtualizedGridRowProps<ClientFile>) => {
  const item = data[index];
  return (
    <div key={item.id} style={style}>
      {item.absolutePath}
    </div>
  );
};

export const FileRemoval = observer(() => {
  const { fileStore, uiStore } = useStore();
  const { t } = useTranslation();
  const selection = uiStore.fileSelection;

  const handleConfirm = action(() => {
    uiStore.closeToolbarFileRemover();
    const files = [];
    for (const file of selection) {
      if (file.isBroken === true) {
        files.push(file);
      }
    }
    fileStore.deleteFiles(files);
  });

  return (
    <RemovalAlert
      open={uiStore.isToolbarFileRemoverOpen}
      title={t('dialogs.deleteMissingFileConfirm', { count: selection.size, plur: selection.size > 1 ? 's' : '' })}
      information={t('dialogs.deleteMissingFileInfo')}
      body={
        uiStore.isToolbarFileRemoverOpen ? (
          <div className="deletion-confirmation-list">
            <VirtualizedGrid itemData={Array.from(selection)} itemsInView={10} children={FileRow} />
          </div>
        ) : (
          <></>
        )
      }
      onCancel={uiStore.closeToolbarFileRemover}
      onConfirm={handleConfirm}
    />
  );
});

export const MoveFilesToTrashBin = observer(() => {
  const { fileStore, uiStore } = useStore();
  const { t } = useTranslation();
  const selection = uiStore.fileSelection;

  const handleConfirm = action(async () => {
    uiStore.closeMoveFilesToTrash();
    const files = [];
    for (const file of selection) {
      // File deletion used to be possible in renderer process, not in new electron version
      // await shell.trashItem(file.absolutePath);
      // https://github.com/electron/electron/issues/29598
      const error = await RendererMessenger.trashFile(file.absolutePath);
      if (!error) {
        files.push(file);
      } else {
        console.warn('Could not move file to trash', file.absolutePath, error);
      }
    }
    fileStore.deleteFiles(files);
    if (files.length !== selection.size) {
      AppToaster.show({
        message: t('dialogs.someFilesCouldNotBeDeleted'),
        clickAction: {
          onClick: () => RendererMessenger.toggleDevTools(),
          label: t('common.moreInfo'),
        },
        timeout: 8000,
      });
    }
  });

  const isMulti = selection.size > 1;

  return (
    <RemovalAlert
      open={uiStore.isMoveFilesToTrashOpen}
      title={t('dialogs.deleteFileConfirm', { count: selection.size, plur: isMulti ? 's' : '' })}
      information={t('dialogs.deleteFileInfo', { them: isMulti ? 'them' : 'it' })}
      body={
        uiStore.isMoveFilesToTrashOpen ? (
          <div className="deletion-confirmation-list">
            <VirtualizedGrid itemData={Array.from(selection)} itemsInView={10} children={FileRow} />
          </div>
        ) : (
          <></>
        )
      }
      onCancel={uiStore.closeMoveFilesToTrash}
      onConfirm={handleConfirm}
    />
  );
});

export const SavedSearchRemoval = observer((props: IRemovalProps<ClientFileSearchItem>) => {
  const { searchStore } = useStore();
  const { t } = useTranslation();
  return (
    <RemovalAlert
      open
      title={t('dialogs.searchItemRemovalTitle')}
      information={t('dialogs.searchItemRemovalInfo', { name: props.object.name })}
      onCancel={props.onClose}
      onConfirm={() => {
        props.onClose();
        searchStore.remove(props.object);
      }}
    />
  );
});

interface IRemovalAlertProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  information: string;
  primaryButtonText?: string;
  body?: React.ReactNode;
}

const RemovalAlert = (props: IRemovalAlertProps) => {
  const { t } = useTranslation();
  return (
    <Alert
      open={props.open}
      title={props.title}
      icon={IconSet.WARNING}
      type="danger"
      primaryButtonText={props.primaryButtonText ? props.primaryButtonText : t('common.delete')}
      defaultButton={DialogButton.PrimaryButton}
      onClick={(button) =>
        button === DialogButton.CloseButton ? props.onCancel() : props.onConfirm()
      }
    >
      <p>{props.information}</p>
      {props.body}
    </Alert>
  );
};
