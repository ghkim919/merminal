import { useEffect, useState, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import { useLayoutStore } from '../../stores/layoutStore'
import { useExplorerStore } from '../../stores/explorerStore'
import TerminalInstance from './TerminalInstance'

interface TerminalTab {
  id: string
  ptyId: string
  label: string
}

function TerminalPanel(): React.JSX.Element | null {
  const { terminalVisible, terminalWidth } = useLayoutStore()
  const { projectRoot } = useExplorerStore()
  const [terminals, setTerminals] = useState<TerminalTab[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  const createTerminal = useCallback(async () => {
    const ptyId = await window.api.terminal.create(projectRoot ?? undefined)
    const id = `term-${Date.now()}`
    const idx = terminals.length + 1
    const tab: TerminalTab = { id, ptyId, label: `Terminal ${idx}` }
    setTerminals((prev) => [...prev, tab])
    setActiveId(id)
  }, [terminals.length])

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

  // 앱 시작 시 터미널 하나 자동 생성
  useEffect(() => {
    if (terminalVisible && terminals.length === 0) {
      createTerminal()
    }
  }, [terminalVisible])

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
                ${isActive ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:bg-bg-hover'}
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
