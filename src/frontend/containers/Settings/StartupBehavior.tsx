import { observer } from 'mobx-react-lite';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RendererMessenger } from 'src/ipc/renderer';
import { Toggle } from 'widgets';
import { useStore } from '../../contexts/StoreContext';

export const StartupBehavior = observer(() => {
  const { uiStore } = useStore();
  const { t } = useTranslation();

  const [isAutoUpdateEnabled, setAutoUpdateEnabled] = useState(
    RendererMessenger.isCheckUpdatesOnStartupEnabled,
  );

  const toggleAutoUpdate = useCallback(() => {
    RendererMessenger.toggleCheckUpdatesOnStartup();
    setAutoUpdateEnabled((isOn) => !isOn);
  }, []);

  return (
    <div className="vstack">
      <Toggle
        checked={uiStore.isRememberSearchEnabled}
        onChange={uiStore.toggleRememberSearchQuery}
      >
        {t('settings.restoreLastSearch')}
      </Toggle>
      <Toggle
        checked={uiStore.isRefreshLocationsStartupEnabled}
        onChange={uiStore.toggleRefreshLocationStartup}
      >
        {t('settings.refreshNonAutoSyncedLocations')}
      </Toggle>
      <br />
      <Toggle checked={isAutoUpdateEnabled} onChange={toggleAutoUpdate}>
        {t('settings.checkForUpdates')}
      </Toggle>
    </div>
  );
});
