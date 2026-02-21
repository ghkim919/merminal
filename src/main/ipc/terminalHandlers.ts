import { ipcMain, BrowserWindow } from 'electron'
import * as pty from 'node-pty'
import { platform, homedir } from 'os'

const ptys = new Map<string, pty.IPty>()
let nextId = 0

function defaultShell(): string {
  if (platform() === 'win32') return 'powershell.exe'
  return process.env.SHELL || '/bin/zsh'
}

export function registerTerminalHandlers(): void {
  ipcMain.handle('terminal:create', (event, cwd?: string) => {
    const id = `pty-${++nextId}`
    const shell = defaultShell()

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: cwd || homedir(),
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor'
      } as Record<string, string>
    })

    ptys.set(id, ptyProcess)

    const win = BrowserWindow.fromWebContents(event.sender)

    ptyProcess.onData((data) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('terminal:data', id, data)
      }
    })

    ptyProcess.onExit(({ exitCode }) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('terminal:exit', id, exitCode)
      }
      ptys.delete(id)
    })

    return id
  })

  ipcMain.on('terminal:write', (_, id: string, data: string) => {
    const p = ptys.get(id)
    if (p) p.write(data)
  })

  ipcMain.on('terminal:resize', (_, id: string, cols: number, rows: number) => {
    const p = ptys.get(id)
    if (p) {
      try {
        p.resize(cols, rows)
      } catch {
        // ignore resize errors
      }
    }
  })

  ipcMain.handle('terminal:kill', (_, id: string) => {
    const p = ptys.get(id)
    if (p) {
      p.kill()
      ptys.delete(id)
    }
  })
}

export function cleanupAllPtys(): void {
  for (const [id, p] of ptys) {
    p.kill()
    ptys.delete(id)
  }
}
