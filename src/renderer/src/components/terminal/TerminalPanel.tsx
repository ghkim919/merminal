import { useEffect, useRef, useState, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import { useLayoutStore } from '../../stores/layoutStore'
import { useExplorerStore } from '../../stores/explorerStore'
import { useEditorStore } from '../../stores/editorStore'
import TerminalInstance from './TerminalInstance'

interface TerminalTab {
  id: string
  ptyId: string
  label: string
}

function TerminalPanel(): React.JSX.Element | null {
  const { terminalVisible, terminalWidth } = useLayoutStore()
  const { projectRoot } = useExplorerStore()
  const { tabs: editorTabs, activeTabId } = useEditorStore()
  const [terminals, setTerminals] = useState<TerminalTab[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  const createTerminal = useCallback(async () => {
    const activeTab = editorTabs.find((t) => t.id === activeTabId)
    const filePath = activeTab?.filePath
    const fileDir = filePath ? filePath.substring(0, filePath.lastIndexOf('/')) : null
    const cwd = fileDir || projectRoot || undefined

    const ptyId = await window.api.terminal.create(cwd)
    const id = `term-${Date.now()}`
    const dirName = cwd ? cwd.split('/').pop() || 'terminal' : '~'
    const tab: TerminalTab = { id, ptyId, label: dirName }
    setTerminals((prev) => [...prev, tab])
    setActiveId(id)
  }, [editorTabs, activeTabId, projectRoot])

  const closeTerminal = useCallback(
    async (id: string) => {
      const tab = terminals.find((t) => t.id === id)
      if (tab) {
        await window.api.terminal.kill(tab.ptyId)
      }

      setTerminals((prev) => {
        const next = prev.filter((t) => t.id !== id)
        if (activeId === id) {
          setActiveId(next.length > 0 ? next[next.length - 1].id : null)
        }
        return next
      })
    },
    [terminals, activeId]
  )

  const createTerminalRef = useRef(createTerminal)
  createTerminalRef.current = createTerminal
  const isCreating = useRef(false)

  // 터미널 패널 열릴 때 터미널 하나 자동 생성
  useEffect(() => {
    if (terminalVisible && terminals.length === 0 && !isCreating.current) {
      isCreating.current = true
      createTerminalRef.current().finally(() => {
        isCreating.current = false
      })
    }
  }, [terminalVisible, terminals.length])

  if (!terminalVisible) return null

  const activeTerminal = terminals.find((t) => t.id === activeId)

  return (
    <div
      className="flex flex-col shrink-0 bg-bg-tertiary overflow-hidden"
      style={{ width: terminalWidth }}
    >
      {/* Terminal tab bar */}
      <div className="flex items-center h-[36px] shrink-0 bg-bg-secondary border-b border-border px-3 gap-1">
        {terminals.map((tab) => {
          const isActive = tab.id === activeId
          return (
            <div
              key={tab.id}
              onClick={() => setActiveId(tab.id)}
              className={`
                group flex items-center h-[28px] px-3 gap-2 cursor-pointer rounded text-xs shrink-0
                ${isActive
                  ? 'bg-bg-tertiary text-text-primary border border-border'
                  : 'bg-bg-primary/50 text-text-secondary border border-transparent hover:bg-bg-hover hover:border-border'}
              `}
            >
              <span className="truncate max-w-[100px]">{tab.label}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeTerminal(tab.id)
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-bg-active rounded p-0.5"
              >
                <X size={10} />
              </button>
            </div>
          )
        })}
        <button
          onClick={createTerminal}
          className="flex items-center justify-center w-[24px] h-[24px] rounded text-text-muted hover:text-text-secondary hover:bg-bg-hover"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Terminal content */}
      {activeTerminal ? (
        <TerminalInstance key={activeTerminal.id} ptyId={activeTerminal.ptyId} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-text-muted text-xs">
          No terminal
        </div>
      )}
    </div>
  )
}

export default TerminalPanel
