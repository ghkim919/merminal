import { useCallback, useRef } from 'react'

interface DividerProps {
  onResize: (delta: number) => void
  direction?: 'horizontal' | 'vertical'
}

function Divider({ onResize, direction = 'horizontal' }: DividerProps): React.JSX.Element {
  const startPos = useRef(0)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      startPos.current = direction === 'horizontal' ? e.clientX : e.clientY

      const onMouseMove = (moveEvent: MouseEvent): void => {
        const current = direction === 'horizontal' ? moveEvent.clientX : moveEvent.clientY
        const delta = current - startPos.current
        startPos.current = current
        onResize(delta)
      }

      const onMouseUp = (): void => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'
    },
    [onResize, direction]
  )

  const isHorizontal = direction === 'horizontal'

  return (
    <div
      onMouseDown={onMouseDown}
      className={`
        shrink-0 bg-border transition-colors hover:bg-accent
        ${isHorizontal ? 'w-[1px] cursor-col-resize hover:w-[3px]' : 'h-[1px] cursor-row-resize hover:h-[3px]'}
      `}
      style={{ marginInline: isHorizontal ? -1 : 0, marginBlock: isHorizontal ? 0 : -1, zIndex: 10 }}
    />
  )
}

export default Divider
