import { useRef, useEffect, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import { WebglAddon } from '@xterm/addon-webgl'
import { useTerminalThemeStore } from '../stores/terminalThemeStore'

interface UseTerminalOptions {
  ptyId: string | null
}

export function useTerminal({ ptyId }: UseTerminalOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  const fit = useCallback(() => {
    const fitAddon = fitAddonRef.current
    const terminal = terminalRef.current
    if (fitAddon && terminal && ptyId) {
      try {
        fitAddon.fit()
        window.api.terminal.resize(ptyId, terminal.cols, terminal.rows)
      } catch {
        // ignore fit errors during cleanup
      }
    }
  }, [ptyId])

  useEffect(() => {
    if (!containerRef.current || !ptyId) return

    const themeColors = useTerminalThemeStore.getState().activeThemeColors()

    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      lineHeight: 1.1,
      theme: themeColors,
      allowProposedApi: true
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.loadAddon(new Unicode11Addon())
    terminal.unicode.activeVersion = '11'

    terminal.open(containerRef.current)

    try {
      terminal.loadAddon(new WebglAddon())
    } catch {
      // WebGL not available, fall back to canvas renderer
    }

    setTimeout(() => {
      fitAddon.fit()
      window.api.terminal.resize(ptyId, terminal.cols, terminal.rows)
    }, 50)

    terminal.onData((data) => {
      window.api.terminal.write(ptyId, data)
    })

    const removeDataListener = window.api.terminal.onData((id, data) => {
      if (id === ptyId) {
        terminal.write(data)
      }
    })

    const removeExitListener = window.api.terminal.onExit((id, exitCode) => {
      if (id === ptyId) {
        terminal.writeln(`\r\n\x1b[90m[Process exited with code ${exitCode}]\x1b[0m`)
      }
    })

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    return () => {
      removeDataListener()
      removeExitListener()
      terminal.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
    }
  }, [ptyId])

  // theme 변경 실시간 반영
  useEffect(() => {
    return useTerminalThemeStore.subscribe((state) => {
      const terminal = terminalRef.current
      if (terminal) {
        terminal.options.theme = state.activeThemeColors()
      }
    })
  }, [])

  // 리사이즈 감지 (debounce로 PTY resize 폭주 방지)
  useEffect(() => {
    if (!containerRef.current) return

    let timer: ReturnType<typeof setTimeout> | null = null
    const observer = new ResizeObserver(() => {
      // xterm 레이아웃은 즉시 맞추되 PTY 통지는 debounce
      const fitAddon = fitAddonRef.current
      if (fitAddon) {
        try { fitAddon.fit() } catch { /* ignore */ }
      }
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        const terminal = terminalRef.current
        if (terminal && ptyId) {
          window.api.terminal.resize(ptyId, terminal.cols, terminal.rows)
        }
      }, 150)
    })

    observer.observe(containerRef.current)
    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [ptyId])

  return { containerRef, fit }
}
