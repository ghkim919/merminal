import { ipcMain, dialog } from 'electron'
import { readFile } from 'fs/promises'

interface ParsedColor {
  r: number
  g: number
  b: number
  a?: number
}

function floatToHex(value: number): string {
  const clamped = Math.max(0, Math.min(1, value))
  const hex = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0')
  return hex
}

function colorToHex(color: ParsedColor): string {
  return `#${floatToHex(color.r)}${floatToHex(color.g)}${floatToHex(color.b)}`
}

function colorToRgba(color: ParsedColor, alpha: number): string {
  const r = Math.round(Math.max(0, Math.min(1, color.r)) * 255)
  const g = Math.round(Math.max(0, Math.min(1, color.g)) * 255)
  const b = Math.round(Math.max(0, Math.min(1, color.b)) * 255)
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`
}

function parseColorDict(xml: string, key: string): ParsedColor | null {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `<key>${escaped}</key>\\s*<dict>([\\s\\S]*?)</dict>`,
    'i'
  )
  const match = xml.match(pattern)
  if (!match) return null

  const dict = match[1]
  const getComponent = (name: string): number => {
    const re = new RegExp(`<key>${name}</key>\\s*<real>([^<]+)</real>`, 'i')
    const m = dict.match(re)
    return m ? parseFloat(m[1]) : 0
  }

  return {
    r: getComponent('Red Component'),
    g: getComponent('Green Component'),
    b: getComponent('Blue Component'),
    a: (() => {
      const re = /<key>Alpha Component<\/key>\s*<real>([^<]+)<\/real>/i
      const m = dict.match(re)
      return m ? parseFloat(m[1]) : undefined
    })()
  }
}

function parseItermcolorsXml(
  xml: string
): {
  colors: Record<string, string>
} {
  const colorMap: Record<string, string> = {}

  const mapping: Record<string, string> = {
    'Background Color': 'background',
    'Foreground Color': 'foreground',
    'Cursor Color': 'cursor',
    'Cursor Text Color': 'cursorAccent',
    'Selection Color': 'selectionBackground',
    'Selected Text Color': 'selectionForeground',
    'Ansi 0 Color': 'black',
    'Ansi 1 Color': 'red',
    'Ansi 2 Color': 'green',
    'Ansi 3 Color': 'yellow',
    'Ansi 4 Color': 'blue',
    'Ansi 5 Color': 'magenta',
    'Ansi 6 Color': 'cyan',
    'Ansi 7 Color': 'white',
    'Ansi 8 Color': 'brightBlack',
    'Ansi 9 Color': 'brightRed',
    'Ansi 10 Color': 'brightGreen',
    'Ansi 11 Color': 'brightYellow',
    'Ansi 12 Color': 'brightBlue',
    'Ansi 13 Color': 'brightMagenta',
    'Ansi 14 Color': 'brightCyan',
    'Ansi 15 Color': 'brightWhite'
  }

  for (const [plistKey, themeKey] of Object.entries(mapping)) {
    const parsed = parseColorDict(xml, plistKey)
    if (parsed) {
      if (themeKey === 'selectionBackground' && parsed.a !== undefined) {
        colorMap[themeKey] = colorToRgba(parsed, parsed.a)
      } else {
        colorMap[themeKey] = colorToHex(parsed)
      }
    }
  }

  // validation
  const required = ['background', 'foreground']
  for (const key of required) {
    if (!colorMap[key]) {
      throw new Error(`Missing required color: ${key}`)
    }
  }

  // fallbacks
  if (!colorMap.cursor) colorMap.cursor = colorMap.foreground
  if (!colorMap.selectionBackground) {
    colorMap.selectionBackground = 'rgba(128, 128, 128, 0.3)'
  }

  return { colors: colorMap }
}

export function registerThemeHandlers(): void {
  ipcMain.handle('theme:importItermcolors', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Import .itermcolors Theme',
      filters: [{ name: 'iTerm2 Color Scheme', extensions: ['itermcolors'] }],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const filePath = result.filePaths[0]
    const xml = await readFile(filePath, 'utf-8')
    const parsed = parseItermcolorsXml(xml)

    const fileName = filePath.split('/').pop() || 'Imported'
    const name = fileName.replace(/\.itermcolors$/i, '')

    return { name, colors: parsed.colors }
  })
}
