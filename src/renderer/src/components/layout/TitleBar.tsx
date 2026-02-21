function TitleBar(): React.JSX.Element {
  return (
    <div className="flex h-[38px] shrink-0 items-center bg-bg-tertiary border-b border-border select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* macOS traffic light 영역 확보 */}
      <div className="w-[78px] shrink-0" />

      <div className="flex-1 text-center text-text-secondary text-xs">
        Merminal
      </div>

      <div className="w-[78px] shrink-0" />
    </div>
  )
}

export default TitleBar
