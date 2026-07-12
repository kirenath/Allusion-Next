import { observer } from 'mobx-react-lite';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from 'widgets/button';
import { IconSet } from 'widgets/icons';
import { Dialog } from 'widgets/popovers';
import { useStore } from '../../contexts/StoreContext';
import { ClientFileSearchItem } from '../../entities/SearchItem';
import { useAutorun } from '../../hooks/mobx';
import CriteriaBuilder from './CriteriaBuilder';
import { QueryEditor } from './QueryEditor';
import { queryFromCriteria, intoGroup, Query, getemptyQuery } from './data';

interface ISearchItemDialogProps {
  searchItem: ClientFileSearchItem;
  onClose: () => void;
}

/** Similar to the AdvancedSearchDialog */
const SearchItemDialog = observer<ISearchItemDialogProps>(({ searchItem, onClose }) => {
  const rootStore = useStore();
  const { tagStore, searchStore } = rootStore;
  const { t } = useTranslation();

  const searchName =
    searchItem.name === 'New search' || searchItem.name === '新搜索'
      ? t('advancedSearch.newSearch')
      : searchItem.name;

  // Copy state of search item: only update the ClientSearchItem on submit.
  const [name, setName] = useState(searchName);

  const [query, setQuery] = useState<Query>(getemptyQuery());
  const keySelector = useRef<HTMLSelectElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  // Initialize form with current queries. When the form is closed, all inputs
  // are unmounted to save memory.
  useAutorun(() => {
    const map = queryFromCriteria(searchItem.rootGroup);
    // Focus and select the input text so the user can rename immediately after creating a new search item
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        nameInput.current?.focus();
        nameInput.current?.select();
      }),
    );
    setQuery(map);
  });

  const handleSubmit = useCallback(async () => {
    searchItem.setRootGroup(intoGroup(query, tagStore));
    searchItem.setName(name);
    searchStore.save(searchItem);
    onClose();
  }, [name, onClose, query, searchItem, searchStore, tagStore]);

  return (
    <Dialog
      open
      title={`Search: "${searchName}"`}
      icon={IconSet.SEARCH_EXTENDED}
      onCancel={onClose}
    >
      <form
        id="search-form"
        role="search"
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <label id="name">{t('advancedSearch.name')}</label>
        <input
          className="input"
          defaultValue={searchName}
          onBlur={(e) => setName(e.target.value)}
          aria-labelledby="name"
          autoFocus
          ref={nameInput}
        />

        <br />

        <CriteriaBuilder keySelector={keySelector} dispatch={setQuery} />

        <QueryEditor query={query} setQuery={setQuery} submissionButtonText="Save" />

        <fieldset className="dialog-actions">
          <Button styling="outlined" text={t('common.close')} icon={IconSet.CLOSE} onClick={onClose} />
          <Button
            styling="filled"
            text={t('common.save')}
            icon={IconSet.SELECT_CHECKED}
            onClick={handleSubmit}
            disabled={query.children.size === 0}
          />
        </fieldset>
      </form>
    </Dialog>
  );
});

export default SearchItemDialog;
