/**
 * Gets a nested value from an object using a dot-notated key.
 */
export const getNestedValue = (obj, key) => {
  if (!obj || !key) return undefined;
  const path = key.split('.');
  let current = obj;
  for (const part of path) {
    current = current ? current[part] : undefined;
  }
  return current;
};
