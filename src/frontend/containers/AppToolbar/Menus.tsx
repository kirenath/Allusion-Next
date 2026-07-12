import React from 'react';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { OrderBy, OrderDirection } from 'src/api/data-storage-search';
import { FileDTO } from 'src/api/file';
import { IconSet, KeyCombo } from 'widgets';
import { MenuButton, MenuRadioGroup, MenuRadioItem, MenuSubItem } from 'widgets/menus';
import { getThumbnailSize } from '../ContentView/utils';
import { MenuCheckboxItem, MenuDivider, MenuSliderItem } from 'widgets/menus/menu-items';
import { useStore } from 'src/frontend/contexts/StoreContext';
import { ExtraPropertySelector } from 'src/frontend/components/ExtraPropertySelector';
import { ClientExtraProperty } from 'src/frontend/entities/ExtraProperty';
import { useComputed } from 'src/frontend/hooks/mobx';

export const SortCommand = observer(() => {
  const { fileStore } = useStore();
  const { t } = useTranslation();

  const sortItem =
    fileStore.orderBy === sortExtraPropertyData.prop
      ? sortExtraPropertyData
      : sortMenuData.find((item) => item.prop === fileStore.orderBy);
  const directionArrow = fileStore.orderDirection === OrderDirection.Desc ? ' \u2193' : ' \u2191';
  const text = sortItem
    ? `${t(sortItem.textKey)}${sortItem.hideDirection ? '' : directionArrow}`
    : t('toolbar.sort');

  return (
    <MenuButton
      icon={IconSet.SORT}
      text={text}
      tooltip={t('toolbar.sortTooltip')}
      id="__sort-menu"
      menuID="__sort-options"
    >
      <SortMenuItems />
    </MenuButton>
  );
});

export const ViewCommand = () => {
  const { t } = useTranslation();
  return (
    <MenuButton
      icon={IconSet.THUMB_BG}
      text={t('toolbar.view')}
      tooltip={t('toolbar.viewTooltip')}
      id="__layout-menu"
      menuID="__layout-options"
    >
      <LayoutMenuItems />

      <MenuDivider />

      <ThumbnailSizeSliderMenuItem />
      <br />
      <ThumbnailRadiusSliderMenuItem />
      <br />
      <ThumbnailPaddingSizeSliderMenuItem />
    </MenuButton>
  );
};

