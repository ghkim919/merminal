# Phase 7: 터미널 테마 시스템

## 1. 개요

### 배경
Merminal의 xterm.js 터미널은 현재 앱 색상 체계(베이지 계열)에 맞춘 단일 테마가 `useTerminal.ts`에 하드코딩되어 있다. 사용자가 평소 사용하던 터미널(Terminal.app, iTerm2 등)과 색감이 달라 어색함을 느끼며, 본인의 터미널 환경을 Merminal에서도 재현하고 싶은 니즈가 있다.

### 목표
사용자가 자신의 취향에 맞는 터미널 색상 환경을 Merminal 내에서 구성할 수 있도록, 프리셋 테마 선택 + 외부 테마 파일 임포트 + 커스텀 편집 기능을 제공한다.

### 범위

| 구분 | 내용 |
|------|------|
| IN scope | 터미널 테마 프리셋 내장, 외부 테마 파일(.itermcolors) 임포트, 커스텀 색상 편집 UI, 테마 영구 저장, 테마 실시간 미리보기 |
| OUT of scope | macOS Terminal.app/iTerm2 프로파일 자동 감지, 앱 전체 테마(에디터/사이드바) 변경, .terminal 파일 임포트, 터미널 폰트 커스터마이즈, 테마 내보내기(export) |

---

## 2. 접근 방식 비교 분석

사용자가 제시한 5가지 접근 방식에 대한 분석이다.

### 접근 1: 시스템 터미널 테마 상속

| 항목 | 내용 |
|------|------|
| 방법 | Terminal.app의 `com.apple.Terminal.plist` 또는 iTerm2의 `com.googlecode.iterm2.plist`에서 색상값을 파싱 |
| 장점 | 사용자의 기존 환경을 자동으로 재현, 설정 없이 즉시 익숙한 환경 |
| 단점 | plist 파싱 복잡도 높음 (바이너리 plist + NSKeyedArchiver 인코딩), macOS 전용, Terminal.app의 색상은 NSColor 아카이브로 저장되어 디코딩이 매우 어려움, 사용자가 어떤 터미널을 쓰는지 감지해야 함, 프로파일이 여러 개일 때 어떤 것을 선택할지 모호 |
| 구현 난이도 | **매우 높음** |
| 판정 | **비추천**. 투자 대비 효과가 낮고, 크로스 플랫폼 확장성이 없다. |

### 접근 2: 인기 터미널 테마 프리셋 내장

| 항목 | 내용 |
|------|------|
| 방법 | Dracula, One Dark, Solarized, Nord 등 유명 테마를 JSON으로 내장하고 드롭다운 선택 |
| 장점 | 구현 간단, 사용자에게 즉시 다양한 선택지 제공, 검증된 색상 조합으로 가독성 보장 |
| 단점 | 사용자가 정확히 원하는 테마가 없을 수 있음, 테마 추가 시 앱 업데이트 필요 |
| 구현 난이도 | **낮음** |
| 판정 | **강력 추천**. 최소 구현으로 최대 사용자 만족을 줄 수 있다. |

### 접근 3: 앱 테마와 자동 조화

| 항목 | 내용 |
|------|------|
| 방법 | 앱의 CSS 변수(bg-primary, accent 등)에서 터미널 배경/전경/ANSI 16색을 알고리즘으로 자동 생성 |
| 장점 | 앱과 터미널의 시각적 통일감, 앱 테마 변경 시 터미널도 자동 연동 |
| 단점 | ANSI 16색을 자동 생성하기 어려움 (red, green, blue 등은 semantic color이므로 앱 테마 색상에서 파생 불가), 자동 생성된 색상의 대비(contrast ratio) 보장 어려움, 실용적 가치 낮음 (ls의 디렉토리 파란색, 에러 빨간색 등은 관례적 색상) |
| 구현 난이도 | **높음** |
| 판정 | **비추천**. ANSI 색상은 의미론적이므로 알고리즘 생성이 적합하지 않다. 현재 하드코딩된 테마가 이미 이 역할을 한다. |

### 접근 4: 커스텀 테마 에디터

| 항목 | 내용 |
|------|------|
| 방법 | 설정 UI에서 배경, 전경, ANSI 16색 등을 색상 피커로 개별 지정 |
| 장점 | 완전한 자유도, 프리셋을 기반으로 미세 조정 가능 |
| 단점 | UI 구현 비용 높음 (색상 피커 18개+), 사용자가 색상 조합을 잘 모를 경우 가독성 나쁜 결과 |
| 구현 난이도 | **중간~높음** |
| 판정 | **P1 추천**. 프리셋을 먼저 제공하고, 커스텀 편집은 후속으로 추가한다. |

### 접근 5: .itermcolors 파일 임포트

| 항목 | 내용 |
|------|------|
| 방법 | 사용자가 `.itermcolors` (XML plist) 파일을 임포트하여 테마로 변환 |
| 장점 | iTerm2 테마 생태계 활용 (수백 개의 무료 테마), 사용자의 기존 테마 그대로 사용 가능, XML plist이므로 파싱이 비교적 간단 |
| 단점 | `.itermcolors` 형식 한정 (Terminal.app의 `.terminal`은 별도 파서 필요), 임포트 UI 필요 |
| 구현 난이도 | **중간** |
| 판정 | **추천**. iTerm2 생태계의 방대한 테마를 그대로 활용할 수 있어 효과적이다. |

