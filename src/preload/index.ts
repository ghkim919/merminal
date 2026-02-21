import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  file: {
    open: (): Promise<{ filePath: string; fileName: string; content: string } | null> =>
      ipcRenderer.invoke('file:open'),
    read: (
      filePath: string
    ): Promise<{ filePath: string; fileName: string; content: string }> =>
      ipcRenderer.invoke('file:read', filePath),
    save: (filePath: string, content: string): Promise<boolean> =>
      ipcRenderer.invoke('file:save', filePath, content),
    saveAs: (
      content: string
    ): Promise<{ filePath: string; fileName: string } | null> =>
      ipcRenderer.invoke('file:saveAs', content)
  },
  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
    maximize: (): Promise<void> => ipcRenderer.invoke('window:maximize'),
    close: (): Promise<void> => ipcRenderer.invoke('window:close')
  },
  terminal: {
    create: (cwd?: string): Promise<string> => ipcRenderer.invoke('terminal:create', cwd),
    write: (id: string, data: string): void => ipcRenderer.send('terminal:write', id, data),
    resize: (id: string, cols: number, rows: number): void =>
      ipcRenderer.send('terminal:resize', id, cols, rows),
    kill: (id: string): Promise<void> => ipcRenderer.invoke('terminal:kill', id),
    onData: (callback: (id: string, data: string) => void): (() => void) => {
      const handler = (_: unknown, id: string, data: string): void => callback(id, data)
      ipcRenderer.on('terminal:data', handler)
      return () => ipcRenderer.removeListener('terminal:data', handler)
    },
    onExit: (callback: (id: string, exitCode: number) => void): (() => void) => {
      const handler = (_: unknown, id: string, exitCode: number): void =>
        callback(id, exitCode)
      ipcRenderer.on('terminal:exit', handler)
      return () => ipcRenderer.removeListener('terminal:exit', handler)
    }
  },
  explorer: {
    openFolder: (): Promise<string | null> => ipcRenderer.invoke('explorer:openFolder'),
    readDirectory: (
      dirPath: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<{ root: string; name: string; children: any[] } | null> =>
      ipcRenderer.invoke('explorer:readDirectory', dirPath),
    watch: (dirPath: string): Promise<void> => ipcRenderer.invoke('explorer:watch', dirPath),
    unwatch: (): Promise<void> => ipcRenderer.invoke('explorer:unwatch'),
    onTreeChanged: (callback: () => void): (() => void) => {
      const handler = (): void => callback()
      ipcRenderer.on('explorer:treeChanged', handler)
      return () => ipcRenderer.removeListener('explorer:treeChanged', handler)
    },
    onFileChanged: (callback: (filePath: string) => void): (() => void) => {
      const handler = (_: unknown, filePath: string): void => callback(filePath)
      ipcRenderer.on('explorer:fileChanged', handler)
      return () => ipcRenderer.removeListener('explorer:fileChanged', handler)
    }
  },
  store: {
    get: (key: string): Promise<unknown> => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: unknown): Promise<void> => ipcRenderer.invoke('store:set', key, value)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
