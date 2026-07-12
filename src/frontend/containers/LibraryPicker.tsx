import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import PreloadIcon from 'resources/icons/preload.svg';
import { SVG } from 'widgets/icons';
import { RendererMessenger } from 'src/ipc/renderer';
import { LibraryInfo } from 'src/ipc/messages';
import { GLOBAL_THEME_KEY } from 'src/frontend/stores/UiStore';

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

  const theme: 'light' | 'dark' = (() => {
    const stored = localStorage.getItem(GLOBAL_THEME_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  })();

  // Set native window theme to match
  useEffect(() => {
    RendererMessenger.setTheme({ theme });
  }, [theme]);

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

  const s = styles[theme];

  return (
    <div style={s.container} id="library-picker">
      <div style={s.panel}>
        <div style={s.header}>
          <SVG src={PreloadIcon} style={{ fill: s.iconFill, width: '42px', height: '36px' }} />
          <h1 style={s.title}>{t('libraries.pickerTitle')}</h1>
          <p style={s.subtitle}>{t('libraries.pickerSubtitle')}</p>
        </div>

        {libraries.length > 0 && (
          <div style={s.list}>
            {libraries.map((lib) => (
              <div key={lib.path} style={s.listItem}>
                <button
                  style={s.libraryButton}
                  onClick={() => openLibrary(lib.path)}
                  disabled={isBusy}
                  title={lib.path}
                >
                  <span style={s.libraryName}>
                    {lib.name}
                    {lib.isDefault ? ` (${t('libraries.defaultLibrary')})` : ''}
                  </span>
                  <span style={s.libraryPath}>{lib.path}</span>
                  <span style={s.libraryDate}>
                    {t('libraries.lastOpened', {
                      date: new Date(lib.lastOpened).toLocaleString(),
                    })}
                  </span>
                </button>
                <button
                  style={s.removeButton}
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

        {libraries.length === 0 && <p style={s.emptyText}>{t('libraries.noLibrariesYet')}</p>}

        <div style={s.actions}>
          <button style={s.actionButton} onClick={browseForLibrary} disabled={isBusy}>
            {t('libraries.openFolderAsLibrary')}
          </button>
        </div>
        <p style={s.hint}>{t('libraries.openFolderHint')}</p>
      </div>
    </div>
  );
};

type ThemeStyles = {
  container: React.CSSProperties;
  panel: React.CSSProperties;
  header: React.CSSProperties;
  iconFill: string;
  title: React.CSSProperties;
  subtitle: React.CSSProperties;
  list: React.CSSProperties;
  listItem: React.CSSProperties;
  libraryButton: React.CSSProperties;
  libraryName: React.CSSProperties;
  libraryPath: React.CSSProperties;
  libraryDate: React.CSSProperties;
  removeButton: React.CSSProperties;
  emptyText: React.CSSProperties;
  actions: React.CSSProperties;
  actionButton: React.CSSProperties;
  hint: React.CSSProperties;
};

const baseStyles: Omit<ThemeStyles, 'container' | 'iconFill' | 'subtitle'> = {
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
  libraryName: {
    fontSize: '15px',
    fontWeight: 600,
  },
  libraryPath: {
    fontSize: '12px',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    direction: 'rtl',
  },
  libraryDate: {
    fontSize: '11px',
  },
  libraryButton: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
    padding: '10px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    minWidth: 0,
  },
  removeButton: {
    width: '36px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    flexShrink: 0,
  },
  emptyText: {
    textAlign: 'center',
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
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  hint: {
    margin: 0,
    textAlign: 'center',
    fontSize: '12px',
  },
};

const styles: Record<'light' | 'dark', ThemeStyles> = {
  light: {
    ...baseStyles,
    container: {
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f7fa',
      color: '#1c1e23',
      fontFamily:
        '-apple-system, "BlinkMacSystemFont", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Open Sans", "Helvetica Neue", sans-serif',
      WebkitFontSmoothing: 'antialiased',
      overflow: 'auto',
    },
    iconFill: '#1c1e23',
    subtitle: { margin: 0, fontSize: '13px', color: '#5f6368' },
    libraryButton: {
      ...baseStyles.libraryButton,
      border: '1px solid #d0d4d9',
      backgroundColor: '#fff',
      color: '#1c1e23',
    },
    libraryPath: { ...baseStyles.libraryPath, color: '#5f6368' },
    libraryDate: { ...baseStyles.libraryDate, color: '#80868b' },
    removeButton: {
      ...baseStyles.removeButton,
      border: '1px solid #d0d4d9',
      color: '#5f6368',
    },
    emptyText: { ...baseStyles.emptyText, color: '#5f6368' },
    actionButton: { ...baseStyles.actionButton, backgroundColor: '#3b82f6' },
    hint: { ...baseStyles.hint, color: '#80868b' },
  },
  dark: {
    ...baseStyles,
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
    iconFill: '#fff',
    subtitle: { margin: 0, fontSize: '13px', color: '#9aa0a6' },
    libraryButton: {
      ...baseStyles.libraryButton,
      border: '1px solid #33363d',
      backgroundColor: '#25282e',
      color: '#f5f8fa',
    },
    libraryPath: { ...baseStyles.libraryPath, color: '#9aa0a6' },
    libraryDate: { ...baseStyles.libraryDate, color: '#6f757d' },
    removeButton: {
      ...baseStyles.removeButton,
      border: '1px solid #33363d',
      color: '#9aa0a6',
    },
    emptyText: { ...baseStyles.emptyText, color: '#9aa0a6' },
    actionButton: { ...baseStyles.actionButton, backgroundColor: '#3b82f6' },
    hint: { ...baseStyles.hint, color: '#6f757d' },
  },
};

export default LibraryPicker;
