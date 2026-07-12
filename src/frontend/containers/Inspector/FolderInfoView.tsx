import React from 'react';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { shell } from 'electron';

import { useStore } from '../../contexts/StoreContext';
import { ClientLocation, ClientSubLocation } from '../../entities/Location';
import { ClientStringSearchCriteria } from '../../entities/SearchCriteria';
import { formatDateTime, humanFileSize } from 'common/fmt';
import { IconButton, IconSet } from 'widgets';

interface ResolvedFolder {
  name: string;
  path: string;
  dateAdded?: Date;
}

function resolveCurrentFolder(
  searchCriteriaList: readonly any[],
  locationList: readonly ClientLocation[],
): ResolvedFolder | null {
  const locationCriteria = searchCriteriaList.find(
    (c) =>
      c instanceof ClientStringSearchCriteria &&
      c.key === 'absolutePath' &&
      (c.operator === 'startsWith' || c.operator === 'equals'),
  ) as ClientStringSearchCriteria | undefined;

  if (!locationCriteria) {
    return null;
  }

  const searchPath = locationCriteria.value.replace(/[\\/]$/, '');

  for (const loc of locationList) {
    if (loc.path === searchPath) {
      return { name: loc.name, path: loc.path, dateAdded: loc.dateAdded };
    }

    const found = findSubLocation(loc.subLocations, searchPath);
    if (found) {
      return { name: found.name, path: found.path, dateAdded: loc.dateAdded };
    }
  }

  return null;
}

function findSubLocation(
  subs: readonly ClientSubLocation[],
  path: string,
): ClientSubLocation | null {
  for (const sub of subs) {
    if (sub.path === path) {
      return sub;
    }
    const found = findSubLocation(sub.subLocations, path);
    if (found) {
      return found;
    }
  }
  return null;
}

const FolderInfoView = observer(() => {
  const { fileStore, locationStore, uiStore } = useStore();
  const { t } = useTranslation();

  const folder = resolveCurrentFolder(uiStore.searchCriteriaList, locationStore.locationList);
  const totalSize = fileStore.definedFiles.reduce((sum, f) => sum + f.size, 0);
  const folderName = folder?.name ?? t('inspector.allFiles');
  const folderPath = folder?.path;

  return (
    <aside id="inspector" className="inspector">
      <section className="folder-info">
        <div className="folder-info-name">
          <input
            readOnly
            className="input folder-info-name-input"
            value={folderName}
          />
        </div>

        <div className="folder-info-description">
          <textarea
            readOnly
            className="input folder-info-description-input"
            placeholder={t('inspector.description')}
            rows={2}
          />
        </div>

        <header>
          <h2>{t('inspector.basicInfo')}</h2>
        </header>

        <table id="folder-info-table">
          <tbody>
            <tr>
              <th scope="row">{t('inspector.fileCount')}</th>
              <td>{fileStore.numFilteredFiles}</td>
            </tr>
            <tr>
              <th scope="row">{t('inspector.totalSize')}</th>
              <td>{humanFileSize(totalSize)}</td>
            </tr>
            {folder?.dateAdded && (
              <tr>
                <th scope="row">{t('inspector.dateAdded')}</th>
                <td>{formatDateTime(folder.dateAdded)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {folderPath && (
          <div className="folder-info-actions">
            <IconButton
              icon={IconSet.FOLDER_CLOSE}
              onClick={() => shell.openPath(folderPath)}
              text={t('inspector.openFolder')}
            />
          </div>
        )}
      </section>
    </aside>
  );
});

export default FolderInfoView;
