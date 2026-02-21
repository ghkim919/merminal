import { useTerminal } from '../../hooks/useTerminal'

interface TerminalInstanceProps {
  ptyId: string | null
}

function TerminalInstance({ ptyId }: TerminalInstanceProps): React.JSX.Element {
  const { containerRef } = useTerminal({ ptyId })

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden"
      style={{ padding: '4px 0 0 8px' }}
    />
  )
}

export default TerminalInstance
