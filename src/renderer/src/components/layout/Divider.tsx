import { useCallback, useRef, useState } from 'react'

interface DividerProps {
  onResize: (delta: number) => void
  direction?: 'horizontal' | 'vertical'
}

function Divider({ onResize, direction = 'horizontal' }: DividerProps): React.JSX.Element {
  const startPos = useRef(0)
  const [dragging, setDragging] = useState(false)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      startPos.current = direction === 'horizontal' ? e.clientX : e.clientY
      setDragging(true)

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
        setDragging(false)
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
        shrink-0 relative
        ${isHorizontal ? 'cursor-col-resize' : 'cursor-row-resize'}
      `}
      style={{
        width: isHorizontal ? 5 : undefined,
        height: isHorizontal ? undefined : 5,
        zIndex: 10
      }}
    >
      <div
        className={`
          absolute transition-colors
          ${isHorizontal ? 'top-0 bottom-0 left-1/2 -translate-x-1/2' : 'left-0 right-0 top-1/2 -translate-y-1/2'}
          ${dragging ? 'bg-accent' : 'bg-border hover:bg-accent'}
        `}
        style={{
          width: isHorizontal ? 1 : undefined,
          height: isHorizontal ? undefined : 1
        }}
      />
    </div>
  )
}

export default Divider
