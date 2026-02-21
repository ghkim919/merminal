import { ChevronRight, ChevronDown } from 'lucide-react'
import { useExplorerStore, FileNode } from '../../stores/explorerStore'
import { useEditorStore } from '../../stores/editorStore'
import FileIcon from './FileIcon'

interface FileTreeNodeProps {
  node: FileNode
  depth: number
}

function FileTreeNode({ node, depth }: FileTreeNodeProps): React.JSX.Element {
  const { expandedDirs, toggleDir } = useExplorerStore()
  const { openTab } = useEditorStore()

  const isExpanded = expandedDirs.has(node.path)

  const handleClick = async (): Promise<void> => {
    if (node.isDirectory) {
      toggleDir(node.path)
    } else {
      try {
        const result = await window.api.file.read(node.path)
        openTab({
          filePath: result.filePath,
          fileName: result.fileName,
          content: result.content,
          language: ''
        })
      } catch (err) {
        console.error('Failed to open file:', err)
      }
    }
  }

  return (
    <div>
      <div
        onClick={handleClick}
        className="flex items-center h-[26px] cursor-pointer hover:bg-bg-hover rounded-sm group"
        style={{ paddingLeft: depth * 14 + 16 }}
      >
        {/* 폴더 화살표 */}
        <span className="w-[16px] shrink-0 flex items-center justify-center">
          {node.isDirectory && (
            isExpanded
              ? <ChevronDown size={14} className="text-text-muted" />
              : <ChevronRight size={14} className="text-text-muted" />
          )}
        </span>

        <FileIcon name={node.name} isDirectory={node.isDirectory} isOpen={isExpanded} />

        <span className="ml-1.5 truncate text-xs text-text-primary">
          {node.name}
        </span>
      </div>

      {node.isDirectory && node.children && (
        <div
          className="grid transition-[grid-template-rows] duration-150 ease-out"
          style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            {node.children.map((child) => (
              <FileTreeNode key={child.path} node={child} depth={depth + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileTreeNode
