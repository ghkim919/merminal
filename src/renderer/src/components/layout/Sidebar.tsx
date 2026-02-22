import { useLayoutStore } from '../../stores/layoutStore'
import FileExplorer from '../explorer/FileExplorer'
import SettingsPanel from '../settings/SettingsPanel'

function Sidebar(): React.JSX.Element | null {
  const { sidebarVisible, sidebarWidth, activePanel } = useLayoutStore()

  if (!sidebarVisible) return null

  return (
    <div
      className="flex flex-col shrink-0 bg-bg-secondary border-r border-border overflow-hidden"
      style={{ width: sidebarWidth }}
    >
      <div className="flex-1 overflow-hidden">
        {activePanel === 'explorer' ? (
          <FileExplorer />
        ) : activePanel === 'settings' ? (
          <SettingsPanel />
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center h-[28px] px-3 shrink-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                Search
              </span>
            </div>
            <div className="text-text-muted text-xs p-4 text-center">
              Search across files (coming soon)
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
