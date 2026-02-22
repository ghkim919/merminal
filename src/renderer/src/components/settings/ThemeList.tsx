import { useState } from 'react'
import { X, Search } from 'lucide-react'
import { useTerminalThemeStore } from '../../stores/terminalThemeStore'
import type { TerminalThemeDefinition } from '../../themes/types'

interface ThemeListProps {
  onSelect: (theme: TerminalThemeDefinition) => void
}

function ThemeList({ onSelect }: ThemeListProps): React.JSX.Element {
  const { activeThemeId, setActiveTheme, removeCustomTheme, allThemes } =
    useTerminalThemeStore()
  const [filter, setFilter] = useState('')

  const themes = allThemes()
  const builtins = themes.filter(
    (t) => t.source === 'builtin' && t.name.toLowerCase().includes(filter.toLowerCase())
  )
  const imported = themes.filter(
    (t) => t.source !== 'builtin' && t.name.toLowerCase().includes(filter.toLowerCase())
  )

  const handleSelect = (theme: TerminalThemeDefinition): void => {
    setActiveTheme(theme.id)
    onSelect(theme)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search themes..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full h-[28px] pl-7 pr-2 text-xs bg-bg-primary border border-border rounded outline-none focus:border-accent"
        />
      </div>

      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mt-1">
        Built-in
      </div>
      <div className="flex flex-col gap-0.5">
        {builtins.map((theme) => (
          <ThemeItem
            key={theme.id}
            theme={theme}
            active={theme.id === activeThemeId}
            onSelect={() => handleSelect(theme)}
          />
        ))}
      </div>

      {imported.length > 0 && (
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mt-2">
            Imported
          </div>
          <div className="flex flex-col gap-0.5">
            {imported.map((theme) => (
              <ThemeItem
                key={theme.id}
                theme={theme}
                active={theme.id === activeThemeId}
                onSelect={() => handleSelect(theme)}
                onDelete={() => removeCustomTheme(theme.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ThemeItem({
  theme,
  active,
  onSelect,
  onDelete
}: {
  theme: TerminalThemeDefinition
  active: boolean
  onSelect: () => void
  onDelete?: () => void
}): React.JSX.Element {
  const { colors } = theme
  const ansiColors = [
    colors.black, colors.red, colors.green, colors.yellow,
    colors.blue, colors.magenta, colors.cyan, colors.white
  ]

  return (
    <div
      onClick={onSelect}
      className={`
        group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs
        ${active
          ? 'bg-accent/15 text-text-primary border border-accent/30'
          : 'hover:bg-bg-hover border border-transparent'}
      `}
    >
      <div
        className="w-5 h-5 rounded shrink-0 flex items-center justify-center text-[9px] font-bold"
        style={{ backgroundColor: colors.background, color: colors.foreground, border: '1px solid var(--color-border)' }}
      >
        Aa
      </div>

      <span className="flex-1 truncate">{theme.name}</span>

      <div className="flex gap-[2px] shrink-0">
        {ansiColors.map((c, i) => (
          <div
            key={i}
            className="w-[6px] h-[6px] rounded-full"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-bg-active"
        >
          <X size={10} />
        </button>
      )}
    </div>
  )
}

export default ThemeList
