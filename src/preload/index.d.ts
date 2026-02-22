import { ElectronAPI } from '@electron-toolkit/preload'

interface FileNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileNode[]
}

interface FileAPI {
  open(): Promise<{ filePath: string; fileName: string; content: string } | null>
  read(filePath: string): Promise<{ filePath: string; fileName: string; content: string }>
  save(filePath: string, content: string): Promise<boolean>
  saveAs(content: string): Promise<{ filePath: string; fileName: string } | null>
}

interface WindowAPI {
  minimize(): Promise<void>
  maximize(): Promise<void>
  close(): Promise<void>
}

interface TerminalAPI {
  create(cwd?: string): Promise<string>
  write(id: string, data: string): void
  resize(id: string, cols: number, rows: number): void
  kill(id: string): Promise<void>
  onData(callback: (id: string, data: string) => void): () => void
  onExit(callback: (id: string, exitCode: number) => void): () => void
}

interface ExplorerAPI {
  openFolder(): Promise<string | null>
  readDirectory(dirPath: string): Promise<{ root: string; name: string; children: FileNode[] } | null>
  watch(dirPath: string): Promise<void>
  unwatch(): Promise<void>
  onTreeChanged(callback: () => void): () => void
  onFileChanged(callback: (filePath: string) => void): () => void
}

interface StoreAPI {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
}

interface ImportedThemeColors {
  background: string
  foreground: string
  cursor: string
  cursorAccent?: string
  selectionBackground: string
  selectionForeground?: string
  black: string
  red: string
  green: string
  yellow: string
  blue: string
  magenta: string
  cyan: string
  white: string
  brightBlack: string
  brightRed: string
  brightGreen: string
  brightYellow: string
  brightBlue: string
  brightMagenta: string
  brightCyan: string
  brightWhite: string
}

interface ThemeAPI {
  importItermcolors(): Promise<{ name: string; colors: ImportedThemeColors } | null>
}

interface API {
  file: FileAPI
  window: WindowAPI
  terminal: TerminalAPI
  explorer: ExplorerAPI
  store: StoreAPI
  theme: ThemeAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
