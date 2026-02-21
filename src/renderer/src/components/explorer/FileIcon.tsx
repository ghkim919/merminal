import {
  File,
  FileCode,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
  Image,
  Settings
} from 'lucide-react'

interface FileIconProps {
  name: string
  isDirectory: boolean
  isOpen?: boolean
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''

  switch (ext) {
    case 'md':
    case 'markdown':
    case 'txt':
    case 'rtf':
      return { icon: FileText, color: '#89b4fa' }
    case 'js':
    case 'jsx':
      return { icon: FileCode, color: '#f9e2af' }
    case 'ts':
    case 'tsx':
      return { icon: FileCode, color: '#89b4fa' }
    case 'py':
      return { icon: FileCode, color: '#a6e3a1' }
    case 'json':
      return { icon: FileJson, color: '#f9e2af' }
    case 'html':
    case 'htm':
      return { icon: FileCode, color: '#f38ba8' }
    case 'css':
    case 'scss':
    case 'less':
      return { icon: FileCode, color: '#89b4fa' }
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'ico':
    case 'webp':
      return { icon: Image, color: '#f5c2e7' }
    case 'yaml':
    case 'yml':
    case 'toml':
    case 'ini':
    case 'env':
      return { icon: Settings, color: '#6c7086' }
    case 'sh':
    case 'bash':
    case 'zsh':
      return { icon: FileCode, color: '#a6e3a1' }
    default:
      break
  }

  // 특수 파일명
  if (name === 'Dockerfile' || name === 'Makefile' || name === 'Vagrantfile') {
    return { icon: Settings, color: '#89b4fa' }
  }
  if (name === '.gitignore' || name === '.eslintrc' || name === '.prettierrc') {
    return { icon: Settings, color: '#6c7086' }
  }

  return { icon: File, color: '#6c7086' }
}

function FileIcon({ name, isDirectory, isOpen }: FileIconProps): React.JSX.Element {
  if (isDirectory) {
    const Icon = isOpen ? FolderOpen : Folder
    return <Icon size={16} strokeWidth={1.5} style={{ color: '#89b4fa' }} className="shrink-0" />
  }

  const { icon: Icon, color } = getFileIcon(name)
  return <Icon size={16} strokeWidth={1.5} style={{ color }} className="shrink-0" />
}

export default FileIcon
