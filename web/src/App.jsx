import React, { useState } from 'react'
import './index.css'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import Settings from './components/Settings'
import AutoTranslateTool from './components/AutoTranslateTool'
import ExportImportTool from './components/ExportImportTool'
import Alert from './components/ui/Alert'
import { useTranslations } from './hooks/useTranslations'

/**
 * Main application component.
 * Acts as a lightweight orchestrator for the Sidebar and Editor.
 */
function App() {
  const { data, isLoading, error: fetchError, actions } = useTranslations()
  const [selectedKey, setSelectedKey] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showAutoTranslate, setShowAutoTranslate] = useState(false)
  const [showExportImport, setShowExportImport] = useState(false)
  const [error, setError] = useState(null)

  const activeError = error || fetchError

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleSave = async (key, values) => {
    // Create a custom dialog with three options
    const choice = window.prompt(
      'Choose how to save the translation files:\n\n' +
      '1 - Save with pretty-printing and sorting (recommended)\n' +
      '2 - Save without formatting (faster)\n' +
      '0 - Cancel\n\n' +
      'Enter your choice (0, 1, or 2):'
    );

    if (choice === null || choice === '0') return; // Cancel

    const format = choice === '1'; // true for formatted, false for unformatted

    try {
      setError(null)
      await actions.save(key, values, format)
      setSelectedKey(key)
    } catch (err) {
      setError(err.message)
      console.error('Save failed', err)
    }
  }

  const handleDelete = async (key) => {
    if (!window.confirm(`Are you sure you want to delete "${key}"?`)) return
    try {
      setError(null)
      await actions.deleteSingle(key)
      if (selectedKey === key) setSelectedKey(null)
    } catch (err) {
      setError(err.message)
      console.error('Delete failed', err)
    }
  }

  const handleNormalize = async () => {
    if (!window.confirm('This will synchronize all keys and sort files alphabetically. Continue?')) return;
    try {
      setError(null)
      await actions.normalize()
      alert('Normalization complete!')
    } catch (err) {
      setError(err.message)
      console.error('Normalization failed', err)
    }
  }

  const activeError = error || fetchError

  return (
    <div className="app-container">
      <Header 
        onNewKey={() => setSelectedKey('')}
        onNormalize={handleNormalize}
        onDeleteMultiple={actions.deleteMultiple}
        onShowSettings={() => setShowSettings(true)}
        onShowAutoTranslate={() => setShowAutoTranslate(true)}
        onShowExportImport={() => setShowExportImport(true)}
        onSelectKey={setSelectedKey}
        data={data}
      />
      {activeError && (
        <div style={{ padding: '0 24px', marginTop: '16px' }}>
          <Alert type="error" onClose={() => setError(null)}>
            {activeError}
          </Alert>
        </div>
      )}
      <div className="app-body">
        <Sidebar 
          selectedKey={selectedKey}
          onSelectKey={setSelectedKey}
          onDeleteKey={handleDelete}
          isLoading={isLoading}
          data={data}
        />
        <main className="editor">
          <Editor 
            selectedKey={selectedKey}
            setSelectedKey={setSelectedKey}
            onSave={handleSave}
            onCancel={() => setSelectedKey(null)}
            languages={data.languages}
            translations={data.translations}
            allKeys={data.allKeys}
          />
        </main>
      </div>
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {showAutoTranslate && (
        <AutoTranslateTool 
          languages={data.languages} 
          onUpdate={actions.refresh} 
          onClose={() => setShowAutoTranslate(false)}
          actions={actions}
        />
      )}
      {showExportImport && (
        <ExportImportTool 
          languages={data.languages} 
          onUpdate={actions.refresh} 
          onClose={() => setShowExportImport(false)}
        />
      )}
    </div>
  )
}

export default App
