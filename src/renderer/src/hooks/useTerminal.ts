import { useRef, useEffect, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'

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

    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      lineHeight: 1.4,
      theme: {
        background: '#11111b',
        foreground: '#cdd6f4',
        cursor: '#89b4fa',
        selectionBackground: 'rgba(137, 180, 250, 0.3)',
        black: '#45475a',
        red: '#f38ba8',
        green: '#a6e3a1',
        yellow: '#f9e2af',
        blue: '#89b4fa',
        magenta: '#f5c2e7',
        cyan: '#94e2d5',
        white: '#bac2de',
        brightBlack: '#585b70',
        brightRed: '#f38ba8',
        brightGreen: '#a6e3a1',
        brightYellow: '#f9e2af',
        brightBlue: '#89b4fa',
        brightMagenta: '#f5c2e7',
        brightCyan: '#94e2d5',
        brightWhite: '#a6adc8'
      },
      allowProposedApi: true
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)

    terminal.open(containerRef.current)

    // fit 후 PTY에 cols/rows 전달
    setTimeout(() => {
      fitAddon.fit()
      window.api.terminal.resize(ptyId, terminal.cols, terminal.rows)
    }, 50)

    // 터미널 입력 → PTY
    terminal.onData((data) => {
      window.api.terminal.write(ptyId, data)
    })

    // PTY 출력 → 터미널
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

  // 리사이즈 감지
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver(() => {
      fit()
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [fit])

  return { containerRef, fit }
}
