import fse from 'fs-extra';
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatDateTime, humanFileSize } from 'common/fmt';
import { IconSet } from 'widgets/icons';
import { Toolbar, ToolbarButton } from 'widgets/toolbar';
import { RendererMessenger } from '../../ipc/renderer';
import { useStore } from '../contexts/StoreContext';
import { ClientFile } from '../entities/File';
import { usePromise } from '../hooks/usePromise';
import ExternalLink from './ExternalLink';
import { AppToaster } from './Toaster';

type CommonMetadata = {
  name: string;
  dimensions: string;
  size: string;
  imported: string;
  created: string;
  modified: string;
};

const commonMetadataLabelKeys: Record<keyof CommonMetadata, string> = {
  name: 'components.filename',
  dimensions: 'components.dimensions',
  size: 'components.size',
  imported: 'components.imported',
  // TODO: modified in allusion vs modified in system?
  created: 'components.created',
  modified: 'components.modified',
};

type ExifField = { label: string; modifiable?: boolean; format?: (val: string) => ReactNode };

// Details: https://www.vcode.no/web/resource.nsf/ii2lnug/642.htm
const exifFields: Record<string, ExifField> = {
  PhotometricInterpretation: { label: 'components.colorMode' },
  BitsPerSample: { label: 'components.bitDepth' },
  Software: { label: 'components.creationSoftware', modifiable: true },
  Artist: { label: 'components.creator', modifiable: true },
  CreatorWorkURL: {
    label: 'components.creatorURL',
    modifiable: true,
    format: function CreatorURL(url?: string) {
      if (!url) {
        return ' ';
      }
      return <ExternalLink url={url}>{url}</ExternalLink>;
    },
  },
  ImageDescription: { label: 'components.description', modifiable: true },
  Parameters: { label: 'components.parameters' },
  Copyright: { label: 'components.copyright', modifiable: true },
  Make: { label: 'components.cameraManufacturer' },
  Model: { label: 'components.cameraModel' },
  Megapixels: { label: 'components.megapixels' },
  ExposureTime: { label: 'components.exposureTime' },
  FNumber: { label: 'components.fStop' },
  FocalLength: { label: 'components.focalLength' },
  GPSLatitude: { label: 'components.gpsLatitude' },
  GPSLongitude: { label: 'components.gpsLongitude' },
};

const exifTags = Object.keys(exifFields);

const stopPropagation = (e: React.KeyboardEvent<HTMLInputElement>) => e.stopPropagation();

interface ImageInfoProps {
  file: ClientFile;
}

const ImageInfo = ({ file }: ImageInfoProps) => {
  const { exifTool } = useStore();
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);

  const modified = usePromise(file.absolutePath, async (filePath) => {
    const stats = await fse.stat(filePath);
    return formatDateTime(stats.ctime);
  });

  const fileStats: CommonMetadata = {
    name: file.name,
    dimensions: `${file.width || '?'} x ${file.height || '?'}`,
    size: humanFileSize(file.size),
    imported: formatDateTime(file.dateAdded),
    created: formatDateTime(file.dateCreated),
    modified: modified.tag === 'ready' && 'ok' in modified.value ? modified.value.ok : '...',
  };

  const [exifStats, setExifStats] = useState<Record<string, string>>({});
  useEffect(() => {
    // When the file changes, update the exif stats
    setIsEditing(false);
    // Reset previous fields to empty string, so the re-render doesn't flicker as when setting it to {}
    setExifStats(
      Object.entries(exifStats).reduce(
        (acc, [key, val]) => ({ ...acc, [key]: val ? ' ' : '' }),
        {},
      ),
    );

    exifTool.readExifTags(file.absolutePath, exifTags).then((tagValues) => {
      const stats: Record<string, string> = {};
      tagValues.forEach((val, i) => {
        const key = exifTags[i];
        stats[key] = val || '';
      });
      setExifStats(stats);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.absolutePath]);

  const handleEditSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const form = e.currentTarget as HTMLFormElement;

      const data: Record<string, string> = {};
      const newExifStats = { ...exifStats };
      for (const [key, field] of Object.entries(exifFields)) {
        if (field.modifiable) {
          const value = (form.elements.namedItem(key) as HTMLInputElement).value;
          if (value) {
            // Set value to store in exif data
            data[key] = value;

            // Update data for in view, lil bit hacky
            newExifStats[key] = value;
          }
        }
      }

      setIsEditing(false);
      setExifStats(newExifStats);

      // TODO: also update filename here?

      // TODO: this doesn't update the modified time of the file. Maybe it should? See ExifIO internals
      exifTool
        .writeData(file.absolutePath, data)
        .then(() => AppToaster.show({ message: t('components.imageFileSaved'), timeout: 3000 }))
        .catch((err) => {
          AppToaster.show({
            message: t('components.couldNotSaveImageFile'),
            clickAction: { label: t('settings.view'), onClick: RendererMessenger.toggleDevTools },
            timeout: 6000,
          });
          console.error('Could not update file', err);
        });
    },
    [exifStats, exifTool, file.absolutePath],
  );

  // Todo: Would be nice to also add tooltips explaining what these mean (e.g. diff between dimensions & resolution)
  // Or add the units: pixels vs DPI
  return (
    <form onSubmit={handleEditSubmit} onReset={() => setIsEditing(false)}>
      <header>
        <h2>{t('components.information')}</h2>
        <Toolbar controls="file-info" isCompact>
          {isEditing ? (
            <>
              <ToolbarButton
                key="cancel"
                icon={IconSet.CLOSE}
                text={t('common.cancel')}
                tooltip={t('components.cancelChanges')}
                type="reset"
              />
              <ToolbarButton
                key="submit"
                icon={IconSet.SELECT_CHECKED}
                text={t('common.save')}
                tooltip={t('components.saveChanges')}
                type="submit"
              />
            </>
          ) : (
            <ToolbarButton
              key="edit"
              icon={IconSet.EDIT}
              text={t('common.edit')}
              onClick={() => setIsEditing(true)}
              tooltip={t('components.editExifData')}
              type="button"
            />
          )}
        </Toolbar>
      </header>
      <table id="file-info">
        <tbody>
          {Object.entries(commonMetadataLabelKeys).map(([field, labelKey]) => (
            <tr key={field}>
              <th scope="row">{t(labelKey)}</th>
              <td>{fileStats[field as keyof CommonMetadata]}</td>
            </tr>
          ))}
          {Object.entries(exifFields).map(([key, field]) => {
            const value = exifStats[key];
            const isEditingMode = isEditing && field.modifiable;
            if (!value && !isEditingMode) {
              return null;
            }
            return (
              <tr key={key}>
                <th scope="row">{t(field.label)}</th>

                <td>
                  {!isEditingMode ? (
                    field.format?.(value || '') || value
                  ) : (
                    <input
                      className="input"
                      defaultValue={value || ''}
                      name={key}
                      onKeyDown={stopPropagation}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </form>
  );
};

export default React.memo(ImageInfo);
