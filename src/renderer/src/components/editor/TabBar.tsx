import { X } from 'lucide-react'
import { useEditorStore, EditorTab } from '../../stores/editorStore'

function TabBar(): React.JSX.Element {
  const { tabs, activeTabId, setActiveTab, closeTab } = useEditorStore()

  return (
    <div className="flex items-center h-[36px] shrink-0 bg-bg-secondary border-b border-border overflow-x-auto px-3 gap-1">
      {tabs.map((tab: EditorTab) => {
        const isActive = tab.id === activeTabId
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              group flex items-center h-full px-3 gap-2 cursor-pointer
              border-r border-border text-xs shrink-0 max-w-[160px]
              ${isActive
                ? 'bg-bg-primary text-text-primary'
                : 'text-text-secondary hover:bg-bg-hover'
              }
            `}
          >
            <span className="truncate">
              {tab.isDirty && <span className="text-accent mr-1">●</span>}
              {tab.fileName}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-bg-active rounded p-0.5 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default TabBar
