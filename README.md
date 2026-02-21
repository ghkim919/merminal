# Merminal

Markdown WYSIWYG 에디터와 터미널을 하나로 합친 데스크탑 앱.

터미널에서 AI 코딩 도구를 실행하면서, AI가 수정하는 파일을 에디터에서 실시간으로 확인할 수 있습니다.

```
+----+----------+-----------------------------+----------------------+
| AB |  Sidebar |  Editor (WYSIWYG)           |  Terminal            |
|    |          |                             |                      |
|  F | src/     |  # Hello World              |  $ _                 |
|  S |  main/   |                             |                      |
|    |  render/ |  This is **bold** text      |                      |
|    |  ...     |                             |                      |
+----+----------+-----------------------------+----------------------+
|  Status Bar                                                        |
+--------------------------------------------------------------------+
```

## Features

- **WYSIWYG Markdown Editor** - 커서가 있는 줄은 raw markdown, 나머지는 렌더링되는 Live Preview 방식
- **Integrated Terminal** - 완전한 터미널 에뮬레이션. TUI 앱 호환
- **File Explorer** - 프로젝트 디렉토리 트리, .gitignore 필터링, 파일 아이콘
- **Live File Sync** - 외부에서 파일이 수정되면 에디터에 자동 반영
- **Multi-tab** - 에디터/터미널 모두 다중 탭 지원
- **Resizable Panels** - 드래그로 패널 크기 조절

## Tech Stack

| | |
|---|---|
| Framework | Electron + Vite |
| UI | React + TypeScript |
| Editor | CodeMirror 6 |
| Terminal | xterm.js + node-pty |
| State | Zustand |
| Style | Tailwind CSS v4 |
| File Watch | chokidar |

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

## Keyboard Shortcuts

| Action | macOS |
|---|---|
| New file | Cmd+N |
| Open file | Cmd+O |
| Save | Cmd+S |
| Toggle sidebar | Cmd+B |
| Toggle terminal | Cmd+\` |

## License

MIT