### 종합 비교표

| 접근 방식 | 구현 난이도 | 사용자 가치 | 크로스 플랫폼 | 추천 |
|-----------|------------|------------|--------------|------|
| 1. 시스템 상속 | 매우 높음 | 높음 | 불가 (macOS) | X |
| 2. 프리셋 내장 | 낮음 | 높음 | 가능 | **P0** |
| 3. 앱 자동 조화 | 높음 | 낮음 | 가능 | X |
| 4. 커스텀 에디터 | 중간~높음 | 중간 | 가능 | **P1** |
| 5. .itermcolors 임포트 | 중간 | 높음 | 가능 | **P0** |

### 추천 조합

**P0: 프리셋 내장 (접근 2) + .itermcolors 임포트 (접근 5)**

이 조합이 최소 구현으로 최대 커버리지를 달성한다. 프리셋으로 즉시 대안을 제공하고, `.itermcolors` 임포트로 기존 테마를 그대로 가져올 수 있다. 커스텀 에디터(접근 4)는 P1으로 후속 구현한다.

---

## 3. 터미널 테마 데이터 구조

### 3.1 ITerminalTheme 인터페이스

xterm.js의 `ITheme`와 동일한 구조를 기반으로 하되, 메타데이터를 추가한다.

```typescript
/** 터미널 테마 메타데이터 + 색상 정의 */
interface TerminalThemeDefinition {
  /** 고유 식별자 (preset: "dracula", import: "imported-1719000000") */
  id: string
  /** 사용자에게 표시되는 이름 */
  name: string
  /** 테마 출처 */
  source: 'builtin' | 'imported' | 'custom'

  /** xterm.js ITheme 호환 색상 */
  colors: TerminalThemeColors
}

interface TerminalThemeColors {
  background: string
  foreground: string
  cursor: string
  cursorAccent?: string
  selectionBackground: string
  selectionForeground?: string

  // ANSI 16색
  black: string
  red: string
  green: string
  yellow: string
  blue: string
  magenta: string
  cyan: string
  white: string
  brightBlack: string
  brightRed: string
  brightGreen: string
  brightYellow: string
  brightBlue: string
  brightMagenta: string
  brightCyan: string
  brightWhite: string
}
```

### 3.2 저장 구조

electron-store에 저장한다.

```typescript
// electron-store 키 구조
{
  "terminalTheme": {
    "activeThemeId": "dracula",        // 현재 선택된 테마 ID
    "customThemes": [                   // 사용자가 임포트/커스텀한 테마 목록
      { id, name, source, colors }
    ]
  }
}
```

- 내장 프리셋은 코드에 포함되므로 store에 저장하지 않는다.
- `customThemes`에는 `source: 'imported'` 또는 `source: 'custom'`인 테마만 저장한다.

---

## 4. 기능 목록

### F-01: 내장 프리셋 테마

**우선순위**: P0 (필수)

| 항목 | 내용 |
|------|------|
| 현재 상태 | 베이지 계열 단일 테마가 `useTerminal.ts`에 하드코딩 |
| 목표 상태 | 10개 이상의 인기 터미널 테마를 내장하고 드롭다운으로 선택 |
| 트리거 | 설정에서 테마 선택 |

#### 상세 요구사항

- FR-001: 다음 프리셋 테마를 내장한다 (최소 10개).

| 테마 이름 | 계열 | 배경 | 전경 | 비고 |
|-----------|------|------|------|------|
| Merminal Light | 라이트 | #c4bfb0 | #2d2d2d | 현재 기본 테마 (앱 색상 조화) |
| Merminal Dark | 다크 | #1e1e1e | #d4d4d4 | 앱 다크 모드 대비용 |
| Dracula | 다크 | #282a36 | #f8f8f2 | 가장 인기 있는 다크 테마 |
| One Dark | 다크 | #282c34 | #abb2bf | Atom/VS Code 계열 |
| Solarized Dark | 다크 | #002b36 | #839496 | 학술/개발자 선호 |
| Solarized Light | 라이트 | #fdf6e3 | #657b83 | 밝은 배경 선호자용 |
| Nord | 다크 | #2e3440 | #d8dee9 | 차분한 파란 계열 |
| Catppuccin Mocha | 다크 | #1e1e2e | #cdd6f4 | 최근 인기 상승 |
| Tokyo Night | 다크 | #1a1b26 | #a9b1d6 | 보라/파랑 계열 |
| Gruvbox Dark | 다크 | #282828 | #ebdbb2 | 레트로/따뜻한 다크 |
| GitHub Light | 라이트 | #ffffff | #24292e | GitHub 스타일 |
| Rosé Pine | 다크 | #191724 | #e0def4 | 부드러운 분위기 |

- FR-002: 각 프리셋은 `TerminalThemeDefinition` 형태의 JSON 객체로 정의하며, `src/renderer/src/themes/terminalPresets.ts` 파일에 모아둔다.
- FR-003: 프리셋 테마는 `source: 'builtin'`으로 표시되며, 사용자가 삭제하거나 수정할 수 없다.
- FR-004: 기본 선택 테마는 `Merminal Light`로 한다 (기존 동작 유지).

