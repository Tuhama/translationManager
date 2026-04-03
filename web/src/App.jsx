import React, { useState } from 'react'
import './index.css'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import { useTranslations } from './hooks/useTranslations'

/**
 * Main application component.
 * Acts as a lightweight orchestrator for the Sidebar and Editor.
 */
function App() {
  const { data, isLoading, actions } = useTranslations()
  const [selectedKey, setSelectedKey] = useState(null)

  const handleSave = async (key, values) => {
    try {
      await actions.save(key, values)
      setSelectedKey(key)
    } catch (err) {
      console.error('Save failed', err)
    }
  }

  const handleDelete = async (key) => {
    if (!window.confirm(`Are you sure you want to delete "${key}"?`)) return
    try {
      await actions.deleteSingle(key)
      if (selectedKey === key) setSelectedKey(null)
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  const handleNormalize = async () => {
    if (!window.confirm('This will synchronize all keys and sort files alphabetically. Continue?')) return;
    try {
      await actions.normalize()
      alert('Normalization complete!')
    } catch (err) {
      console.error('Normalization failed', err)
    }
  }

  return (
    <div className="app-container">
      <Sidebar 
        selectedKey={selectedKey}
        onSelectKey={setSelectedKey}
        onDeleteKey={handleDelete}
        onNewKey={() => setSelectedKey('')}
        onNormalize={handleNormalize}
        onDeleteMultiple={actions.deleteMultiple}
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
  )
}

export default App
