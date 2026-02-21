import { create } from 'zustand'

export interface FileNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileNode[]
}

interface ExplorerState {
  projectRoot: string | null
  projectName: string | null
  tree: FileNode[]
  expandedDirs: Set<string>

  openProject: (dirPath: string) => Promise<void>
  refreshTree: () => Promise<void>
  toggleDir: (path: string) => void
  setTree: (tree: FileNode[]) => void
}

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  projectRoot: null,
  projectName: null,
  tree: [],
  expandedDirs: new Set<string>(),

  openProject: async (dirPath: string) => {
    const result = await window.api.explorer.readDirectory(dirPath)
    if (!result) return

    set({
      projectRoot: result.root,
      projectName: result.name,
      tree: result.children,
      expandedDirs: new Set<string>()
    })

    await window.api.explorer.watch(dirPath)
  },

  refreshTree: async () => {
    const { projectRoot } = get()
    if (!projectRoot) return

    const result = await window.api.explorer.readDirectory(projectRoot)
    if (result) {
      set({ tree: result.children })
    }
  },

  toggleDir: (path: string) => {
    const { expandedDirs } = get()
    const next = new Set(expandedDirs)
    if (next.has(path)) {
      next.delete(path)
    } else {
      next.add(path)
    }
    set({ expandedDirs: next })
  },

  setTree: (tree: FileNode[]) => {
    set({ tree })
  }
}))