#### 사용자 시나리오

- **정상 흐름**: 설정 화면에서 "터미널 테마" 드롭다운을 열고 "Dracula"를 선택하면, 모든 열린 터미널 인스턴스의 색상이 즉시 변경된다.
- **앱 재시작**: 선택한 테마가 저장되어, 앱을 다시 열어도 동일한 테마가 적용된다.

#### 수용 기준

- AC-001: Given 프리셋 목록이 표시될 때, Then 최소 10개의 테마가 이름과 함께 나열된다.
- AC-002: Given 사용자가 테마를 선택했을 때, Then 모든 열린 터미널 인스턴스에 즉시 적용된다.
- AC-003: Given 테마를 선택한 후 앱을 종료/재시작했을 때, Then 동일한 테마가 유지된다.
- AC-004: Given 내장 프리셋 테마일 때, Then 삭제 버튼이 표시되지 않는다.

---

### F-02: .itermcolors 파일 임포트

**우선순위**: P0 (필수)

| 항목 | 내용 |
|------|------|
| 현재 상태 | 외부 테마 파일을 가져오는 방법 없음 |
| 목표 상태 | `.itermcolors` 파일을 임포트하여 커스텀 테마로 등록 |
| 트리거 | 설정 화면의 "Import Theme" 버튼 클릭 |

#### .itermcolors 파일 형식 분석

`.itermcolors`는 Apple의 XML plist 형식이다. 색상은 RGB 컴포넌트(0.0~1.0 범위의 float)로 저장된다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Ansi 0 Color</key>
  <dict>
    <key>Color Space</key>
    <string>sRGB</string>
    <key>Red Component</key>
    <real>0.0</real>
    <key>Green Component</key>
    <real>0.0</real>
    <key>Blue Component</key>
    <real>0.0</real>
  </dict>
  <!-- Ansi 1 Color ~ Ansi 15 Color -->
  <key>Background Color</key>
  <dict>...</dict>
  <key>Foreground Color</key>
  <dict>...</dict>
  <key>Cursor Color</key>
  <dict>...</dict>
  <key>Selection Color</key>
  <dict>...</dict>
  <!-- ... -->
</dict>
</plist>
```

#### .itermcolors 키 → TerminalThemeColors 매핑

| .itermcolors 키 | TerminalThemeColors 속성 |
|-----------------|--------------------------|
| Background Color | background |
| Foreground Color | foreground |
| Cursor Color | cursor |
| Cursor Text Color | cursorAccent |
| Selection Color | selectionBackground |
| Selected Text Color | selectionForeground |
| Ansi 0 Color | black |
| Ansi 1 Color | red |
| Ansi 2 Color | green |
| Ansi 3 Color | yellow |
| Ansi 4 Color | blue |
| Ansi 5 Color | magenta |
| Ansi 6 Color | cyan |
| Ansi 7 Color | white |
| Ansi 8 Color | brightBlack |
| Ansi 9 Color | brightRed |
| Ansi 10 Color | brightGreen |
| Ansi 11 Color | brightYellow |
| Ansi 12 Color | brightBlue |
| Ansi 13 Color | brightMagenta |
| Ansi 14 Color | brightCyan |
| Ansi 15 Color | brightWhite |

#### 상세 요구사항

- FR-005: 설정 화면에 "Import .itermcolors" 버튼을 제공한다.
- FR-006: 버튼 클릭 시 네이티브 파일 다이얼로그를 열고, `.itermcolors` 확장자 파일만 선택할 수 있도록 필터링한다.
- FR-007: 선택한 파일의 XML plist를 파싱하여 `TerminalThemeColors` 객체로 변환한다.
  - RGB 컴포넌트(0.0~1.0 float)를 hex 문자열(`#RRGGBB`)로 변환한다.
  - `Alpha Component`가 있으면 selection 색상에 alpha를 적용한다 (`rgba()` 형식).
  - `Color Space`가 `sRGB` 또는 `Calibrated`인 경우 모두 sRGB로 취급한다.
- FR-008: 파싱 성공 시, 테마 이름을 파일 이름(확장자 제외)으로 설정하고, `source: 'imported'`로 `customThemes`에 추가한다.
- FR-009: 파싱 실패 시 (XML 파싱 에러, 필수 키 누락 등) 사용자에게 에러 메시지를 표시한다. 필수 키: `Background Color`, `Foreground Color`, `Ansi 0 Color` ~ `Ansi 15 Color`. 선택 키가 없을 경우 적절한 기본값(fallback)을 사용한다.
- FR-010: 임포트된 테마는 사용자가 삭제할 수 있다.
- FR-011: XML plist 파싱은 main process에서 수행한다 (Renderer에서 파일 시스템 접근 불가). IPC 채널 `theme:importItermcolors`를 추가한다.

#### 사용자 시나리오

