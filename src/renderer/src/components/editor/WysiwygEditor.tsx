import { useCodeMirror } from '../../hooks/useCodeMirror'

interface WysiwygEditorProps {
  content: string
  language: string
  filePath?: string | null
  onChange?: (content: string) => void
}

function WysiwygEditor({ content, language, filePath, onChange }: WysiwygEditorProps): React.JSX.Element {
  const { containerRef } = useCodeMirror({ content, language, filePath, onChange })

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden"
      style={{ height: '100%' }}
    />
  )
}

export default WysiwygEditor
