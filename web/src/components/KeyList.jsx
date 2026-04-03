import React from 'react';

/**
 * Renders the list of translation keys in the sidebar.
 */
const KeyList = ({
  keys,
  selectedKey,
  onSelectKey,
  onDeleteKey,
  missingTranslations,
  unusedKeys
}) => {
  return (
    <ul className="key-list">
      {keys.map(key => {
        const isMissing = missingTranslations[key]?.missing?.length > 0;
        const isUnused = unusedKeys?.includes(key);

        return (
          <li
            key={key}
            className={`${selectedKey === key ? 'active' : ''} ${isMissing ? 'incomplete' : ''} ${isUnused ? 'unused' : ''}`}
          >
            <span onClick={() => onSelectKey(key)}>
              {key}
              {isMissing && (
                <span className="warning-dot" title={`Missing: ${missingTranslations[key].missing.join(', ')}`}>
                  ⚠️
                </span>
              )}
            </span>
            <button className="delete-icon" onClick={() => onDeleteKey(key)}>×</button>
          </li>
        );
      })}
    </ul>
  );
};

export default KeyList;
