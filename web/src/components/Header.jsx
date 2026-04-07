import React from 'react';
import CleanupTool from './CleanupTool';
import MissingKeysTool from './MissingKeysTool';

/**
 * Main application header with branding and primary actions
 */
const Header = ({
  onNewKey,
  onNormalize,
  onDeleteMultiple,
  onShowSettings,
  onShowAutoTranslate,
  onShowExportImport,
  onSelectKey,
  data
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand-section">
          <img src="/logo.png" alt="Logo" className="header-logo" />
          <h1 className="app-title">Translation Manager</h1>
        </div>
      </div>

      <div className="header-right">
        <div className="header-actions">
          <button className="header-primary-btn" onClick={onNewKey}>
            <span className="btn-icon">➕</span>
            New Key
          </button>

          <button className="header-btn" onClick={onNormalize} title="Normalize Files">
            <span className="btn-icon">🪄</span>
            Normalize
          </button>

          <CleanupTool data={data} onDeleteMultiple={onDeleteMultiple} />

          <button className="header-btn" onClick={onShowAutoTranslate} title="Auto-Translate">
            <span className="btn-icon">🤖</span>
            Auto-Translate
          </button>

          <button className="header-btn" onClick={onShowExportImport} title="Export/Import">
            <span className="btn-icon">📤</span>
            Export/Import
          </button>

          <MissingKeysTool data={data} onSelectKey={onSelectKey} />

          <button className="header-btn" onClick={onShowSettings} title="Settings">
            <span className="btn-icon">⚙️</span>
            Settings
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
