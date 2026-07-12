import { WINDOW_STORAGE_KEY } from 'common/window';
import { shell } from 'electron';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useCustomTheme from 'src/frontend/hooks/useCustomTheme';
import { RendererMessenger } from 'src/ipc/renderer';
import { Button, IconSet, Radio, RadioGroup, Toggle } from 'widgets';
import { useStore } from '../../contexts/StoreContext';
import { InheritedTagsVisibilityModeType } from 'src/frontend/stores/UiStore';
import { Slider } from 'widgets/slider';
import { SUPPORTED_LANGUAGES } from 'src/frontend/i18n';

const fullResThresholdOptions = [
  { value: 0, label: 'Disabled' },
  { value: 640 },
  { value: 1280, label: '720p' },
  { value: 1920, label: '1080p' },
  { value: 2560, label: '2K' },
  { value: 3200 },
  { value: 3840, label: '4K' },
  { value: 4480 },
  { value: 5120 },
  { value: 5760 },
  { value: 6400 },
  { value: 7040 },
  { value: 7680, label: '8K' },
  { value: 8320 },
];

export const Appearance = observer(() => {
  const { uiStore } = useStore();
  const { t } = useTranslation();

  const toggleFullScreen = (value: boolean) => {
    localStorage.setItem(WINDOW_STORAGE_KEY, JSON.stringify({ isFullScreen: value }));
    RendererMessenger.setFullScreen(value);
  };

  return (
    <>
      <h3>{t('settings.language', 'Language')}</h3>

      <div className="vstack">
        <label>
          {t('settings.languageDescription', 'Choose the display language for the interface')}
          <select
            value={uiStore.language}
            onChange={(e) => uiStore.setLanguage(e.target.value as typeof uiStore.language)}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h3>{t('settings.theme')}</h3>

      <div className="vstack">
        <RadioGroup
          orientation="horizontal"
          name={t('settings.colorScheme')}
          value={uiStore.theme}
          onChange={uiStore.setTheme}
        >
          <Radio value="light">{t('settings.light')}</Radio>
          <Radio value="dark">{t('settings.dark')}</Radio>
        </RadioGroup>
        <CustomThemePicker />
        <RadioGroup
          orientation="horizontal"
          name={t('settings.scrollbarStyle')}
          value={uiStore.scrollbarsStyle}
          onChange={uiStore.setScrollbarsStyle}
        >
          <Radio value="classic">{t('settings.classic')}</Radio>
          <Radio value="hover">{t('settings.hover')}</Radio>
        </RadioGroup>
        <Toggle
          checked={uiStore.showTreeConnectorLines}
          onChange={uiStore.toggleShowTreeConnectorLines}
        >
          {t('settings.showHierarchyConnectorLines')}
        </Toggle>
      </div>

      <h3>{t('settings.display')}</h3>

      <div className="vstack">
        <Toggle checked={uiStore.isFullScreen} onChange={toggleFullScreen}>
          {t('settings.showFullScreen')}
        </Toggle>
        <Zoom />
        <RadioGroup
          orientation="horizontal"
          name={t('settings.scaleImages')}
          value={uiStore.upscaleMode}
          onChange={uiStore.setUpscaleMode}
        >
          <Radio value="smooth">{t('settings.smooth')}</Radio>
          <Radio value="pixelated">{t('settings.pixelated')}</Radio>
        </RadioGroup>
      </div>

      <h3>{t('settings.toolbarButtons')}</h3>

      <div className="vstack">
        <Toggle
          checked={uiStore.toolbarButtonsVisibility['fileTags']}
          onChange={() => {
            uiStore.toggleToolbarButtonVisibility('fileTags');
          }}
        >
          {t('settings.showFileTagsEditorButton')}
        </Toggle>
        <Toggle
          checked={uiStore.toolbarButtonsVisibility['extraProperties']}
          onChange={() => {
            uiStore.toggleToolbarButtonVisibility('extraProperties');
          }}
        >
          {t('settings.showFileExtraPropertiesEditorButton')}
        </Toggle>
        <Toggle
          checked={uiStore.toolbarButtonsVisibility['info']}
          onChange={() => {
            uiStore.toggleToolbarButtonVisibility('info');
          }}
        >
          {t('settings.showFileInfoViewerButton')}
        </Toggle>
        <Toggle
          checked={uiStore.toolbarButtonsVisibility['overviewInspector']}
          onChange={() => {
            uiStore.toggleToolbarButtonVisibility('overviewInspector');
          }}
        >
          {t('settings.showInspectorButtonOverview')}
        </Toggle>
        <Toggle
          checked={uiStore.toolbarButtonsVisibility['slideInspector']}
          onChange={() => {
            uiStore.toggleToolbarButtonVisibility('slideInspector');
          }}
        >
          {t('settings.showInspectorButtonSlide')}
        </Toggle>
      </div>

      <h3>{t('settings.thumbnail')}</h3>

      <div className="vstack">
        <Toggle
          checked={uiStore.isThumbnailFilenameOverlayEnabled}
          onChange={uiStore.toggleThumbnailFilenameOverlay}
        >
          {t('settings.showFilename')}
        </Toggle>
        <Toggle
          checked={uiStore.isThumbnailResolutionOverlayEnabled}
          onChange={uiStore.toggleThumbnailResolutionOverlay}
        >
          {t('settings.showResolution')}
        </Toggle>
        <RadioGroup
          orientation="horizontal"
          name={t('settings.showTags')}
          value={uiStore.thumbnailTagOverlayMode}
          onChange={uiStore.setThumbnailTagOverlayMode}
        >
          <Radio value="all">{t('settings.all')}</Radio>
          <Radio value="selected">{t('settings.selected')}</Radio>
          <Radio value="disabled">{t('settings.disabled')}</Radio>
        </RadioGroup>
        <RadioGroup
          orientation="horizontal"
          name={t('settings.shape')}
          value={uiStore.thumbnailShape}
          onChange={uiStore.setThumbnailShape}
        >
          <Radio value="square">{t('settings.square')}</Radio>
          <Radio value="letterbox">{t('settings.letterbox')}</Radio>
        </RadioGroup>
        <Slider
          value={uiStore.largeThumbFullResThreshold}
          label={t('settings.maxResThreshold')}
          onChange={uiStore.setLargeThumbFullResThreshold}
          id="full-res-threshold"
          options={fullResThresholdOptions}
          min={fullResThresholdOptions[0].value}
          max={fullResThresholdOptions[fullResThresholdOptions.length - 1].value}
          step={20}
        />
      </div>

      <h3>{t('settings.fileTags')}</h3>

      <div className="vstack">
        <RadioGroup
          orientation="vertical"
          name={t('settings.inheritedTagsVisibility')}
          value={uiStore.inheritedTagsVisibilityMode}
          onChange={uiStore.setInheritedTagsVisibilityMode}
        >
          <Radio value={'all' as InheritedTagsVisibilityModeType}>{t('settings.showAll')}</Radio>
          <Radio
            value={'visible-when-inherited' as InheritedTagsVisibilityModeType}
            tooltip={t('settings.configureTagVisibilityTooltip')}
          >
            {t('settings.showVisibleWhenInheritedTags')}
          </Radio>
          <Radio value={'disabled' as InheritedTagsVisibilityModeType}>
            {t('settings.doNotShowInheritedTags')}
          </Radio>
        </RadioGroup>
      </div>

      <h3>{t('settings.galleryVideoPlayback')}</h3>

      <div className="vstack">
        <RadioGroup
          orientation="horizontal"
          name={t('settings.playbackMode')}
          value={uiStore.galleryVideoPlaybackMode}
          onChange={uiStore.setGalleryVideoPlaybackMode}
        >
          <Radio value="auto">{t('settings.auto')}</Radio>
          <Radio value="hover">{t('settings.hover')}</Radio>
          <Radio value="disabled">{t('settings.disabled')}</Radio>
        </RadioGroup>
      </div>
    </>
  );
});

