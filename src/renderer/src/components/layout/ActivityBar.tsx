import { Files, Search, Terminal, Settings } from 'lucide-react'
import { useLayoutStore } from '../../stores/layoutStore'

const items = [
  { id: 'explorer' as const, icon: Files, label: 'Explorer' },
  { id: 'search' as const, icon: Search, label: 'Search' }
]

function ActivityBar(): React.JSX.Element {
  const { activePanel, sidebarVisible, setActivePanel, terminalVisible, toggleTerminal } = useLayoutStore()

  return (
    <div className="flex flex-col w-[48px] shrink-0 bg-bg-tertiary border-r border-border">
      {items.map(({ id, icon: Icon, label }) => {
        const isActive = activePanel === id && sidebarVisible
        return (
          <button
            key={id}
            title={label}
            onClick={() => setActivePanel(id)}
            className={`
              flex items-center justify-center w-full h-[48px]
              border-l-2 transition-colors
              ${isActive
                ? 'border-accent text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-secondary'
              }
            `}
          >
            <Icon size={22} strokeWidth={1.5} />
          </button>
        )
      })}

      <div className="flex-1" />

      <button
        title="Settings"
        onClick={() => setActivePanel('settings')}
        className={`
          flex items-center justify-center w-full h-[48px]
          border-l-2 transition-colors
          ${activePanel === 'settings' && sidebarVisible
            ? 'border-accent text-text-primary'
            : 'border-transparent text-text-muted hover:text-text-secondary'
          }
        `}
      >
        <Settings size={22} strokeWidth={1.5} />
      </button>

      <button
        title="Terminal"
        onClick={toggleTerminal}
        className={`
          flex items-center justify-center w-full h-[48px]
          border-l-2 transition-colors
          ${terminalVisible
            ? 'border-accent text-text-primary'
            : 'border-transparent text-text-muted hover:text-text-secondary'
          }
        `}
      >
        <Terminal size={22} strokeWidth={1.5} />
      </button>
    </div>
  )
}

export default ActivityBar
