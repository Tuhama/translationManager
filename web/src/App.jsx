import React, { useState, useEffect, useMemo } from 'react'
import './index.css'

function App() {
  const [data, setData] = useState({ translations: {}, languages: [], allKeys: [], results: {}, unused: [], maybeUsed: [] })
  const [search, setSearch] = useState('')
  const [selectedKey, setSelectedKey] = useState(null)
  const [formData, setFormData] = useState({})
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showCleanup, setShowCleanup] = useState(false)
  const [selectedUnused, setSelectedUnused] = useState([])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/translations')
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Failed to fetch data', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredKeys = useMemo(() => {
    return data.allKeys.filter(key => key.toLowerCase().includes(search.toLowerCase()))
  }, [data.allKeys, search])

  const handleSelectKey = (key) => {
    setSelectedKey(key)
    setIsEditing(true)
    const values = {}
    data.languages.forEach(lang => {
      // Extract nested value using path
      let val = data.translations[lang]
      const path = key.split('.')
      for (const p of path) {
        val = val ? val[p] : undefined
      }
      values[lang] = val || ''
    })
    setFormData(values)
  }

  const handleCreateNew = () => {
    setSelectedKey('')
    setIsEditing(false)
    const values = {}
    data.languages.forEach(lang => {
      values[lang] = ''
    })
    setFormData(values)
  }

  const handleBlurKey = (e) => {
    const key = e.target.value
    if (data.allKeys.includes(key)) {
      handleSelectKey(key)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const finalKey = selectedKey || e.target.newKey.value

    try {
      const res = await fetch('/api/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: finalKey, values: formData })
      })
      if (res.ok) {
        await fetchData()
        setSelectedKey(finalKey)
        setIsEditing(true)
      }
    } catch (err) {
      console.error('Save failed', err)
    }
  }

  const handleDelete = async (key) => {
    if (!window.confirm(`Are you sure you want to delete "${key}"?`)) return

    try {
      const res = await fetch('/api/translations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      })
      if (res.ok) {
        await fetchData()
        if (selectedKey === key) setSelectedKey(null)
      }
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  const handleNormalize = async () => {
    if (!window.confirm('This will synchronize all keys and sort files alphabetically. Continue?')) return;
    try {
      const res = await fetch('/api/normalize', { method: 'POST' });
      if (res.ok) {
        await fetchData();
        alert('Normalization complete!');
      }
    } catch (err) {
      console.error('Normalization failed', err);
    }
  }

  const handleCleanupClick = () => {
    setSelectedUnused(data.unused || [])
    setShowCleanup(true)
  }

  const handleConfirmCleanup = async () => {
    if (selectedUnused.length === 0) return;
    try {
      const res = await fetch('/api/delete-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: selectedUnused })
      });
      if (res.ok) {
        setShowCleanup(false)
        await fetchData()
      }
    } catch (err) {
      console.error('Cleanup failed', err)
    }
  }

  const toggleUnusedSelection = (key) => {
    if (selectedUnused.includes(key)) {
      setSelectedUnused(selectedUnused.filter(k => k !== key))
    } else {
      setSelectedUnused([...selectedUnused, key])
    }
  }

  return (
    <div className="app-container">
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
            <button className="create-btn" onClick={handleCreateNew}>+ New Key</button>
            <button className="normalize-btn" onClick={handleNormalize} title="Sync and Sort Files">🪄 Normalize</button>
            <button className="clean-btn" onClick={handleCleanupClick} title="Remove unused keys">🧹 Clean</button>
          </div>
        </div>
        <div className="tree-view">
          {isLoading ? <p>Loading...</p> : (
            <ul className="key-list">
              {filteredKeys.map(key => (
                <li key={key} className={`${selectedKey === key ? 'active' : ''} ${data.results[key]?.missing?.length > 0 ? 'incomplete' : ''} ${data.unused?.includes(key) ? 'unused' : ''}`}>
                  <span onClick={() => handleSelectKey(key)}>
                    {key}
                    {data.results[key]?.missing?.length > 0 && <span className="warning-dot" title={`Missing: ${data.results[key].missing.join(', ')}`}>⚠️</span>}
                  </span>
                  <button className="delete-icon" onClick={() => handleDelete(key)}>×</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
      <main className="editor">
        {selectedKey !== null ? (
          <div className="editor-form">
            <h2>{isEditing ? `Edit: ${selectedKey}` : 'Create New Key'}</h2>
            <form onSubmit={handleSave}>
              {!isEditing && (
                <div className="form-group">
                  <label>Key (use dots for nesting)</label>
                  <input 
                    name="newKey" 
                    type="text" 
                    placeholder="e.g. common.buttons.save" 
                    required 
                    onBlur={handleBlurKey}
                  />
                </div>
              )}
              {data.languages.map(lang => (
                <div className={`form-group ${formData[lang] === '' ? 'missing' : ''}`} key={lang}>
                  <label>
                    {lang.toUpperCase()}
                    {formData[lang] === '' && <span className="missing-label"> (Missing)</span>}
                  </label>
                  <textarea 
                    value={formData[lang] || ''}
                    onChange={(e) => setFormData({ ...formData, [lang]: e.target.value })}
                    placeholder={`Translation in ${lang}...`}
                  />
                </div>
              ))}
              <div className="form-actions">
                <button type="submit" className="primary-btn">Save Translation</button>
                <button type="button" className="secondary-btn" onClick={() => setSelectedKey(null)}>Cancel</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="empty-state">
             <div className="hero-icon">🌍</div>
            <h2>Global Language Management</h2>
            <p>Select a key from the sidebar to edit or create a new one to get started.</p>
            <button className="primary-btn" onClick={handleCreateNew}>Create New Translation</button>
          </div>
        )}
      </main>
      {showCleanup && (
        <div className="modal-overlay" onClick={() => setShowCleanup(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Clean Unused Keys</h3>
              <button className="delete-icon" onClick={() => setShowCleanup(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>The following keys were not found as literal strings in your project. Review and select the ones you wish to remove.</p>
              <div className="cleanup-list">
                {[...(data.unused || []), ...(data.maybeUsed || [])].length === 0 ? (
                  <p>No unused keys found.</p>
                ) : (
                  [...(data.unused || []), ...(data.maybeUsed || [])].sort().map(key => (
                    <div 
                      key={key} 
                      className={`cleanup-item ${selectedUnused.includes(key) ? 'active' : ''}`}
                      onClick={() => toggleUnusedSelection(key)}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedUnused.includes(key)} 
                        readOnly 
                      />
                      <label>{key}</label>
                      {data.maybeUsed?.includes(key) && (
                        <span className="maybe-used-warning">⚠️ Maybe dynamic</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowCleanup(false)}>Cancel</button>
              <button 
                className="primary-btn" 
                style={{ background: selectedUnused.length > 0 ? 'var(--red)' : 'var(--text-muted)' }}
                disabled={selectedUnused.length === 0}
                onClick={handleConfirmCleanup}
              >
                Delete Selected ({selectedUnused.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
