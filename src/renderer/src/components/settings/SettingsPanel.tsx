import { useState } from 'react'
import { useTerminalThemeStore } from '../../stores/terminalThemeStore'
import type { TerminalThemeDefinition } from '../../themes/types'
import ThemeList from './ThemeList'
import ThemePreview from './ThemePreview'

function SettingsPanel(): React.JSX.Element {
  const { activeThemeColors, allThemes, addCustomTheme } =
    useTerminalThemeStore()
  const [previewTheme, setPreviewTheme] = useState<TerminalThemeDefinition | null>(null)

  const displayColors = previewTheme?.colors ?? activeThemeColors()

  const handleImport = async (): Promise<void> => {
    try {
      const result = await window.api.theme.importItermcolors()
      if (result) {
        const existing = allThemes()
        let name = result.name
        let counter = 2
        while (existing.some((t) => t.name === name)) {
          name = `${result.name} (${counter})`
          counter++
        }
        const theme: TerminalThemeDefinition = {
          id: `imported-${Date.now()}`,
          name,
          source: 'imported',
          colors: result.colors
        }
        addCustomTheme(theme)
      }
    } catch {
      // user cancelled or parse error
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-[28px] px-3 shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
          Settings
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="text-[11px] font-semibold text-text-secondary mb-2 mt-1">
          Terminal Theme
        </div>

        <ThemeList
          onSelect={(theme) => setPreviewTheme(theme)}
        />

        <button
          onClick={handleImport}
          className="mt-3 w-full h-[28px] text-xs border border-border rounded hover:bg-bg-hover flex items-center justify-center gap-1 text-text-secondary"
        >
          + Import .itermcolors
        </button>

        <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mt-4 mb-2">
          Preview
        </div>
        <ThemePreview colors={displayColors} />
      </div>
    </div>
  )
}

export default SettingsPanel
