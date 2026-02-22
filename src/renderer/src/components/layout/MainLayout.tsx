import { useLayoutStore } from '../../stores/layoutStore'
import TitleBar from './TitleBar'
import ActivityBar from './ActivityBar'
import Sidebar from './Sidebar'
import Divider from './Divider'
import StatusBar from './StatusBar'
import EditorPanel from '../editor/EditorPanel'
import TerminalPanel from '../terminal/TerminalPanel'

function MainLayout(): React.JSX.Element {
  const {
    sidebarVisible,
    adjustSidebarWidth,
    terminalVisible,
    adjustTerminalWidth
  } = useLayoutStore()

  return (
    <div className="flex flex-col h-screen w-screen">
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        <ActivityBar />

        {sidebarVisible && (
          <>
            <Sidebar />
            <Divider
              onResize={(delta) => adjustSidebarWidth(delta)}
            />
          </>
        )}

        <EditorPanel />

        {terminalVisible && (
          <>
            <Divider
              onResize={(delta) => adjustTerminalWidth(-delta)}
            />
            <TerminalPanel />
          </>
        )}
      </div>

      <StatusBar />
    </div>
  )
}

export default MainLayout