- **정상 흐름**: "Import .itermcolors" 클릭 -> 파일 선택 다이얼로그 -> `Dracula.itermcolors` 선택 -> 테마 목록에 "Dracula (imported)"가 추가 -> 클릭하면 즉시 적용.
- **에러 케이스**: 잘못된 형식의 파일 선택 시 "Failed to parse theme file. Please ensure it is a valid .itermcolors file." 메시지 표시.
- **중복 이름**: 동일 이름의 테마가 이미 존재하면 "Dracula (2)"로 자동 넘버링.

#### 수용 기준

- AC-005: Given 유효한 `.itermcolors` 파일을 선택했을 때, Then 테마 목록에 새 항목이 추가되고 선택 가능하다.
- AC-006: Given 잘못된 파일을 선택했을 때, Then 에러 메시지가 표시되고 테마 목록에 변화가 없다.
- AC-007: Given 임포트된 테마가 있을 때, Then 삭제 버튼으로 제거할 수 있다.
- AC-008: Given `.itermcolors` 파일에 `Cursor Color` 키가 없을 때, Then `Foreground Color` 값을 cursor 기본값으로 사용한다.

#### 기술적 고려사항

- XML plist 파싱: Node.js의 내장 XML 파서는 없으므로, 가벼운 접근법으로 정규식 기반 간이 파서를 구현하거나, `plist` npm 패키지(~15KB)를 사용한다. `.itermcolors` 파일의 구조가 단순하고 정형화되어 있으므로 간이 파서로 충분하다.
- Color Space 처리: iTerm2는 `sRGB`, `Calibrated` (= generic RGB), `P3` 등의 Color Space를 사용한다. `P3` 색공간의 경우 sRGB 범위를 벗어나는 색상이 있을 수 있으므로, 클램핑(0.0~1.0)을 적용한다.

---

### F-03: 테마 설정 UI

**우선순위**: P0 (필수, F-01/F-02를 위한 UI)

| 항목 | 내용 |
|------|------|
| 현재 상태 | 터미널 관련 설정 UI 없음 |
| 목표 상태 | 터미널 테마를 선택/임포트/삭제할 수 있는 설정 패널 |
| 트리거 | Activity Bar의 설정 아이콘 또는 단축키 |

#### 상세 요구사항

- FR-012: Activity Bar에 설정(Settings) 아이콘을 하단에 추가한다. 클릭 시 Sidebar가 설정 패널로 전환된다.
- FR-013: 설정 패널 내 "Terminal" 섹션에 다음 UI 요소를 배치한다.
  - 테마 목록: 프리셋 + 임포트된 테마를 리스트로 표시
  - 각 항목: 테마 이름 + 배경/전경 색상 미리보기 원(circle) + 선택 라디오
  - "Import .itermcolors" 버튼
  - 임포트된 테마 항목에는 삭제(X) 버튼
- FR-014: 테마 목록 각 항목에 색상 미리보기를 표시한다.
  - 배경색 원(12px) + 전경색 텍스트 "Aa" 미리보기
  - ANSI 8색(black~white)을 작은 색상 도트(6px)로 나열
- FR-015: 테마를 선택하면 즉시 모든 열린 터미널에 적용한다 (OK/Cancel 없이 즉시 반영).
- FR-016: 테마 미리보기 영역을 제공한다. 설정 패널 하단 또는 우측에 작은 터미널 프리뷰를 표시하여, 테마 선택 시 ANSI 16색이 어떻게 보이는지 샘플 텍스트로 보여준다.

#### UI 레이아웃 설계

```
+---------------------------------------------------+
|  Settings                                          |
+---------------------------------------------------+
|                                                    |
|  Terminal Theme                                    |
|  ───────────────────────────────────────────────── |
|                                                    |
|  [Search themes...]                                |
|                                                    |
|  BUILT-IN                                          |
|  ┌─────────────────────────────────────────────┐  |
|  │ (o) Merminal Light    ██ Aa ●●●●●●●●       │  |
|  │ ( ) Merminal Dark     ██ Aa ●●●●●●●●       │  |
|  │ ( ) Dracula           ██ Aa ●●●●●●●●       │  |
|  │ ( ) One Dark          ██ Aa ●●●●●●●●       │  |
|  │ ( ) Solarized Dark    ██ Aa ●●●●●●●●       │  |
|  │ ( ) Solarized Light   ██ Aa ●●●●●●●●       │  |
|  │ ( ) Nord              ██ Aa ●●●●●●●●       │  |
|  │ ( ) Catppuccin Mocha  ██ Aa ●●●●●●●●       │  |
|  │ ( ) Tokyo Night       ██ Aa ●●●●●●●●       │  |
|  │ ( ) Gruvbox Dark      ██ Aa ●●●●●●●●       │  |
|  │ ( ) GitHub Light      ██ Aa ●●●●●●●●       │  |
|  │ ( ) Rosé Pine         ██ Aa ●●●●●●●●       │  |
|  └─────────────────────────────────────────────┘  |
|                                                    |
|  IMPORTED                                          |
|  ┌─────────────────────────────────────────────┐  |
|  │ ( ) My Custom Theme   ██ Aa ●●●●●●●●  [X]  │  |
|  └─────────────────────────────────────────────┘  |
|                                                    |
|  [+ Import .itermcolors]                           |
|                                                    |
|  ───────────────────────────────────────────────── |
|  Preview                                           |
|  ┌─────────────────────────────────────────────┐  |
|  │  $ ls                                        │  |
|  │  README.md  src/  node_modules/              │  |
|  │  $ git status                                │  |
|  │  On branch main                              │  |
|  │  Changes not staged:                         │  |
|  │    modified:   src/index.ts                  │  |
|  │  $ echo "Hello, World!"                      │  |
|  │  Hello, World!                               │  |
|  └─────────────────────────────────────────────┘  |
|                                                    |
+---------------------------------------------------+
```

