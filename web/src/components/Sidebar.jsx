import React, { useState, useMemo } from 'react';
import KeyList from './KeyList';
import CleanupTool from './CleanupTool';

/**
 * Handles the sidebar layout, search, and navigation.
 * Manages search state and filtered key list internally.
 */
const Sidebar = ({
  selectedKey,
  onSelectKey,
  onDeleteKey,
  onNewKey,
  onNormalize,
  onDeleteMultiple,
  isLoading,
  data,
  onShowSettings,
  onShowAutoTranslate
}) => {
  const [search, setSearch] = useState('');

  const filteredKeys = useMemo(() => {
    return (data.allKeys || []).filter(key => 
      key.toLowerCase().includes(search.toLowerCase())
    );
  }, [data.allKeys, search]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Translation Manager</h1>
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search keys..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sidebar-actions">
          <button className="create-btn" onClick={onNewKey}>+ New Key</button>
          <button className="normalize-btn" onClick={onNormalize} title="Sync and Sort Files">🪄 Normalize</button>
          <CleanupTool data={data} onDeleteMultiple={onDeleteMultiple} />
        </div>
        <div className="sidebar-tools">
          <button className="tool-btn icon-text" onClick={onShowAutoTranslate}>🪄 Auto-Translate</button>
          <button className="tool-btn" onClick={onShowSettings} title="Settings">⚙️ Settings</button>
        </div>
      </div>
      <div className="tree-view">
        {isLoading ? (
          <p>Loading...</p>
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
