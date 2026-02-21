import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { basename } from 'path'

export function registerFileHandlers(): void {
  ipcMain.handle('file:open', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Markdown', extensions: ['md', 'markdown'] },
        { name: 'Code', extensions: ['js', 'ts', 'jsx', 'tsx', 'py', 'json', 'html', 'css'] }
      ]
    })

    if (result.canceled || result.filePaths.length === 0) return null

    const filePath = result.filePaths[0]
    const content = await readFile(filePath, 'utf-8')
    return { filePath, fileName: basename(filePath), content }
  })

  ipcMain.handle('file:read', async (_, filePath: string) => {
    const content = await readFile(filePath, 'utf-8')
    return { filePath, fileName: basename(filePath), content }
  })

  ipcMain.handle('file:save', async (_, filePath: string, content: string) => {
    await writeFile(filePath, content, 'utf-8')
    return true
  })

  ipcMain.handle('file:saveAs', async (_, content: string) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showSaveDialog(win, {
      filters: [
        { name: 'Markdown', extensions: ['md'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (result.canceled || !result.filePath) return null

    await writeFile(result.filePath, content, 'utf-8')
    return { filePath: result.filePath, fileName: basename(result.filePath) }
  })
}