미리보기(Preview) 영역의 샘플 텍스트는 ANSI escape 코드로 각 색상을 실제로 사용하여 표시한다.

- 디렉토리명: blue+bold
- 파일명: foreground (기본)
- `$` 프롬프트: green
- branch명: cyan
- "modified": red
- 파일 경로: yellow
- echo 출력: foreground (기본)

#### 사용자 시나리오

- **테마 선택**: 설정 패널에서 "Dracula" 클릭 -> 미리보기 영역이 Dracula 색상으로 변경 -> 열린 터미널들도 즉시 변경.
- **테마 임포트**: "Import .itermcolors" 클릭 -> 파일 선택 -> IMPORTED 섹션에 추가 -> 선택하면 적용.
- **테마 삭제**: IMPORTED 항목의 X 버튼 클릭 -> 확인 다이얼로그("Delete theme 'My Theme'?") -> 확인 시 삭제, 해당 테마가 활성 상태였으면 "Merminal Light"로 폴백.
- **테마 검색**: 검색창에 "dark" 입력 -> "Merminal Dark", "One Dark", "Solarized Dark", "Gruvbox Dark", "Tokyo Night" 등 이름에 "dark"가 포함된 테마만 필터링.

#### 수용 기준

- AC-009: Given 설정 패널을 열었을 때, Then "Terminal Theme" 섹션에 프리셋 테마 목록이 표시된다.
- AC-010: Given 테마 항목을 클릭했을 때, Then 미리보기가 즉시 업데이트되고 터미널에도 반영된다.
- AC-011: Given 임포트된 테마를 삭제했을 때, Then 목록에서 제거되고 다른 테마로 폴백된다.
- AC-012: Given 검색창에 텍스트를 입력했을 때, Then 이름이 매칭되는 테마만 필터링된다.

---

### F-04: 테마 실시간 적용

**우선순위**: P0 (필수)

| 항목 | 내용 |
|------|------|
| 현재 상태 | 테마가 터미널 생성 시 한 번만 적용되고 이후 변경 불가 |
| 목표 상태 | 테마 변경 시 이미 열린 터미널 인스턴스에도 즉시 반영 |
| 트리거 | 테마 선택 변경 |

#### 상세 요구사항

- FR-017: 테마 변경 이벤트가 발생하면, 현재 활성화된 모든 `Terminal` 인스턴스에 대해 `terminal.options.theme = newTheme`을 호출한다.
- FR-018: xterm.js의 `terminal.options.theme` setter를 통해 테마를 변경하면 기존 출력 내용에도 새 배경색/전경색이 적용된다. 단, 이미 ANSI 색상 코드로 출력된 텍스트의 색상은 변경되지 않는다 (이는 xterm.js의 정상 동작이며, 이 명세에서 별도 처리하지 않는다).
- FR-019: `useTerminal` 훅에서 현재 테마를 Zustand store에서 구독하고, 테마 변경 시 `terminal.options.theme`을 업데이트한다.

#### 수용 기준

- AC-013: Given 터미널이 열린 상태에서 테마를 변경했을 때, Then 터미널 배경색과 전경색이 즉시 변경된다.
- AC-014: Given 여러 터미널 탭이 열린 상태에서 테마를 변경했을 때, Then 모든 터미널 탭에 동시에 적용된다.

---

### F-05: 커스텀 테마 에디터 (개별 색상 편집)

**우선순위**: P1 (높음, 후속)

| 항목 | 내용 |
|------|------|
| 현재 상태 | 프리셋 또는 임포트만 가능 |
| 목표 상태 | 기존 테마를 복제하여 개별 색상을 수정할 수 있는 편집 UI |
| 트리거 | 테마 항목의 "Duplicate & Edit" 버튼 |

#### 상세 요구사항

- FR-020: 프리셋 또는 임포트 테마를 "Duplicate & Edit"하여 사본을 생성한다. 사본은 `source: 'custom'`으로 저장된다.
- FR-021: 커스텀 테마 편집 화면에서 다음 색상을 개별 수정할 수 있다.
  - 기본 색상: background, foreground, cursor, selectionBackground (4개)
  - ANSI 16색: black ~ brightWhite (16개)
  - 총 20개 색상 편집
- FR-022: 각 색상 항목 옆에 color input(`<input type="color">`)을 배치한다. 클릭 시 OS 네이티브 색상 피커가 열린다.
- FR-023: 색상 변경 시 미리보기 영역에 즉시 반영된다.
- FR-024: "Save" 버튼으로 변경 내용을 electron-store에 저장한다.
- FR-025: 커스텀 테마의 이름을 수정할 수 있다 (인라인 편집).

#### 커스텀 테마 편집 UI 레이아웃

