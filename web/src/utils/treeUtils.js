/**
 * Utility functions for converting flat key lists to tree structures
 */

/**
 * Converts a flat array of dot-notation keys into a tree structure
 * @param {string[]} keys - Array of keys like ["common.buttons.save", "common.buttons.cancel", "user.profile.name"]
 * @returns {Object} Tree structure with nested objects
 */
export const buildKeyTree = (keys) => {
  const tree = {};
  
  keys.forEach(key => {
    const parts = key.split('.');
    let current = tree;
    
    // Navigate/create the tree structure
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLeaf = i === parts.length - 1;
      
      if (isLeaf) {
        // This is a leaf node (actual translation key)
        current[part] = {
          type: 'leaf',
          fullKey: key,
          children: null
        };
      } else {
        // This is a branch node (parent key)
        if (!current[part]) {
          current[part] = {
            type: 'branch',
            fullKey: parts.slice(0, i + 1).join('.'),
            children: {}
          };
        }
        current = current[part].children;
      }
    }
  });
  
  return tree;
};

/**
 * Flattens a tree structure back to an array of keys
 * @param {Object} tree - Tree structure
 * @param {string[]} result - Accumulator array
 * @returns {string[]} Flat array of keys
 */
export const flattenTree = (tree, result = []) => {
  Object.values(tree).forEach(node => {
    if (node.type === 'leaf') {
      result.push(node.fullKey);
    } else if (node.type === 'branch' && node.children) {
      flattenTree(node.children, result);
    }
  });
  return result;
};

/**
 * Gets all leaf keys under a branch
 * @param {Object} branchNode - Branch node from tree
 * @returns {string[]} Array of leaf keys
 */
export const getLeafKeys = (branchNode) => {
  if (branchNode.type === 'leaf') {
    return [branchNode.fullKey];
  }
  
  const keys = [];
  if (branchNode.children) {
    Object.values(branchNode.children).forEach(child => {
      keys.push(...getLeafKeys(child));
    });
  }
  return keys;
};