const Zoom = () => {
  const { t } = useTranslation();
  const [localZoomFactor, setLocalZoomFactor] = useState(RendererMessenger.getZoomFactor);
  const { uiStore } = useStore();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(event.target.value);
    setLocalZoomFactor(value);
    uiStore.setZoomFactor(value);
  };

  return (
    <label>
      {t('settings.zoom')}
      <select value={localZoomFactor} onChange={handleChange}>
        <option value={0.5}>50%</option>
        <option value={0.6}>60%</option>
        <option value={0.7}>70%</option>
        <option value={0.8}>80%</option>
        <option value={0.9}>90%</option>
        <option value={1.0}>100%</option>
        <option value={1.1}>110%</option>
        <option value={1.2}>120%</option>
        <option value={1.3}>130%</option>
        <option value={1.4}>140%</option>
        <option value={1.5}>150%</option>
        <option value={1.6}>160%</option>
        <option value={1.7}>170%</option>
        <option value={1.8}>180%</option>
        <option value={1.9}>190%</option>
        <option value={2.0}>200%</option>
      </select>
    </label>
  );
};

const CustomThemePicker = () => {
  const { t } = useTranslation();
  const { theme, setTheme, refresh, options, themeDir } = useCustomTheme();

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="hstack">
      <label>
        {t('settings.customTheme')}
        <select onChange={(e) => setTheme(e.target.value)} defaultValue={theme}>
          {<option value="">{t('outliner.none')}</option>}
          {options.map((file) => (
            <option key={file} value={file}>
              {file.replace('.css', '')}
            </option>
          ))}
        </select>
      </label>
      <Button
        icon={IconSet.FOLDER_CLOSE}
        text={t('settings.add')}
        onClick={() => shell.openExternal(themeDir)}
        tooltip={t('settings.openThemeDir')}
      />
      <Button
        icon={IconSet.RELOAD}
        text={t('outliner.refresh')}
        onClick={refresh}
        tooltip={t('settings.reloadThemes')}
      />
    </div>
  );
};
