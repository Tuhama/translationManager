import React from "react";
import CleanupTool from "./CleanupTool";
import MissingKeysTool from "./MissingKeysTool";

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
  onShowAddLanguage,
  onSelectKey,
  toggleSidebar,
  data,
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="mobile-menu-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="brand-section">
          <div className="logo-container">
            <img src="/logo.png" alt="Logo" className="header-logo" />
            <div className="logo-glow"></div>
          </div>
          <div className="title-stack">
            <div className="title-row">
              <h1 className="app-title">Translation Manager</h1>
              <span className="version-badge">{__APP_VERSION__}</span>
            </div>
            <div className="header-stats">
              <span className="stat-item">
                <span className="stat-value">
                  {data.languages?.length || 0}
                </span>
                <span className="stat-label">Languages</span>
              </span>
              <span className="stat-divider"></span>
              <span className="stat-item">
                <span className="stat-value">{data.allKeys?.length || 0}</span>
                <span className="stat-label">Keys</span>
              </span>
              <span className="stat-divider"></span>
              <span
                className="stat-item"
                title="Keys that might not be used in the source code"
              >
                <span className="stat-value">
                  {(data.unused?.length || 0) + (data.maybeUsed?.length || 0)}
                </span>
                <span className="stat-label">Probable Unused</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="header-actions">
          <MissingKeysTool data={data} onSelectKey={onSelectKey} />

          <button className="header-primary-btn" onClick={onNewKey} title="New Key">
            <span className="btn-icon">➕</span>
            <span className="btn-label">New Key</span>
          </button>

          <div className="dropdown-container">
            <button className="header-btn dropdown-trigger" title="Tools">
              <span className="btn-icon">🛠️</span>
              <span className="btn-label">Tools</span>
              <span className="dropdown-arrow">▼</span>
            </button>
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={onNormalize}>
                <span className="item-icon">🪄</span>
                Normalize Files
              </button>

              <div className="dropdown-divider"></div>

              <CleanupTool
                data={data}
                onDeleteMultiple={onDeleteMultiple}
                isDropdownItem
              />

              <button className="dropdown-item" onClick={onShowAddLanguage}>
                <span className="item-icon">🌐</span>
                Add Language
              </button>

              <button className="dropdown-item" onClick={onShowAutoTranslate}>
                <span className="item-icon">🤖</span>
                Auto-Translate
              </button>

              <button className="dropdown-item" onClick={onShowExportImport}>
                <span className="item-icon">📤</span>
                Export/Import
              </button>
            </div>
          </div>

          <button
            className="header-btn"
            onClick={onShowSettings}
            title="Settings"
          >
            <span className="btn-icon">⚙️</span>
            <span className="btn-label">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
