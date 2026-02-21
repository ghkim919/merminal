import { useCodeMirror } from '../../hooks/useCodeMirror'

interface WysiwygEditorProps {
  content: string
  language: string
  onChange?: (content: string) => void
}

function WysiwygEditor({ content, language, onChange }: WysiwygEditorProps): React.JSX.Element {
  const { containerRef } = useCodeMirror({ content, language, onChange })

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden"
      style={{ height: '100%' }}
    />
  )
}

export default WysiwygEditor
