import { create } from 'zustand'
import type { TerminalThemeDefinition, TerminalThemeColors } from '../themes/types'
import { terminalPresets } from '../themes/terminalPresets'

const DEFAULT_THEME_ID = 'merminal-light'

interface TerminalThemeState {
  activeThemeId: string
  customThemes: TerminalThemeDefinition[]
  loaded: boolean

  activeThemeColors: () => TerminalThemeColors
  allThemes: () => TerminalThemeDefinition[]
  setActiveTheme: (id: string) => void
  addCustomTheme: (theme: TerminalThemeDefinition) => void
  removeCustomTheme: (id: string) => void
  loadFromStore: () => Promise<void>
}

function findTheme(
  id: string,
  customThemes: TerminalThemeDefinition[]
): TerminalThemeDefinition | undefined {
  return terminalPresets.find((t) => t.id === id) || customThemes.find((t) => t.id === id)
}

export const useTerminalThemeStore = create<TerminalThemeState>((set, get) => ({
  activeThemeId: DEFAULT_THEME_ID,
  customThemes: [],
  loaded: false,

  activeThemeColors: () => {
    const { activeThemeId, customThemes } = get()
    const theme = findTheme(activeThemeId, customThemes)
    return theme?.colors ?? terminalPresets[0].colors
  },

  allThemes: () => {
    return [...terminalPresets, ...get().customThemes]
  },

  setActiveTheme: (id: string) => {
    set({ activeThemeId: id })
    window.api.store.set('terminalTheme.activeThemeId', id)
  },

  addCustomTheme: (theme: TerminalThemeDefinition) => {
    set((state) => {
      const next = [...state.customThemes, theme]
      window.api.store.set('terminalTheme.customThemes', next)
      return { customThemes: next }
    })
  },

  removeCustomTheme: (id: string) => {
    const { activeThemeId } = get()
    set((state) => {
      const next = state.customThemes.filter((t) => t.id !== id)
      window.api.store.set('terminalTheme.customThemes', next)
      return {
        customThemes: next,
        activeThemeId: activeThemeId === id ? DEFAULT_THEME_ID : activeThemeId
      }
    })
    if (activeThemeId === id) {
      window.api.store.set('terminalTheme.activeThemeId', DEFAULT_THEME_ID)
    }
  },

  loadFromStore: async () => {
    const [savedId, savedCustom] = await Promise.all([
      window.api.store.get('terminalTheme.activeThemeId') as Promise<string | undefined>,
      window.api.store.get('terminalTheme.customThemes') as Promise<
        TerminalThemeDefinition[] | undefined
      >
    ])
    const customThemes = savedCustom ?? []
    const activeThemeId =
      savedId && findTheme(savedId, customThemes) ? savedId : DEFAULT_THEME_ID
    set({ activeThemeId, customThemes, loaded: true })
  }
}))
