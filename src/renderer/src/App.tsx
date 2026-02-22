import { useEffect } from 'react'
import MainLayout from './components/layout/MainLayout'
import { useExplorerStore } from './stores/explorerStore'
import { useTerminalThemeStore } from './stores/terminalThemeStore'

function App(): React.JSX.Element {
  const restoreLastProject = useExplorerStore((s) => s.restoreLastProject)
  const loadTheme = useTerminalThemeStore((s) => s.loadFromStore)

  useEffect(() => {
    restoreLastProject()
    loadTheme()
  }, [])

  return <MainLayout />
}

export default App
