import React from 'react';
import { observer } from 'mobx-react-lite';
import { action } from 'mobx';
import { useTranslation } from 'react-i18next';

import { useStore } from 'src/frontend/contexts/StoreContext';
import { IconSet } from 'widgets';
import { Alert, DialogButton } from 'widgets/popovers';
import { VirtualizedGrid } from 'widgets/combobox/Grid';
import { FileRow } from './RemovalAlert';

export const ManyOpenExternal = observer(() => {
  const { uiStore } = useStore();
  const { t } = useTranslation();
  const selection = uiStore.fileSelection;

  const handleConfirm = action(() => {
    uiStore.closeManyExternalFiles();
    uiStore.openExternal(false);
  });

  return (
    <Alert
      open={uiStore.isManyExternalFilesOpen}
      title={t('dialogs.openManyExternalConfirm', { count: selection.size })}
      icon={IconSet.WARNING}
      type="warning"
      primaryButtonText={t('common.confirm')}
      defaultButton={DialogButton.PrimaryButton}
      onClick={(button) => {
        if (button !== DialogButton.CloseButton) {
          handleConfirm();
        }
        uiStore.closeManyExternalFiles();
      }}
    >
      <p>{t('dialogs.openManyExternalWarning')}</p>
      {uiStore.isManyExternalFilesOpen ? (
        <div className="deletion-confirmation-list">
          <VirtualizedGrid itemData={Array.from(selection)} itemsInView={10} children={FileRow} />
        </div>
      ) : (
        <></>
      )}
    </Alert>
  );
});
