import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import PreloadIcon from 'resources/icons/preload.svg';
import { SVG } from 'widgets/icons';
import { RendererMessenger } from 'src/ipc/renderer';
import { LibraryInfo } from 'src/ipc/messages';

type LibraryPickerProps = {
  onPicked: (library: LibraryInfo) => void;
};

/**
 * Obsidian-vault-style library picker, shown at startup before the database
 * is initialized. Rendered outside the store providers, so it only relies on
 * IPC and translations.
 */
const LibraryPicker = ({ onPicked }: LibraryPickerProps) => {
  const { t } = useTranslation();
  const [libraries, setLibraries] = useState<LibraryInfo[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  const refresh = useCallback(async () => {
    const registry = await RendererMessenger.getLibraries();
    setLibraries(registry.libraries);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openLibrary = useCallback(
    async (path: string) => {
      if (isBusy) {
        return;
      }
      setIsBusy(true);
      try {
        const library = await RendererMessenger.setActiveLibrary(path, false);
        onPicked(library);
      } catch (e) {
        console.error('Could not open library', path, e);
        setIsBusy(false);
      }
    },
    [isBusy, onPicked],
  );

  const browseForLibrary = useCallback(async () => {
    const { filePaths } = await RendererMessenger.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    });
    if (filePaths.length > 0) {
      openLibrary(filePaths[0]);
    }
  }, [openLibrary]);

  const removeFromRecents = useCallback(
    async (path: string) => {
      await RendererMessenger.removeRecentLibrary(path);
      refresh();
    },
    [refresh],
  );

  return (
    <div style={styles.container} id="library-picker">
      <div style={styles.panel}>
        <div style={styles.header}>
          <SVG src={PreloadIcon} style={{ fill: '#fff', width: '42px', height: '36px' }} />
          <h1 style={styles.title}>{t('libraries.pickerTitle')}</h1>
          <p style={styles.subtitle}>{t('libraries.pickerSubtitle')}</p>
        </div>

        {libraries.length > 0 && (
          <div style={styles.list}>
            {libraries.map((lib) => (
              <div key={lib.path} style={styles.listItem}>
                <button
                  style={styles.libraryButton}
                  onClick={() => openLibrary(lib.path)}
                  disabled={isBusy}
                  title={lib.path}
                >
                  <span style={styles.libraryName}>
                    {lib.name}
                    {lib.isDefault ? ` (${t('libraries.defaultLibrary')})` : ''}
                  </span>
                  <span style={styles.libraryPath}>{lib.path}</span>
                  <span style={styles.libraryDate}>
                    {t('libraries.lastOpened', {
                      date: new Date(lib.lastOpened).toLocaleString(),
                    })}
                  </span>
                </button>
                <button
                  style={styles.removeButton}
                  onClick={() => removeFromRecents(lib.path)}
                  disabled={isBusy}
                  title={t('libraries.removeFromList')}
                  aria-label={t('libraries.removeFromList')}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {libraries.length === 0 && <p style={styles.emptyText}>{t('libraries.noLibrariesYet')}</p>}

        <div style={styles.actions}>
          <button style={styles.actionButton} onClick={browseForLibrary} disabled={isBusy}>
            {t('libraries.openFolderAsLibrary')}
          </button>
        </div>
        <p style={styles.hint}>{t('libraries.openFolderHint')}</p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1e23',
    color: '#f5f8fa',
    fontFamily:
      '-apple-system, "BlinkMacSystemFont", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Open Sans", "Helvetica Neue", sans-serif',
    WebkitFontSmoothing: 'antialiased',
    overflow: 'auto',
  },
  panel: {
    width: 'min(560px, 90vw)',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '32px',
  },
  header: {
    textAlign: 'center',
  },
  title: {
    margin: '12px 0 4px',
    fontSize: '22px',
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    fontSize: '13px',
    color: '#9aa0a6',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    overflowY: 'auto',
    minHeight: 0,
  },
  listItem: {
    display: 'flex',
    alignItems: 'stretch',
    gap: '8px',
  },
  libraryButton: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #33363d',
    backgroundColor: '#25282e',
    color: '#f5f8fa',
    cursor: 'pointer',
    textAlign: 'left',
    minWidth: 0,
  },
  libraryName: {
    fontSize: '15px',
    fontWeight: 600,
  },
  libraryPath: {
    fontSize: '12px',
    color: '#9aa0a6',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    direction: 'rtl',
  },
  libraryDate: {
    fontSize: '11px',
    color: '#6f757d',
  },
  removeButton: {
    width: '36px',
    borderRadius: '8px',
    border: '1px solid #33363d',
    backgroundColor: 'transparent',
    color: '#9aa0a6',
    cursor: 'pointer',
    flexShrink: 0,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9aa0a6',
    fontSize: '13px',
    margin: 0,
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
  },
  actionButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  hint: {
    margin: 0,
    textAlign: 'center',
    fontSize: '12px',
    color: '#6f757d',
  },
};

export default LibraryPicker;
