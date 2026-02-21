import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readdir, readFile } from 'fs/promises'
import { join, basename, relative } from 'path'
import { existsSync } from 'fs'
import { watch as chokidarWatch, type FSWatcher } from 'chokidar'
import ignore from 'ignore'

export interface FileNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileNode[]
}

const DEFAULT_IGNORE = [
  '.git',
  'node_modules',
  '.DS_Store',
  'Thumbs.db',
  '.next',
  '.nuxt',
  'dist',
  'out',
  '.cache',
  '.vscode',
  '.idea',
  '__pycache__',
  '*.pyc',
  '.env',
  '.env.local'
]

let watcher: FSWatcher | null = null

async function loadGitignore(projectPath: string): Promise<ReturnType<typeof ignore>> {
  const ig = ignore()
  ig.add(DEFAULT_IGNORE)

  const gitignorePath = join(projectPath, '.gitignore')
  if (existsSync(gitignorePath)) {
    try {
      const content = await readFile(gitignorePath, 'utf-8')
      ig.add(content)
    } catch {
      // ignore read errors
    }
  }

  return ig
}

async function readDirectory(
  dirPath: string,
  projectRoot: string,
  ig: ReturnType<typeof ignore>,
  depth: number = 0
): Promise<FileNode[]> {
  if (depth > 10) return []

  const entries = await readdir(dirPath, { withFileTypes: true })
  const nodes: FileNode[] = []

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name)
    const relativePath = relative(projectRoot, fullPath)

    const checkPath = entry.isDirectory() ? relativePath + '/' : relativePath
    if (ig.ignores(checkPath)) continue

    if (entry.isDirectory()) {
      const children = await readDirectory(fullPath, projectRoot, ig, depth + 1)
      nodes.push({
        name: entry.name,
        path: fullPath,
        isDirectory: true,
        children
      })
    } else {
      nodes.push({
        name: entry.name,
        path: fullPath,
        isDirectory: false
      })
    }
  }

  // 폴더 먼저, 그 다음 파일. 각각 알파벳 순
  nodes.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return nodes
}

export function registerExplorerHandlers(): void {
  ipcMain.handle('explorer:openFolder', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    })

    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('explorer:readDirectory', async (_, dirPath: string) => {
    try {
      const ig = await loadGitignore(dirPath)
      const tree = await readDirectory(dirPath, dirPath, ig)
      return { root: dirPath, name: basename(dirPath), children: tree }
    } catch (err) {
      console.error('readDirectory error:', err)
      return null
    }
  })

  ipcMain.handle('explorer:watch', (event, dirPath: string) => {
    // 기존 watcher가 있으면 닫기
    if (watcher) {
      watcher.close()
      watcher = null
    }

    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    watcher = chokidarWatch(dirPath, {
      ignored: [
        /(^|[/\\])\./,
        '**/node_modules/**',
        '**/dist/**',
        '**/out/**',
        '**/.next/**',
        '**/__pycache__/**'
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    })

    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const notifyChange = (eventType: string, filePath: string): void => {
      if (win.isDestroyed()) return

      // 파일 내용 변경은 바로 전달
      if (eventType === 'change') {
        win.webContents.send('explorer:fileChanged', filePath)
      }

      // 트리 구조 변경은 debounce
      if (eventType === 'add' || eventType === 'unlink' || eventType === 'addDir' || eventType === 'unlinkDir') {
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          if (!win.isDestroyed()) {
            win.webContents.send('explorer:treeChanged')
          }
        }, 500)
      }
    }

    watcher
      .on('add', (path) => notifyChange('add', path))
      .on('change', (path) => notifyChange('change', path))
      .on('unlink', (path) => notifyChange('unlink', path))
      .on('addDir', (path) => notifyChange('addDir', path))
      .on('unlinkDir', (path) => notifyChange('unlinkDir', path))
  })

  ipcMain.handle('explorer:unwatch', () => {
    if (watcher) {
      watcher.close()
      watcher = null
    }
  })
}

export function cleanupWatcher(): void {
  if (watcher) {
    watcher.close()
    watcher = null
  }
}
