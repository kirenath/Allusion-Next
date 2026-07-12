import { ClientFile } from '../../entities/File';
import { ThumbnailSize } from '../../stores/UiStore';

export type ContentRect = { width: number; height: number };

export interface GalleryProps {
  contentRect: ContentRect;
  /** The index of the currently selected image, or the "last selected" image when a range is selected */
  lastSelectionIndex: React.MutableRefObject<number | undefined>;
  select: (file: ClientFile | undefined, selectAdditive: boolean, selectRange: boolean) => void;
}

const PADDING = 8;
const CELL_SIZE_SMALL = 160 + PADDING;
const CELL_SIZE_MEDIUM = 240 + PADDING;
const CELL_SIZE_LARGE = 320 + PADDING;

export function getThumbnailSize(sizeType: ThumbnailSize) {
  if (typeof sizeType === 'number') {
    return sizeType;
  }
  if (sizeType === 'small') {
    return CELL_SIZE_SMALL;
  } else if (sizeType === 'medium') {
    return CELL_SIZE_MEDIUM;
  }
  return CELL_SIZE_LARGE;
}

// Height of the caption area (filename/resolution) below each thumbnail, in pixels.
// Note: keep in sync with the .thumbnail-caption styles in content.scss
const CAPTION_VERTICAL_PADDING = 6;
const CAPTION_FILENAME_HEIGHT = 20;
const CAPTION_RESOLUTION_HEIGHT = 14;

export function getThumbnailCaptionHeight(showFilename: boolean, showResolution: boolean): number {
  if (!showFilename && !showResolution) {
    return 0;
  }
  return (
    CAPTION_VERTICAL_PADDING +
    (showFilename ? CAPTION_FILENAME_HEIGHT : 0) +
    (showResolution ? CAPTION_RESOLUTION_HEIGHT : 0)
  );
}
