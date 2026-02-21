function StatusBar(): React.JSX.Element {
  return (
    <div className="flex items-center h-[28px] shrink-0 bg-bg-tertiary border-t border-border px-5 text-[11px] text-text-muted">
      <span>Merminal v0.1.0</span>
      <div className="flex-1" />
      <span>UTF-8</span>
    </div>
  )
}

export default StatusBar
