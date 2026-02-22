import type { TerminalThemeColors } from '../../themes/types'

interface ThemePreviewProps {
  colors: TerminalThemeColors
}

function ThemePreview({ colors }: ThemePreviewProps): React.JSX.Element {
  const lines: { text: string; color: string; bold?: boolean }[][] = [
    [
      { text: '$ ', color: colors.green, bold: true },
      { text: 'ls', color: colors.foreground }
    ],
    [
      { text: 'README.md  ', color: colors.foreground },
      { text: 'src/', color: colors.blue, bold: true },
      { text: '  node_modules/', color: colors.blue, bold: true }
    ],
    [
      { text: '$ ', color: colors.green, bold: true },
      { text: 'git status', color: colors.foreground }
    ],
    [
      { text: 'On branch ', color: colors.foreground },
      { text: 'main', color: colors.cyan }
    ],
    [
      { text: 'Changes not staged:', color: colors.foreground }
    ],
    [
      { text: '  modified: ', color: colors.red },
      { text: 'src/index.ts', color: colors.red }
    ],
    [
      { text: '$ ', color: colors.green, bold: true },
      { text: 'echo ', color: colors.foreground },
      { text: '"Hello, World!"', color: colors.yellow }
    ],
    [
      { text: 'Hello, World!', color: colors.foreground }
    ]
  ]

  return (
    <div
      className="rounded overflow-hidden text-[11px] font-mono leading-[1.5] p-3"
      style={{ backgroundColor: colors.background, color: colors.foreground }}
    >
      {lines.map((line, i) => (
        <div key={i}>
          {line.map((span, j) => (
            <span
              key={j}
              style={{
                color: span.color,
                fontWeight: span.bold ? 700 : 400
              }}
            >
              {span.text}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

export default ThemePreview
