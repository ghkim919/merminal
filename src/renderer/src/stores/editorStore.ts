import { create } from 'zustand'

export interface EditorTab {
  id: string
  filePath: string | null
  fileName: string
  content: string
  isDirty: boolean
  language: string
}

interface EditorState {
  tabs: EditorTab[]
  activeTabId: string | null

  openTab: (tab: Omit<EditorTab, 'id' | 'isDirty'>) => string
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateContent: (id: string, content: string) => void
  markSaved: (id: string) => void
  updateTabFromDisk: (filePath: string, content: string) => void
}

let nextId = 0
const genId = (): string => `tab-${++nextId}`

function detectLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    md: 'markdown',
    markdown: 'markdown',
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    json: 'json',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'css',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell'
  }
  return map[ext] || 'plaintext'
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openTab: (tab) => {
    const { tabs } = get()
    if (tab.filePath) {
      const existing = tabs.find((t) => t.filePath === tab.filePath)
      if (existing) {
        set({ activeTabId: existing.id })
        return existing.id
      }
    }

    const id = genId()
    const language = tab.language || detectLanguage(tab.fileName)
    const newTab: EditorTab = { ...tab, id, isDirty: false, language }
    set({ tabs: [...tabs, newTab], activeTabId: id })
    return id
  },

  closeTab: (id) => {
    const { tabs, activeTabId } = get()
    const idx = tabs.findIndex((t) => t.id === id)
    const newTabs = tabs.filter((t) => t.id !== id)

    let newActive = activeTabId
    if (activeTabId === id) {
      if (newTabs.length === 0) {
        newActive = null
      } else if (idx >= newTabs.length) {
        newActive = newTabs[newTabs.length - 1].id
      } else {
        newActive = newTabs[idx].id
      }
    }

    set({ tabs: newTabs, activeTabId: newActive })
  },

  setActiveTab: (id) => {
    set({ activeTabId: id })
  },

  updateContent: (id, content) => {
    set({
      tabs: get().tabs.map((t) => (t.id === id ? { ...t, content, isDirty: true } : t))
    })
  },

  markSaved: (id) => {
    set({
      tabs: get().tabs.map((t) => (t.id === id ? { ...t, isDirty: false } : t))
    })
  },

  updateTabFromDisk: (filePath, content) => {
    set({
      tabs: get().tabs.map((t) =>
        t.filePath === filePath && !t.isDirty ? { ...t, content } : t
      )
    })
  }
}))
