import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'src/frontend/contexts/StoreContext';
import { Row } from 'widgets/combobox';
import { IconSet } from 'widgets/icons';
import { ClientTag } from 'src/frontend/entities/Tag';
import { runInAction } from 'mobx';

export const CREATE_OPTION = Symbol('tag_create_option');

interface CreateOptionProps {
  inputText: string;
  hasMatches: boolean;
  resetTextBox: () => void;
  style?: React.CSSProperties | undefined;
  index?: number;
}

export const CreateOption = ({
  inputText,
  hasMatches,
  resetTextBox,
  style,
  index,
}: CreateOptionProps) => {
  const { tagStore, uiStore } = useStore();
  const { t } = useTranslation();

  const createTag = useCallback(async () => {
    const newTag = await tagStore.create(tagStore.root, inputText);
    await uiStore.addTagsToSelectedFiles([newTag]);
    resetTextBox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, resetTextBox]);

  return (
    <>
      {inputText.length > 0 ? (
        <>
          <Row
            id="tag-editor-create-option"
            index={index}
            style={style}
            selected={false}
            value={t('components.createTag', { name: inputText })}
            onClick={createTag}
            icon={IconSet.TAG_ADD}
          />
        </>
      ) : (
        !hasMatches && (
          <Row style={style} key="empty-message" value={`${t('components.typeToSelectTags')}\u00A0\u00A0`} />
        )
      )}
    </>
  );
};

export const BULK_APPLY_OPTION = Symbol('tag_bulk_apply_option'); // 'Detected Tags (Click this to apply all selected)'

interface BulkApplyOptionProps {
  inputText: string;
  tagNames: string[];
  resetTextBox: (force?: boolean) => void;
  style?: React.CSSProperties | undefined;
  index?: number;
}

export const BulkApplyOption = ({
  inputText,
  tagNames,
  resetTextBox,
  style,
  index,
}: BulkApplyOptionProps) => {
  const { tagStore, uiStore } = useStore();
  const { t } = useTranslation();

  const applytags = useCallback(async () => {
    const root = runInAction(() => tagStore.root);
    const tagMatches = new Set<ClientTag>();
    for (const tagName of tagNames) {
      let match = tagStore.findByNameOrAlias(tagName);
      if (match === undefined) {
        match = await tagStore.create(root, tagName);
      }
      // First collect all matches in an set instead of directly adding them to
      // the file, to avoid unnecessary backend saves while awaiting the creation of tags.
      tagMatches.add(match);
    }
    await uiStore.addTagsToSelectedFiles(Array.from(tagMatches));
    resetTextBox(true);
  }, [resetTextBox, tagNames, tagStore, uiStore]);

  return (
    <>
      {inputText.length > 0 ? (
        <>
          <Row
            id="tag-editor-bulk-apply-option"
            index={index}
            style={style}
            selected={false}
            value={t('components.applyAllCheckedTags')}
            onClick={applytags}
            icon={IconSet.ADD_TAG_FILL}
          />
        </>
      ) : (
        tagNames.length <= 0 && (
          <Row style={style} key="empty-message" value={`${t('components.noTagNamesDetected')}\u00A0\u00A0`} />
        )
      )}
    </>
  );
};
