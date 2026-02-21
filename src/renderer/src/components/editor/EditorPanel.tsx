import { useEffect, useCallback } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import TabBar from './TabBar'
import WysiwygEditor from './WysiwygEditor'

function EditorPanel(): React.JSX.Element {
  const { tabs, activeTabId, openTab, updateContent, markSaved } = useEditorStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)

  const handleOpen = useCallback(async () => {
    const result = await window.api.file.open()
    if (result) {
      openTab({
        filePath: result.filePath,
        fileName: result.fileName,
        content: result.content,
        language: ''
      })
    }
  }, [openTab])

  const handleSave = useCallback(async () => {
    if (!activeTab) return
    if (activeTab.filePath) {
      await window.api.file.save(activeTab.filePath, activeTab.content)
      markSaved(activeTab.id)
    } else {
      const result = await window.api.file.saveAs(activeTab.content)
      if (result) {
        markSaved(activeTab.id)
      }
    }
  }, [activeTab, markSaved])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'o') {
        e.preventDefault()
        handleOpen()
      }
      if (mod && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if (mod && e.key === 'n') {
        e.preventDefault()
        openTab({ filePath: null, fileName: 'Untitled.md', content: '', language: 'markdown' })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleOpen, handleSave, openTab])

  if (!activeTab) {
    return (
      <div className="flex flex-col flex-1 min-w-[200px] bg-bg-primary overflow-hidden">
        <div className="flex-1 flex items-center justify-center text-text-muted">
          <div className="text-center">
            <p className="text-lg mb-3">Merminal</p>
            <p className="text-xs mb-1">Cmd+N to create a new file</p>
            <p className="text-xs">Cmd+O to open a file</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-w-[200px] bg-bg-primary overflow-hidden">
      <TabBar />
      <WysiwygEditor
        key={activeTab.id}
        content={activeTab.content}
        language={activeTab.language}
        onChange={(content) => updateContent(activeTab.id, content)}
      />
    </div>
  )
}

export default EditorPanel
