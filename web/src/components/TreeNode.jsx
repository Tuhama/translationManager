import React, { useState } from 'react';
import { getLeafKeys } from '../utils/treeUtils';

/**
 * Renders a single node in the translation key tree
 */
const TreeNode = ({
  nodeKey,
  node,
  level = 0,
  selectedKey,
  onSelectKey,
  onDeleteKey,
  missingTranslations,
  unusedKeys
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (node.type === 'leaf') {
    // Render leaf node (actual translation key)
    const isMissing = missingTranslations[node.fullKey]?.missing?.length > 0;
    const isUnused = unusedKeys?.includes(node.fullKey);
    const isSelected = selectedKey === node.fullKey;

    return (
      <li
        className={`tree-node tree-leaf ${isSelected ? 'active' : ''} ${isMissing ? 'incomplete' : ''} ${isUnused ? 'unused' : ''}`}
        style={{ paddingLeft: `${level * 20 + 14}px` }}
      >
        <span onClick={() => onSelectKey(node.fullKey)} className="tree-leaf-content">
          <span className="tree-leaf-text">
            {nodeKey}
            {isMissing && (
              <span 
                className="missing-translation-dot" 
                title={`Missing translations for: ${missingTranslations[node.fullKey].missing.join(', ')}`}
              >
                🔤
              </span>
            )}
          </span>
        </span>
        <button className="delete-icon" onClick={() => onDeleteKey(node.fullKey)}>×</button>
      </li>
    );
  }

  // Render branch node (parent key)
  const childKeys = getLeafKeys(node);
  const hasSelectedChild = childKeys.includes(selectedKey);
  const hasMissingChild = childKeys.some(key => missingTranslations[key]?.missing?.length > 0);
  const hasUnusedChild = childKeys.some(key => unusedKeys?.includes(key));

  return (
    <li className="tree-node tree-branch">
      <div 
        className={`tree-branch-header ${hasSelectedChild ? 'has-selected-child' : ''}`}
        style={{ paddingLeft: `${level * 20 + 14}px` }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="tree-expand-icon">
          {isExpanded ? '▼' : '▶'}
        </span>
        <span className="tree-branch-text">
          {nodeKey}
          <span className="tree-branch-count">({childKeys.length})</span>
          {hasMissingChild && (
            <span className="branch-indicator missing" title="Contains keys with missing translations">🔤</span>
          )}
          {hasUnusedChild && (
            <span className="branch-indicator unused" title="Contains unused keys">⚠️</span>
          )}
        </span>
      </div>
      {isExpanded && (
        <ul className="tree-children">
          {Object.entries(node.children).map(([childKey, childNode]) => (
            <TreeNode
              key={childKey}
              nodeKey={childKey}
              node={childNode}
              level={level + 1}
              selectedKey={selectedKey}
              onSelectKey={onSelectKey}
              onDeleteKey={onDeleteKey}
              missingTranslations={missingTranslations}
              unusedKeys={unusedKeys}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default TreeNode;