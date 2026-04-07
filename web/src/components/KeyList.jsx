import React, { useMemo } from 'react';
import TreeNode from './TreeNode';
import { buildKeyTree } from '../utils/treeUtils';

/**
 * Renders the list of translation keys in the sidebar as a tree structure.
 */
const KeyList = ({
  keys,
  selectedKey,
  onSelectKey,
  onDeleteKey,
  missingTranslations,
  unusedKeys
}) => {
  // Convert flat key list to tree structure
  const keyTree = useMemo(() => {
    return buildKeyTree(keys);
  }, [keys]);

  return (
    <ul className="key-tree">
      {Object.entries(keyTree).map(([nodeKey, node]) => (
        <TreeNode
          key={nodeKey}
          nodeKey={nodeKey}
          node={node}
          level={0}
          selectedKey={selectedKey}
          onSelectKey={onSelectKey}
          onDeleteKey={onDeleteKey}
          missingTranslations={missingTranslations}
          unusedKeys={unusedKeys}
        />
      ))}
    </ul>
  );
};

export default KeyList;
