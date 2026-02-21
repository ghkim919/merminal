import { create } from 'zustand'

type SidebarPanel = 'explorer' | 'search'

interface LayoutState {
  sidebarVisible: boolean
  sidebarWidth: number
  activePanel: SidebarPanel
  terminalVisible: boolean
  terminalWidth: number

  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  setActivePanel: (panel: SidebarPanel) => void
  toggleTerminal: () => void
  setTerminalWidth: (width: number) => void
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  sidebarVisible: true,
  sidebarWidth: 250,
  activePanel: 'explorer',
  terminalVisible: true,
  terminalWidth: 450,

  toggleSidebar: () => {
    set({ sidebarVisible: !get().sidebarVisible })
  },

  setSidebarWidth: (width: number) => {
    set({ sidebarWidth: Math.max(180, Math.min(500, width)) })
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
  }
}))
