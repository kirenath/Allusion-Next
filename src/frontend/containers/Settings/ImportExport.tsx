import { getFilenameFriendlyFormattedDateTime } from 'common/fmt';
import { shell } from 'electron';
import { observer } from 'mobx-react-lite';
import SysPath from 'path';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppToaster } from 'src/frontend/components/Toaster';
import { RendererMessenger } from 'src/ipc/renderer';
import { Button, ButtonGroup, IconSet } from 'widgets';
import { Callout } from 'widgets/notifications';
import { Alert, DialogButton } from 'widgets/popovers';
import { useStore } from '../../contexts/StoreContext';
import ExternalLink from 'src/frontend/components/ExternalLink';
import FileInput from 'src/frontend/components/FileInput';

export const ImportExport = observer(() => {
  const rootStore = useStore();
  const { fileStore, tagStore, exifTool } = rootStore;
  const { t } = useTranslation();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isConfirmingMetadataExport, setConfirmingMetadataExport] = useState(false);
  const [isConfirmingFileImport, setConfirmingFileImport] = useState<{
    path: string;
    info: string;
  }>();
  const [backupDir, setBackupDir] = useState('');
  useEffect(() => {
    RendererMessenger.getDefaultBackupDirectory().then(setBackupDir);
  }, []);

  const handleChooseImportDir = async ([path]: [string, ...string[]]) => {
    try {
      const [numTags, numFiles] = await rootStore.peekDatabaseFile(path);
      setConfirmingFileImport({
        path,
        info: `Backup contains ${numTags} tags (currently ${tagStore.count}) and ${numFiles} images (currently ${fileStore.numTotalFiles}).`,
      });
    } catch (e) {
      console.log(e);
      AppToaster.show({ message: t('settings.backupFileInvalid'), timeout: 5000 });
    }
  };

  const handleCreateExport = async () => {
    const formattedDateTime = getFilenameFriendlyFormattedDateTime(new Date());
    const filename = `backup_${formattedDateTime}.sqlite`.replaceAll(':', '-');
    const filepath = SysPath.join(backupDir, filename);
    try {
      await rootStore.backupDatabaseToFile(filepath);
      AppToaster.show({
        message: t('settings.backupCreatedSuccessfully'),
        clickAction: { label: t('settings.view'), onClick: () => shell.showItemInFolder(filepath) },
        timeout: 5000,
      });
    } catch (e) {
      console.error(e);
      AppToaster.show({
        message: t('settings.couldNotCreateBackup'),
        clickAction: { label: t('settings.view'), onClick: RendererMessenger.toggleDevTools },
        timeout: 5000,
      });
    }
  };

  const handleOptimizeDatabase = async () => {
    if (isOptimizing) {
      return;
    }
    setIsOptimizing(true);
    const loadingToastKey = AppToaster.show({
      message: t('settings.optimizingDatabase'),
      type: 'info',
      timeout: 0,
    });

    try {
      await rootStore.optimizeDatabase();
      AppToaster.dismiss(loadingToastKey);
      AppToaster.show({
        message: t('settings.databaseOptimized'),
        type: 'success',
        timeout: 5000,
      });
    } catch (e) {
      console.error(e);
      AppToaster.dismiss(loadingToastKey);
      AppToaster.show({
        message: t('settings.couldNotOptimizeDatabase'),
        type: 'error',
        clickAction: { label: t('settings.view'), onClick: RendererMessenger.toggleDevTools },
        timeout: 5000,
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <>
      <h3>{t('settings.fileMetadata')}</h3>

      <p>
        This option is useful for importing/exporting tags from/to other software. If you use a
        service like Dropbox or Google, you can write your tags to your files on one device and read
        them on other devices.
      </p>
      <Callout icon={IconSet.INFO}>
        The separator is used to format the tags metadata. For example a file with the assigned tags
        Food, Fruit and Apple will be formatted with the currently selected separator as{' '}
        <pre style={{ display: 'inline' }}>
          {['Food', 'Fruit', 'Apple'].join(exifTool.hierarchicalSeparator)}
        </pre>
        .
      </Callout>
      <div className="vstack">
        <label>
          {t('settings.hierarchicalSeparator')}
          <select
            value={exifTool.hierarchicalSeparator}
            onChange={(e) => exifTool.setHierarchicalSeparator(e.target.value)}
          >
            <option value="|">|</option>
            <option value="/">/</option>
            <option value="\">\</option>
            <option value=":">:</option>
          </select>
        </label>
        {/* TODO: adobe bridge has option to read with multiple separators */}

        <ButtonGroup>
          <Button
            text={t('settings.importTagsFromMetadata')}
            onClick={fileStore.readTagsFromFiles}
            styling="outlined"
          />
          <Button
            text={t('settings.exportTagsToMetadata')}
            onClick={() => setConfirmingMetadataExport(true)}
            styling="outlined"
          />
          <Alert
            open={isConfirmingMetadataExport}
            title={t('settings.confirmOverwriteTags')}
            primaryButtonText={t('common.export')}
            onClick={(button) => {
              if (button === DialogButton.PrimaryButton) {
                fileStore.writeTagsToFiles();
              }
              setConfirmingMetadataExport(false);
            }}
          >
            <p>
              This will overwrite any existing tags (a.k.a. keywords) in those files with
              Allusion&#39;s tags. It is recommended to import all tags before writing new tags.
            </p>
          </Alert>
        </ButtonGroup>
      </div>

      <h3>{t('settings.backupDatabase')}</h3>

      <Callout icon={IconSet.INFO}>
        Automatic back-ups are created every 10 minutes in the{' '}
        <ExternalLink url={backupDir}>backup directory</ExternalLink>.
      </Callout>
      <Callout icon={IconSet.INFO}>
        Optimizing the database frees up unused disk space left by deleted records and reorganizes
        internal structures. This helps maintain long-term performance.
      </Callout>
      <ButtonGroup>
        <FileInput
          className="btn-outlined"
          options={{
            properties: ['openFile'],
            filters: [
              { extensions: ['sqlite', 'json'], name: 'Backup file' },
              { extensions: ['sqlite'], name: 'SQLite' },
              { extensions: ['json'], name: 'JSON' },
            ],
            defaultPath: backupDir,
          }}
          onChange={handleChooseImportDir}
        >
          {IconSet.IMPORT} {t('settings.restoreDatabaseFromFile')}
        </FileInput>
        <Button
          text={isOptimizing ? t('settings.optimizingStorage') : t('settings.optimizeDatabase')}
          onClick={handleOptimizeDatabase}
          icon={IconSet.CLEAR_DATABASE}
          styling="outlined"
          disabled={isOptimizing}
        />
        <Button
          text={t('settings.backupDatabaseToFile')}
          onClick={handleCreateExport}
          icon={IconSet.OPEN_EXTERNAL}
          styling="outlined"
        />

        <Alert
          open={Boolean(isConfirmingFileImport)}
          title={t('settings.confirmRestoreDatabase')}
          primaryButtonText={t('common.import')}
          onClick={async (button) => {
            if (isConfirmingFileImport && button === DialogButton.PrimaryButton) {
              AppToaster.show({
                message:
                  t('settings.restoringDatabase'),
                timeout: 0,
              });
              try {
                fileStore.setDirtyMissingFiles(true);
                fileStore.setDirtyTotalFiles(true);
                fileStore.setDirtyUntaggedFiles(true);
                await rootStore.restoreDatabaseFromFile(isConfirmingFileImport.path);
                RendererMessenger.reload();
              } catch (e) {
                console.error('Could not restore backup', e);
                AppToaster.show({
                  message: t('settings.restoringDatabaseFailed'),
                  timeout: 5000,
                });
              }
            }
            setConfirmingFileImport(undefined);
          }}
        >
          <p>
            This will replace your current tag hierarchy and any tags assigned to images, so it is
            recommended you create a backup first.
          </p>
          <p>{isConfirmingFileImport?.info}</p>
        </Alert>
      </ButtonGroup>
    </>
  );
});