```
+---------------------------------------------------+
|  Edit Theme: My Custom Theme                  [x]  |
+---------------------------------------------------+
|                                                    |
|  Theme Name: [My Custom Theme        ]             |
|                                                    |
|  Base Colors                                       |
|  ┌─────────────────────────────────────────────┐  |
|  │ Background        [████] #282a36            │  |
|  │ Foreground         [████] #f8f8f2            │  |
|  │ Cursor             [████] #f8f8f2            │  |
|  │ Selection          [████] #44475a            │  |
|  └─────────────────────────────────────────────┘  |
|                                                    |
|  ANSI Colors                                       |
|  ┌─────────────────────────────────────────────┐  |
|  │ Normal                                       │  |
|  │ Black   [████]  Red     [████]               │  |
|  │ Green   [████]  Yellow  [████]               │  |
|  │ Blue    [████]  Magenta [████]               │  |
|  │ Cyan    [████]  White   [████]               │  |
|  │                                               │  |
|  │ Bright                                        │  |
|  │ Black   [████]  Red     [████]               │  |
|  │ Green   [████]  Yellow  [████]               │  |
|  │ Blue    [████]  Magenta [████]               │  |
|  │ Cyan    [████]  White   [████]               │  |
|  └─────────────────────────────────────────────┘  |
|                                                    |
|  Preview (동일 샘플 텍스트)                         |
|  ┌─────────────────────────────────────────────┐  |
|  │  ...                                         │  |
|  └─────────────────────────────────────────────┘  |
|                                                    |
|  [Cancel]                              [Save]      |
+---------------------------------------------------+
```

#### 수용 기준

- AC-015: Given 프리셋 테마에서 "Duplicate & Edit"를 선택했을 때, Then 해당 테마의 색상이 복사된 새 커스텀 테마가 생성된다.
- AC-016: Given 색상 피커로 색상을 변경했을 때, Then 미리보기에 즉시 반영된다.
- AC-017: Given "Save"를 클릭했을 때, Then 변경 내용이 electron-store에 저장되고 테마 목록에 반영된다.
- AC-018: Given "Cancel"을 클릭했을 때, Then 변경 내용이 폐기되고 편집 화면이 닫힌다.

---

## 5. 구현 단계

### Step 1: 테마 데이터 인프라

**대상**: 테마 타입 정의, 프리셋 데이터, Zustand store, useTerminal 리팩토링

| 항목 | 내용 |
|------|------|
| 작업 내용 | `TerminalThemeDefinition` 타입 정의, 12개 프리셋 테마 JSON 작성, `terminalThemeStore` Zustand store 생성, `useTerminal.ts`에서 하드코딩 테마를 store 참조로 교체 |
| 의존성 | 없음 (기반 작업) |
| 난이도 | 낮음 |
| 산출물 | `src/renderer/src/themes/types.ts`, `src/renderer/src/themes/terminalPresets.ts`, `src/renderer/src/stores/terminalThemeStore.ts`, `useTerminal.ts` 수정 |

#### 상세 작업

1. `src/renderer/src/themes/types.ts` 생성: `TerminalThemeColors`, `TerminalThemeDefinition` 인터페이스
2. `src/renderer/src/themes/terminalPresets.ts` 생성: 12개 프리셋 테마 정의
3. `src/renderer/src/stores/terminalThemeStore.ts` 생성:
   - state: `activeThemeId`, `customThemes`, computed `activeTheme`
   - actions: `setActiveTheme(id)`, `addCustomTheme(theme)`, `removeCustomTheme(id)`, `loadFromStore()`, `saveToStore()`
4. `useTerminal.ts` 수정: `terminalThemeStore`의 `activeTheme.colors`를 xterm.js `theme` 옵션으로 전달
5. 앱 시작 시 `loadFromStore()`를 호출하여 저장된 테마 복원

---

### Step 2: 테마 실시간 적용 (F-04)

**대상**: 열린 터미널에 테마 변경 즉시 반영

| 항목 | 내용 |
|------|------|
| 작업 내용 | `useTerminal` 훅에서 `terminalThemeStore`의 theme 변경을 구독하고, `terminal.options.theme` 업데이트 |
| 의존성 | Step 1 |
| 난이도 | 낮음 |
| 산출물 | `useTerminal.ts` 수정 |

#### 상세 작업

1. `useTerminal.ts`에 `useEffect` 추가: `activeTheme` 변경 시 `terminalRef.current.options.theme = activeTheme.colors` 실행
2. 터미널 생성 시에도 store에서 현재 테마를 가져와 적용

---

### Step 3: 설정 패널 UI (F-03)

**대상**: Activity Bar + 설정 패널 + 테마 목록 UI

| 항목 | 내용 |
|------|------|
| 작업 내용 | Activity Bar에 설정 아이콘 추가, `SettingsPanel` 컴포넌트 생성, 테마 목록 렌더링, 검색 필터, 미리보기 영역 |
| 의존성 | Step 1 |
| 난이도 | 중간 |
| 산출물 | `src/renderer/src/components/settings/SettingsPanel.tsx`, `src/renderer/src/components/settings/ThemeList.tsx`, `src/renderer/src/components/settings/ThemePreview.tsx`, `ActivityBar.tsx` 수정, `layoutStore.ts` 수정 |

