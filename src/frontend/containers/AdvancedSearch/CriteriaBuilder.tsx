import React, { RefObject, memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { IconButton } from 'widgets/button';
import { IconSet } from 'widgets/icons';
import { InfoButton } from 'widgets/notifications';
import { IndexInput, KeySelector, OperatorSelector, ValueInput } from './Inputs';
import { appendCriteriaByIndexPath, CritIndexPath, defaultQuery, QueryDispatch } from './data';
import { useStore } from 'src/frontend/contexts/StoreContext';

export interface QueryBuilderProps {
  keySelector: RefObject<HTMLSelectElement>;
  dispatch: QueryDispatch;
}

const CriteriaBuilder = memo(function QueryBuilder({ keySelector, dispatch }: QueryBuilderProps) {
  const [path, setPath] = useState<CritIndexPath>([]);
  const [criteria, setCriteria] = useState(defaultQuery('tags'));
  const { extraPropertyStore } = useStore();
  const { t } = useTranslation();
  const epID = 'extraProperty' in criteria ? criteria.extraProperty : undefined;
  const extraProperty = useMemo(
    () => (epID !== undefined ? extraPropertyStore.get(epID) : undefined),
    [epID, extraPropertyStore],
  );

  const add = () => {
    dispatch((query) => appendCriteriaByIndexPath(query, criteria, path));
    setCriteria(defaultQuery('tags'));
    keySelector.current?.focus();
  };

  return (
    <fieldset aria-labelledby="criteria-builder-label">
      <legend id="criteria-builder-label">
        {t('advancedSearch.criteriaBuilder')}
        <InfoButton>
          {t('advancedSearch.criteriaBuilderInfo')}
        </InfoButton>
      </legend>
      <div id="criteria-builder">
        <label id="builder-space">{t('advancedSearch.nesting')}</label>
        <label id="builder-key">{t('advancedSearch.key')}</label>
        <label id="builder-operator">{t('advancedSearch.operator')}</label>
        <label id="builder-value">{t('advancedSearch.value')}</label>
        <span></span>

        <IndexInput
          labelledby="builder-index" //
          path={path.join('.')}
          setValue={setPath}
        />
        <KeySelector
          labelledby="builder-key"
          ref={keySelector}
          keyValue={criteria.key}
          dispatch={setCriteria}
          extraProperty={extraProperty}
        />
        <OperatorSelector
          labelledby="builder-operator"
          keyValue={criteria.key}
          value={criteria.operator}
          dispatch={setCriteria}
          extraProperty={extraProperty}
        />
        <ValueInput
          labelledby="builder-value"
          keyValue={criteria.key}
          value={criteria.value}
          dispatch={setCriteria}
          extraProperty={extraProperty}
          operator={criteria.operator}
        />
        <IconButton text={t('advancedSearch.addCriteria')} icon={IconSet.ADD} onClick={add} />
      </div>
    </fieldset>
  );
});

export default CriteriaBuilder;
