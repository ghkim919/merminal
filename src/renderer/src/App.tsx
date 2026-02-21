import { useEffect } from 'react'
import MainLayout from './components/layout/MainLayout'
import { useExplorerStore } from './stores/explorerStore'

function App(): React.JSX.Element {
  const restoreLastProject = useExplorerStore((s) => s.restoreLastProject)

  useEffect(() => {
    restoreLastProject()
  }, [])

  return <MainLayout />
}

export default App
