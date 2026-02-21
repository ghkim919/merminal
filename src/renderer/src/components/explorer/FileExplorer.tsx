import { useEffect, useCallback } from 'react'
import { FolderOpen } from 'lucide-react'
import { useExplorerStore } from '../../stores/explorerStore'
import { useEditorStore } from '../../stores/editorStore'
import FileTreeNode from './FileTreeNode'

function FileExplorer(): React.JSX.Element {
  const { projectRoot, projectName, tree, openProject, refreshTree } = useExplorerStore()
  const { updateTabFromDisk } = useEditorStore()

  const handleOpenFolder = useCallback(async () => {
    const dirPath = await window.api.explorer.openFolder()
    if (dirPath) {
      await openProject(dirPath)
    }
  }, [openProject])

  // 파일 시스템 변경 리스너
  useEffect(() => {
    const removeTreeListener = window.api.explorer.onTreeChanged(() => {
      refreshTree()
    })

    const removeFileListener = window.api.explorer.onFileChanged(async (filePath) => {
      try {
        const result = await window.api.file.read(filePath)
        updateTabFromDisk(filePath, result.content)
      } catch {
        // 파일이 삭제된 경우 무시
      }
    })

    return () => {
      removeTreeListener()
      removeFileListener()
    }
  }, [refreshTree, updateTabFromDisk])

  if (!projectRoot) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <p className="text-text-muted text-xs mb-3">No folder opened</p>
        <button
          onClick={handleOpenFolder}
          className="flex items-center gap-2 px-3 py-1.5 bg-accent text-bg-tertiary text-xs rounded hover:bg-accent-hover transition-colors"
        >
          <FolderOpen size={14} />
          Open Folder
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 프로젝트 이름 헤더 */}
      <div className="flex items-center h-[28px] px-4 shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary truncate">
          {projectName}
        </span>
      </div>

      {/* 파일 트리 */}
      <div className="flex-1 overflow-y-auto py-1">
        {tree.map((node) => (
          <FileTreeNode key={node.path} node={node} depth={0} />
        ))}
      </div>
    </div>
  )
}

export default FileExplorer
