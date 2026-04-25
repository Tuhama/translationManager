import React, { useState, useMemo } from 'react';
import KeyList from './KeyList';

/**
 * Handles the sidebar layout, search, and navigation.
 * Manages search state and filtered key list internally.
 */
const Sidebar = ({
  selectedKey,
  onSelectKey,
  onDeleteKey,
  isLoading,
  data,
  isOpen,
  onClose
}) => {
  const [search, setSearch] = useState('');

  const filteredKeys = useMemo(() => {
    return (data.allKeys || []).filter(key => 
      key.toLowerCase().includes(search.toLowerCase())
    );
  }, [data.allKeys, search]);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header-mobile">
        <span className="sidebar-title">Menu</span>
        <button className="sidebar-close" onClick={onClose}>&times;</button>
      </div>
      <div className="sidebar-search">
        <input 
          type="text" 
          placeholder="Search keys..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>
      <div className="tree-view">
        {isLoading ? (
          <div className="loading-state">
            <p>Loading...</p>
          </div>
        ) : (
          <KeyList 
            keys={filteredKeys}
            selectedKey={selectedKey}
            onSelectKey={onSelectKey}
            onDeleteKey={onDeleteKey}
            missingTranslations={data.results}
            unusedKeys={data.unused}
          />
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