/** Segmented control for switching between the view methods directly from the toolbar */
export const ViewSegmentedControl = observer(() => {
  const { uiStore } = useStore();
  const { t } = useTranslation();

  const options = [
    { icon: IconSet.VIEW_LIST, onClick: uiStore.setMethodList, checked: uiStore.isList, text: t('toolbar.viewList') }, // eslint-disable-line prettier/prettier
    { icon: IconSet.VIEW_GRID, onClick: uiStore.setMethodGrid, checked: uiStore.isGrid, text: t('toolbar.viewGrid') }, // eslint-disable-line prettier/prettier
    { icon: IconSet.VIEW_MASONRY_V, onClick: uiStore.setMethodMasonryVertical, checked: uiStore.isMasonryVertical, text: t('toolbar.viewMasonryVertical') }, // eslint-disable-line prettier/prettier
    { icon: IconSet.VIEW_MASONRY_H, onClick: uiStore.setMethodMasonryHorizontal, checked: uiStore.isMasonryHorizontal, text: t('toolbar.viewMasonryHorizontal') }, // eslint-disable-line prettier/prettier
  ];

  return (
    <div className="segmented-control" role="radiogroup" aria-label={t('toolbar.view')}>
      {options.map((option) => (
        <button
          key={option.text}
          role="radio"
          aria-checked={option.checked}
          data-tooltip={option.text}
          onClick={option.onClick}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
});

/** Inline thumbnail size slider, as seen in the toolbar of the reference design */
export const ThumbnailSizeToolbarSlider = observer(() => {
  const { uiStore } = useStore();
  const { t } = useTranslation();

  return (
    <div className="toolbar-slider" data-tooltip={t('toolbar.thumbnailSize')}>
      <input
        type="range"
        min={thumbnailSizeOptions[0].value}
        max={thumbnailSizeOptions[thumbnailSizeOptions.length - 1].value}
        step={20}
        value={getThumbnailSize(uiStore.thumbnailSize)}
        aria-label={t('toolbar.thumbnailSize')}
        onChange={(e) => uiStore.setThumbnailSize(Number(e.target.value))}
      />
    </div>
  );
});

const sortMenuData: Array<{
  prop: OrderBy<FileDTO>;
  icon: JSX.Element;
  textKey: string;
  hideDirection?: boolean;
}> = [
  { prop: 'name', icon: IconSet.FILTER_NAME_UP, textKey: 'toolbar.sortName' },
  { prop: 'absolutePath', icon: IconSet.FOLDER_OPEN, textKey: 'toolbar.sortPath' },
  { prop: 'extension', icon: IconSet.FILTER_FILE_TYPE, textKey: 'toolbar.sortFileType' },
  { prop: 'size', icon: IconSet.FILTER_FILTER_DOWN, textKey: 'toolbar.sortFileSize' },
  { prop: 'dateAdded', icon: IconSet.FILTER_DATE, textKey: 'toolbar.sortDateAdded' },
  { prop: 'dateModified', icon: IconSet.FILTER_DATE, textKey: 'toolbar.sortDateModifiedInApp' },
  { prop: 'dateModifiedOS', icon: IconSet.FILTER_DATE, textKey: 'toolbar.sortDateModified' },
  { prop: 'dateCreated', icon: IconSet.FILTER_DATE, textKey: 'toolbar.sortDateCreated' },
  {
    prop: 'random',
    icon: IconSet.RELOAD_COMPACT,
    textKey: 'toolbar.sortRandom',
    hideDirection: true,
  },
];

const sortExtraPropertyData: {
  prop: OrderBy<FileDTO>;
  icon: JSX.Element;
  textKey: string;
  hideDirection?: boolean;
} = { prop: 'extraProperty', icon: IconSet.META_INFO, textKey: 'toolbar.sortExtraProperty' };

export const SortMenuItems = observer(() => {
  const { fileStore, extraPropertyStore } = useStore();
  const { t } = useTranslation();
  const {
    orderDirection: fileOrder,
    orderBy,
    orderByExtraProperty,
    orderFilesBy,
    orderFilesByExtraProperty,
    switchOrderDirection,
  } = fileStore;
  const orderIcon = fileOrder === OrderDirection.Desc ? IconSet.ARROW_DOWN : IconSet.ARROW_UP;

  const counter = useComputed(() => {
    const extraProperty = extraPropertyStore.get(fileStore.orderByExtraProperty);
    const counter = new Map<ClientExtraProperty, [number, number | undefined]>();
    if (extraProperty) {
      counter.set(extraProperty, [1, 0]);
    }
    return counter;
  });

  return (
    <>
      <MenuCheckboxItem
        text={t('toolbar.sortUseNaturalOrdering')}
        checked={fileStore.isNaturalOrderingEnabled}
        onClick={fileStore.toggleNaturalOrdering}
      />
      <MenuRadioGroup>
        {[
          ...sortMenuData.map(({ prop, icon, textKey, hideDirection }) => (
            <MenuRadioItem
              key={prop}
              icon={icon}
              text={t(textKey)}
              checked={orderBy === prop}
              accelerator={orderBy === prop && !hideDirection ? orderIcon : undefined}
              onClick={() => (orderBy === prop ? switchOrderDirection() : orderFilesBy(prop))}
            />
          )),
          <MenuSubItem
            key={sortExtraPropertyData.prop}
            icon={sortExtraPropertyData.icon}
            text={t(sortExtraPropertyData.textKey)}
            checked={orderBy === sortExtraPropertyData.prop}
            accelerator={
              orderBy === sortExtraPropertyData.prop && !sortExtraPropertyData.hideDirection ? (
                orderIcon
              ) : (
                <></>
              )
            }
          >
            <ExtraPropertySelector
              counter={counter}
              onSelect={(extraProperty: ClientExtraProperty) =>
                orderByExtraProperty === extraProperty.id
                  ? switchOrderDirection()
                  : orderFilesByExtraProperty(extraProperty)
              }
            />
          </MenuSubItem>,
        ]}
      </MenuRadioGroup>
    </>
  );
});

const thumbnailSizeOptions = [
  { value: 128 },
  { value: 208, label: 'Small' },
  { value: 288 },
  { value: 368, label: 'Medium' },
  { value: 448 },
  { value: 528, label: 'Large' },
  { value: 608 },
];

const thumbnailRadiusOptions = [
  { value: 0, label: '0%' },
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
  { value: 6 },
  { value: 7 },
  { value: 8 },
  { value: 9 },
  { value: 10, label: '10%' },
  { value: 11 },
  { value: 12 },
  { value: 13 },
  { value: 14 },
  { value: 15 },
  { value: 16 },
  { value: 17 },
  { value: 18 },
  { value: 19 },
  { value: 20, label: '20%' },
  { value: 21 },
  { value: 22 },
  { value: 23 },
  { value: 24 },
  { value: 25 },
  { value: 26 },
  { value: 27 },
  { value: 28 },
  { value: 29 },
  { value: 30, label: '30%' },
  { value: 31 },
  { value: 32 },
  { value: 33 },
  { value: 34 },
  { value: 35 },
  { value: 36 },
  { value: 37 },
  { value: 38 },
  { value: 39 },
  { value: 40, label: '40%' },
  { value: 41 },
  { value: 42 },
  { value: 43 },
  { value: 44 },
  { value: 45 },
  { value: 46 },
  { value: 47 },
  { value: 48 },
  { value: 49 },
  { value: 50, label: '50%' },
];

const thumbnailPaddingSizeOptions = [
  { value: 0, label: '0' },
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
  { value: 6 },
  { value: 7 },
  { value: 8 },
  { value: 9 },
  { value: 10, label: '10' },
  { value: 11 },
  { value: 12 },
  { value: 13 },
  { value: 14 },
  { value: 15 },
  { value: 16 },
  { value: 17 },
  { value: 18 },
  { value: 19 },
  { value: 20, label: '20' },
  { value: 21 },
  { value: 22 },
  { value: 23 },
  { value: 24 },
  { value: 25 },
  { value: 26 },
  { value: 27 },
  { value: 28 },
  { value: 29 },
  { value: 30, label: '30' },
];

export const LayoutMenuItems = observer(() => {
  const { uiStore } = useStore();
  const { t } = useTranslation();
  return (
    <MenuRadioGroup>
      <MenuRadioItem
        icon={IconSet.VIEW_LIST}
        onClick={uiStore.setMethodList}
        checked={uiStore.isList}
        text={t('toolbar.viewList')}
        accelerator={<KeyCombo combo={uiStore.hotkeyMap.viewList} />}
      />
      <MenuRadioItem
        icon={IconSet.VIEW_GRID}
        onClick={uiStore.setMethodGrid}
        checked={uiStore.isGrid}
        text={t('toolbar.viewGrid')}
        accelerator={<KeyCombo combo={uiStore.hotkeyMap.viewGrid} />}
      />
      <MenuRadioItem
        icon={IconSet.VIEW_MASONRY_V}
        onClick={uiStore.setMethodMasonryVertical}
        checked={uiStore.isMasonryVertical}
        text={t('toolbar.viewMasonryVertical')}
        accelerator={<KeyCombo combo={uiStore.hotkeyMap.viewMasonryVertical} />}
      />
      <MenuRadioItem
        icon={IconSet.VIEW_MASONRY_H}
        onClick={uiStore.setMethodMasonryHorizontal}
        checked={uiStore.isMasonryHorizontal}
        text={t('toolbar.viewMasonryHorizontal')}
        accelerator={<KeyCombo combo={uiStore.hotkeyMap.viewMasonryHorizontal} />}
      />
    </MenuRadioGroup>
  );
});

export const ThumbnailSizeSliderMenuItem = observer(() => {
  const { uiStore } = useStore();
  const { t } = useTranslation();
  return (
    <MenuSliderItem
      value={getThumbnailSize(uiStore.thumbnailSize)}
      label={t('toolbar.thumbnailSize')}
      onChange={uiStore.setThumbnailSize}
      id="thumbnail-sizes"
      options={thumbnailSizeOptions}
      min={thumbnailSizeOptions[0].value}
      max={thumbnailSizeOptions[thumbnailSizeOptions.length - 1].value}
      step={20}
    />
  );
});

export const ThumbnailRadiusSliderMenuItem = observer(() => {
  const { uiStore } = useStore();
  const { t } = useTranslation();
  return (
    <MenuSliderItem
      value={uiStore.thumbnailRadius}
      label={t('toolbar.thumbnailRadius')}
      onChange={uiStore.setThumbnailRadius}
      id="thumbnail-padding-sizes"
      options={thumbnailRadiusOptions}
      min={thumbnailRadiusOptions[0].value}
      max={thumbnailRadiusOptions[thumbnailRadiusOptions.length - 1].value}
      step={1}
    />
  );
});

export const ThumbnailPaddingSizeSliderMenuItem = observer(() => {
  const { uiStore } = useStore();
  const { t } = useTranslation();
  return (
    <MenuSliderItem
      value={uiStore.masonryItemPadding}
      label={t('toolbar.thumbnailPaddingSize')}
      onChange={uiStore.setMasonryItemPadding}
      id="thumbnail-padding-sizes"
      options={thumbnailPaddingSizeOptions}
      min={thumbnailPaddingSizeOptions[0].value}
      max={thumbnailPaddingSizeOptions[thumbnailPaddingSizeOptions.length - 1].value}
      step={1}
    />
  );
});