#### 상세 작업

1. `layoutStore.ts`에 `activePanel`에 `'settings'` 타입 추가
2. `ActivityBar.tsx` 하단에 설정 아이콘(`Settings` from lucide-react) 추가
3. `SettingsPanel.tsx`: 설정 화면 컨테이너, "Terminal Theme" 섹션
4. `ThemeList.tsx`: 프리셋/임포트 테마 목록, 검색 필터, 선택/삭제 기능
5. `ThemePreview.tsx`: ANSI 색상 샘플 텍스트를 HTML로 렌더링하는 미리보기 영역
6. `Sidebar.tsx` 수정: `activePanel === 'settings'`일 때 `SettingsPanel` 렌더링

---

### Step 4: .itermcolors 임포트 (F-02)

**대상**: .itermcolors 파일 파싱 + IPC + UI 연결

| 항목 | 내용 |
|------|------|
| 작업 내용 | XML plist 파서 구현 (main process), IPC 채널 추가, 임포트 버튼 UI 연결 |
| 의존성 | Step 1, Step 3 |
| 난이도 | 중간 |
| 산출물 | `src/main/services/itermcolorsParser.ts`, `src/main/ipc/themeHandlers.ts`, preload API 추가, `SettingsPanel` 수정 |

#### 상세 작업

1. `src/main/services/itermcolorsParser.ts` 생성:
   - `parseItermcolors(filePath: string): TerminalThemeColors` 함수
   - XML plist 파싱 (정규식 기반 간이 파서 또는 `plist` 패키지)
   - RGB float → hex 변환 유틸리티
   - 필수 키 검증 + fallback 처리
2. `src/main/ipc/themeHandlers.ts` 생성:
   - `theme:importItermcolors` IPC 핸들러 (파일 다이얼로그 + 파싱 + 결과 반환)
3. `src/preload/index.ts` + `index.d.ts` 수정: `theme` API 추가
4. `SettingsPanel` 수정: "Import .itermcolors" 버튼 연결

---

### Step 5: 커스텀 테마 에디터 (F-05, P1)

**대상**: Duplicate & Edit, 색상 피커, 저장

| 항목 | 내용 |
|------|------|
| 작업 내용 | 커스텀 테마 편집 UI, 색상 피커 연동, 이름 편집, 저장/취소 |
| 의존성 | Step 1, Step 3 |
| 난이도 | 중간~높음 |
| 산출물 | `src/renderer/src/components/settings/ThemeEditor.tsx`, `terminalThemeStore.ts` 수정 |

#### 상세 작업

1. `ThemeEditor.tsx` 생성: 색상 편집 폼 (20개 `<input type="color">`), 이름 편집, 미리보기, Save/Cancel
2. `terminalThemeStore.ts`에 `duplicateTheme(id)`, `updateCustomTheme(id, partial)` 액션 추가
3. `ThemeList.tsx`에 "Duplicate & Edit" 버튼 추가 (context menu 또는 hover action)

---

### 구현 순서 요약

```
Step 1  테마 데이터 인프라 (P0)
  ├── Step 2  실시간 적용 (P0)
  ├── Step 3  설정 패널 UI (P0)
  │     └── Step 4  .itermcolors 임포트 (P0)
  └── Step 5  커스텀 테마 에디터 (P1)
```

Step 1은 모든 후속 작업의 기반이다. Step 2는 Step 1 직후 바로 구현 가능하다. Step 3(UI)은 Step 1과 병행 가능하나, 테마 데이터 구조에 의존하므로 Step 1 이후 착수를 권장한다. Step 4는 Step 3의 UI에 버튼을 추가하는 형태이므로 Step 3 이후가 자연스럽다. Step 5는 독립적으로 이후 진행한다.

---

## 6. 관련 파일 목록

### 수정 대상 (기존 파일)

| 파일 | 변경 내용 |
|------|-----------|
| `src/renderer/src/hooks/useTerminal.ts` | 하드코딩 테마 제거, store에서 테마 가져오기, 테마 변경 구독 |
| `src/renderer/src/stores/layoutStore.ts` | `SidebarPanel` 타입에 `'settings'` 추가 |
| `src/renderer/src/components/layout/ActivityBar.tsx` | 설정 아이콘 추가 |
| `src/renderer/src/components/layout/Sidebar.tsx` | `activePanel === 'settings'` 분기 추가 |
| `src/preload/index.ts` | `theme` API 추가 (`importItermcolors`) |
| `src/preload/index.d.ts` | `ThemeAPI` 인터페이스 추가 |
| `src/main/index.ts` | `registerThemeHandlers()` 호출 추가 |

### 신규 생성

| 파일 | 용도 |
|------|------|
| `src/renderer/src/themes/types.ts` | `TerminalThemeDefinition`, `TerminalThemeColors` 타입 |
| `src/renderer/src/themes/terminalPresets.ts` | 12개 내장 프리셋 테마 데이터 |
| `src/renderer/src/stores/terminalThemeStore.ts` | 터미널 테마 Zustand store |
| `src/renderer/src/components/settings/SettingsPanel.tsx` | 설정 패널 컨테이너 |
| `src/renderer/src/components/settings/ThemeList.tsx` | 테마 목록 + 검색 + 선택 UI |
| `src/renderer/src/components/settings/ThemePreview.tsx` | ANSI 색상 미리보기 |
| `src/renderer/src/components/settings/ThemeEditor.tsx` | 커스텀 테마 편집 (P1) |
| `src/main/services/itermcolorsParser.ts` | .itermcolors XML plist 파서 |
| `src/main/ipc/themeHandlers.ts` | 테마 관련 IPC 핸들러 |

