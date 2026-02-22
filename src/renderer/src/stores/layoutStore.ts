import { create } from 'zustand'

type SidebarPanel = 'explorer' | 'search' | 'settings'

interface LayoutState {
  sidebarVisible: boolean
  sidebarWidth: number
  activePanel: SidebarPanel
  terminalVisible: boolean
  terminalWidth: number

  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  adjustSidebarWidth: (delta: number) => void
  setActivePanel: (panel: SidebarPanel) => void
  toggleTerminal: () => void
  setTerminalWidth: (width: number) => void
  adjustTerminalWidth: (delta: number) => void
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  sidebarVisible: true,
  sidebarWidth: 250,
  activePanel: 'explorer',
  terminalVisible: false,
  terminalWidth: 450,

  toggleSidebar: () => {
    set({ sidebarVisible: !get().sidebarVisible })
  },

  setSidebarWidth: (width: number) => {
    set({ sidebarWidth: Math.max(180, Math.min(500, width)) })
  },

  adjustSidebarWidth: (delta: number) => {
    const current = get().sidebarWidth
    set({ sidebarWidth: Math.max(180, Math.min(500, current + delta)) })
  },

  setActivePanel: (panel: SidebarPanel) => {
    const { activePanel, sidebarVisible } = get()
    if (activePanel === panel && sidebarVisible) {
      set({ sidebarVisible: false })
    } else {
      set({ activePanel: panel, sidebarVisible: true })
    }
  },

  toggleTerminal: () => {
    set({ terminalVisible: !get().terminalVisible })
  },

  setTerminalWidth: (width: number) => {
    set({ terminalWidth: Math.max(250, Math.min(800, width)) })
  },

  adjustTerminalWidth: (delta: number) => {
    const current = get().terminalWidth
    set({ terminalWidth: Math.max(250, Math.min(800, current + delta)) })
  }
}))
