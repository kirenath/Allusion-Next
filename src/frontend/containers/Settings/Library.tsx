import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import FileInput from 'src/frontend/components/FileInput';
import { LibraryInfo } from 'src/ipc/messages';
import { RendererMessenger } from 'src/ipc/renderer';
import { Button, IconSet, Toggle } from 'widgets';
import { Callout } from 'widgets/notifications';
import { Alert, DialogButton } from 'widgets/popovers';

export const Library = () => {
  const { t } = useTranslation();

  const [libraries, setLibraries] = useState<LibraryInfo[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [showPickerOnStartup, setShowPickerOnStartup] = useState(false);
  const [pendingSwitchPath, setPendingSwitchPath] = useState<string>();

  const refresh = useCallback(async () => {
    const registry = await RendererMessenger.getLibraries();
    setLibraries(registry.libraries);
    setActivePath(registry.activePath);
    setShowPickerOnStartup(registry.showPickerOnStartup);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const togglePickerOnStartup = useCallback(async () => {
    setShowPickerOnStartup((show) => {
      RendererMessenger.toggleLibraryPickerOnStartup(!show);
      return !show;
    });
  }, []);

  const handleBrowseLibrary = useCallback(([path]: [string, ...string[]]) => {
    setPendingSwitchPath(path);
  }, []);

  const activeLibrary = libraries.find((lib) => lib.path === activePath);
  const recentLibraries = libraries.filter((lib) => lib.path !== activePath);

  return (
    <div className="vstack">
      <h3>{t('libraries.currentLibrary')}</h3>
      <div className="filepicker">
        <FileInput
          className="btn-minimal filepicker-input"
          options={{ properties: ['openDirectory', 'createDirectory'] }}
          onChange={handleBrowseLibrary}
        >
          {t('libraries.switchLibrary')}
        </FileInput>
        <h3 className="filepicker-label">
          {activeLibrary !== undefined
            ? activeLibrary.isDefault
              ? `${activeLibrary.name} (${t('libraries.defaultLibrary')})`
              : activeLibrary.name
            : t('libraries.defaultLibrary')}
        </h3>
        <div className="filepicker-path">{activePath ?? ''}</div>
      </div>

      <Callout icon={IconSet.INFO}>{t('libraries.switchExplanation')}</Callout>

      <Toggle checked={showPickerOnStartup} onChange={togglePickerOnStartup}>
        {t('libraries.showPickerOnStartup')}
      </Toggle>

      {recentLibraries.length > 0 && (
        <>
          <h3>{t('libraries.recentLibraries')}</h3>
          <div className="vstack">
            {recentLibraries.map((lib) => (
              <div className="filepicker" key={lib.path}>
                <div className="filepicker-input hstack">
                  <Button
                    styling="minimal"
                    text={t('libraries.open')}
                    onClick={() => setPendingSwitchPath(lib.path)}
                  />
                  <Button
                    styling="minimal"
                    text={t('libraries.removeFromList')}
                    onClick={async () => {
                      await RendererMessenger.removeRecentLibrary(lib.path);
                      refresh();
                    }}
                  />
                </div>
                <h3 className="filepicker-label">{lib.name}</h3>
                <div className="filepicker-path">{lib.path}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <Alert
        open={pendingSwitchPath !== undefined}
        title={t('libraries.confirmSwitchTitle')}
        primaryButtonText={t('libraries.switchAndRestart')}
        onClick={(button) => {
          if (button === DialogButton.PrimaryButton && pendingSwitchPath !== undefined) {
            RendererMessenger.setActiveLibrary(pendingSwitchPath, true);
          }
          setPendingSwitchPath(undefined);
        }}
      >
        <p>{t('libraries.confirmSwitchInfo')}</p>
        <p>
          <code>{pendingSwitchPath}</code>
        </p>
      </Alert>
    </div>
  );
};