---

## 7. 제약사항 및 리스크

### 기술적 제약

| 제약 | 영향 | 완화 방안 |
|------|------|-----------|
| xterm.js `terminal.options.theme`은 이미 출력된 ANSI 하드코딩 색상을 변경하지 않음 | 테마 변경 시 기존 출력 일부가 이전 색상으로 남을 수 있음 | 이는 xterm.js의 정상 동작이며, 새 출력부터 새 테마 적용. UX 문제가 크면 `terminal.clear()` 옵션을 제공 |
| Renderer 프로세스에서 파일 시스템 직접 접근 불가 | .itermcolors 파싱을 Renderer에서 할 수 없음 | Main process에서 파싱하고 IPC로 결과 전달 |
| `<input type="color">`의 OS별 색상 피커 차이 | macOS/Windows에서 UI가 다르게 보임 | macOS 우선 개발이므로 현 시점에서 문제없음 |
| electron-store 동기/비동기 접근 | store에서 테마 로딩 시 초기 깜빡임 가능 | 앱 시작 시 store에서 테마를 먼저 로딩하고 터미널을 생성하도록 순서 보장 |

### 리스크 및 완화

| 리스크 | 발생 확률 | 영향 | 완화 |
|--------|-----------|------|------|
| .itermcolors 파일의 다양한 Color Space 대응 미흡 | 중간 | 낮음 | sRGB 기준으로 처리하고 범위 외 값은 클램핑 |
| 프리셋 테마 색상의 정확도 (원본과 미세 차이) | 낮음 | 낮음 | 공식 테마 리포지토리에서 정확한 색상값 참조 |
| 설정 패널 도입으로 기존 Sidebar 로직 복잡도 증가 | 낮음 | 중간 | `activePanel` 타입 확장만으로 처리 가능한 구조 |
| 테마 변경 시 성능 부하 (여러 터미널 동시 업데이트) | 낮음 | 낮음 | `terminal.options.theme` setter는 경량 연산 |

---

## 8. 비기능 요구사항

### 성능

- 테마 전환 시 모든 터미널 업데이트가 16ms(1프레임) 이내 완료되어야 한다.
- .itermcolors 파싱은 100ms 이내에 완료되어야 한다.
- 프리셋 테마 데이터는 번들 크기 증가량 5KB 미만이어야 한다.

### 저장

- 테마 설정은 electron-store에 즉시 저장한다 (debounce 불필요, 변경 빈도 낮음).
- 임포트된 테마 데이터는 원본 파일이 삭제되어도 유지된다 (파일 참조가 아닌 색상값 저장).

### 접근성

- 테마 목록의 각 항목은 키보드(Arrow Up/Down)로 탐색 가능하다.
- 선택된 테마 항목에 `aria-selected="true"` 속성을 적용한다.
- 색상 미리보기에 충분한 대비(contrast ratio 4.5:1 이상)가 확보되지 않는 테마의 경우, 경고 아이콘을 표시한다 (P2, 선택사항).

---

## 9. 향후 확장 고려사항 (OUT of scope, 참고용)

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 테마 내보내기 | 커스텀 테마를 `.itermcolors` 형식으로 export | P2 |
| 터미널 폰트 설정 | font family, size, line height 커스터마이즈 | P2 |
| 앱 전체 테마 연동 | 터미널 테마 변경 시 에디터/사이드바 테마도 연동 변경 | P2 |
| 다크/라이트 자동 전환 | OS 다크 모드 설정에 따라 테마 자동 전환 | P2 |
| 온라인 테마 갤러리 | 커뮤니티 테마를 검색/다운로드 | P3 |
| Windows Terminal themes.json 임포트 | Windows Terminal 테마 형식 지원 | P2 (크로스 플랫폼 확장 시) |

---

## 10. 요약

| Step | 기능 | 우선순위 | 난이도 | 핵심 변경 |
|------|------|----------|--------|-----------|
| 1 | 테마 데이터 인프라 | P0 | 낮음 | types, presets, store, useTerminal 리팩토링 |
| 2 | 실시간 적용 | P0 | 낮음 | useTerminal에 테마 변경 구독 추가 |
| 3 | 설정 패널 UI | P0 | 중간 | ActivityBar + Sidebar + SettingsPanel + ThemeList + Preview |
| 4 | .itermcolors 임포트 | P0 | 중간 | XML plist 파서 + IPC + UI 연결 |
| 5 | 커스텀 테마 에디터 | P1 | 중간~높음 | 색상 피커 20개 + Duplicate & Edit + Save |

P0(Step 1~4)을 먼저 완료하여 사용자에게 프리셋 선택 + 외부 테마 임포트 기능을 제공하고, P1(Step 5)으로 세밀한 커스터마이즈를 후속 지원한다.
