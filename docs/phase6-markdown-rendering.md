# Phase 6: 마크다운 렌더링 강화

## 1. 개요

### 목표
Merminal의 WYSIWYG 마크다운 에디터에서 현재 지원하지 않는 고급 마크다운 요소들을 렌더링하여, 외부 프리뷰 도구 없이도 문서의 최종 형태를 에디터 내에서 바로 확인할 수 있도록 한다.

### 범위
| 구분 | 내용 |
|------|------|
| IN scope | 수식(KaTeX), 이미지 미리보기, 체크박스 토글, GFM 테이블, Mermaid 다이어그램, 각주 |
| OUT of scope | 테이블 셀 편집 GUI, 수식 입력 자동완성, Mermaid 편집 GUI, 이미지 업로드/리사이즈, 각주 팝오버 미리보기 |

### 현재 상태
`markdownDecorations.ts` 단일 파일에 모든 WYSIWYG 데코레이션 로직이 포함되어 있다. `buildDecorations()` 함수가 `syntaxTree`를 순회하며 Lezer 마크다운 파서 노드에 대해 `Decoration.replace`, `Decoration.mark`, `Decoration.line`을 적용하는 구조이다. 체크박스(`CheckboxWidget`)와 수평선(`HorizontalRuleWidget`)이 `WidgetType` 기반으로 구현되어 있다.

### 기존 Smart Hiding 규칙
커서가 해당 마크다운 요소의 영역(줄 단위) 안에 있으면 원본 마크업을 표시하고, 커서가 벗어나면 렌더링된 형태만 표시한다. 이 규칙은 Phase 6의 모든 신규 요소에도 동일하게 적용한다.

---

## 2. 기능 목록

### F-01: 수식 렌더링 (KaTeX)

**우선순위**: P0 (필수)

| 항목 | 내용 |
|------|------|
| 현재 상태 | `$...$` 와 `$$...$$` 가 일반 텍스트로 표시됨 |
| 목표 상태 | 인라인 수식은 본문 흐름 안에서, 블록 수식은 독립 블록으로 KaTeX 렌더링 |
| 트리거 | 문서 내 `$...$` 또는 `$$...$$` 패턴 감지 |

#### 상세 요구사항
- FR-001: 인라인 수식(`$...$`)은 해당 영역을 KaTeX가 렌더링한 HTML로 대체한다 (Widget replacement).
- FR-002: 블록 수식(`$$...$$`)은 전체 블록을 KaTeX가 렌더링한 HTML 위젯으로 대체한다.
- FR-003: KaTeX 렌더링 실패 시(구문 오류) 원본 텍스트를 붉은 테두리(`#9b2226`) 박스 안에 그대로 표시하고, 에러 메시지를 tooltip으로 제공한다.
- FR-004: 인라인 수식의 렌더링 결과는 본문 텍스트와 같은 줄 높이에 맞춘다 (`vertical-align: middle`).
- FR-005: 블록 수식은 가운데 정렬하고, 위아래 `12px` 여백을 둔다.

#### 사용자 시나리오
- **정상 흐름**: 사용자가 `$E = mc^2$`를 입력하고 커서를 다른 줄로 이동하면, 해당 위치에 수식이 렌더링된 형태로 표시된다. 커서를 다시 해당 줄로 이동하면 원본 `$E = mc^2$`가 표시된다.
- **블록 수식**: `$$\n\int_0^\infty e^{-x} dx = 1\n$$`를 입력하면, 커서가 벗어났을 때 수식 블록이 가운데 정렬된 렌더링 결과로 표시된다.
- **에러 케이스**: `$\invalidcmd$` 입력 시 빨간 테두리 박스 안에 원본 텍스트가 표시되고, hover 시 KaTeX 에러 메시지가 tooltip으로 나타난다.

#### 수용 기준
- AC-001: Given 인라인 수식 `$x^2$`이 있을 때, When 커서가 해당 줄 밖에 있으면, Then KaTeX 렌더링된 수식이 인라인으로 표시된다.
- AC-002: Given 블록 수식 `$$...$$`이 있을 때, When 커서가 블록 밖에 있으면, Then 가운데 정렬된 수식 블록이 표시된다.
- AC-003: Given 잘못된 수식 `$\bad$`이 있을 때, When 렌더링을 시도하면, Then 에러 스타일(붉은 테두리)로 원본 텍스트가 표시된다.

#### Smart Hiding 동작
- 인라인: 커서가 `$...$`를 포함한 줄에 있으면 원본 마크업 표시
- 블록: 커서가 `$$` 시작줄 ~ `$$` 종료줄 범위 안에 있으면 원본 마크업 표시

---

### F-02: 이미지 미리보기

**우선순위**: P0 (필수)

| 항목 | 내용 |
|------|------|
| 현재 상태 | `![alt](url)` 이 `🖼 image` 아이콘 텍스트로 축약됨 |
| 목표 상태 | 실제 이미지를 인라인 또는 블록으로 프리뷰 |
| 트리거 | `Image` 노드 감지 |

#### 상세 요구사항
- FR-006: 이미지 URL이 로컬 파일 경로인 경우(`./`, `/`, 상대경로) 현재 편집 중인 파일의 디렉토리를 기준으로 절대 경로를 해석하고, `file://` 프로토콜로 로드한다.
- FR-007: 이미지 URL이 `http://` 또는 `https://`인 경우 해당 URL에서 직접 로드한다.
- FR-008: 이미지의 최대 너비는 에디터 콘텐츠 영역의 100% (`max-width: 100%`)로 제한하고, `max-height: 400px`를 적용한다.
- FR-009: 이미지 로드 실패 시 기존 `🖼 image` 아이콘 텍스트로 fallback하되, alt 텍스트가 있으면 `🖼 {alt text}` 형태로 표시한다.
- FR-010: 이미지 위젯에 `border-radius: 4px`와 `box-shadow: 0 1px 3px rgba(0,0,0,0.1)` 스타일을 적용한다.
- FR-011: 이미지 아래에 alt 텍스트가 있으면 캡션으로 표시한다 (`color: #7a7a7a`, `font-size: 0.85em`, 가운데 정렬).

#### 사용자 시나리오
- **로컬 이미지**: `![screenshot](./images/demo.png)` 입력 후 커서를 이동하면, 에디터 내에 해당 이미지가 프리뷰로 표시된다.
- **원격 이미지**: `![logo](https://example.com/logo.png)` 입력 시 해당 URL의 이미지가 표시된다.
- **로드 실패**: 존재하지 않는 경로 `![사진](./없는파일.png)` 입력 시 `🖼 사진` 텍스트가 표시된다.

#### 수용 기준
- AC-004: Given 유효한 로컬 이미지 경로가 있을 때, When 커서가 해당 줄 밖에 있으면, Then 이미지가 max-width 100%, max-height 400px 내에서 프리뷰로 표시된다.
- AC-005: Given 유효한 원격 이미지 URL이 있을 때, When 커서가 해당 줄 밖에 있으면, Then 이미지가 프리뷰로 표시된다.
- AC-006: Given 이미지 로드에 실패했을 때, Then `🖼 {alt}` 텍스트로 fallback 표시된다.
- AC-007: Given alt 텍스트가 존재할 때, Then 이미지 아래에 캡션이 표시된다.

#### Smart Hiding 동작
- 커서가 `![alt](url)` 가 있는 줄에 위치하면 원본 마크업 표시
- 커서가 벗어나면 이미지 프리뷰 위젯으로 대체

#### 보안 고려사항
- 로컬 이미지 로드 시 `file://` 프로토콜을 사용하므로, Electron의 `webSecurity` 설정에서 로컬 파일 접근이 허용되어야 한다. 현재 Electron 설정에서 `contextIsolation: true` + `nodeIntegration: false`를 유지하면서, `protocol.registerFileProtocol` 또는 CSP 설정으로 이미지 경로만 허용하는 방식을 권장한다.

---

### F-03: 체크박스 토글

**우선순위**: P0 (필수)

| 항목 | 내용 |
|------|------|
| 현재 상태 | `- [ ]` / `- [x]` 가 체크박스로 표시되지만 `disabled` |
| 목표 상태 | 클릭하면 `[ ]` <-> `[x]` 토글, 문서 내용에 반영 |
| 트리거 | 체크박스 위젯 클릭 |

#### 상세 요구사항
- FR-012: `CheckboxWidget`에서 `disabled` 속성을 제거하고, 클릭 이벤트 핸들러를 추가한다.
- FR-013: 체크박스 클릭 시 해당 `TaskMarker` 노드의 텍스트를 `[ ]` <-> `[x]`로 토글하는 트랜잭션을 EditorView에 dispatch한다.
- FR-014: 체크박스 토글은 `onChange` 콜백을 통해 editorStore에 반영되어야 한다 (isDirty 상태 갱신).
- FR-015: 완료된 체크박스(`[x]`)의 뒤에 오는 텍스트에 `text-decoration: line-through; color: #7a7a7a` 스타일을 적용한다.
- FR-016: 체크박스 위젯의 크기는 `14px x 14px`, accent 색상(`#588157`)으로 체크 표시를 렌더링한다.

#### 사용자 시나리오
- **정상 흐름**: `- [ ] 할 일` 입력 후 커서를 이동하면 체크박스가 표시된다. 체크박스를 클릭하면 문서 내용이 `- [x] 할 일`로 변경되고, 텍스트에 취소선이 적용된다.
- **되돌리기**: 체크된 항목을 다시 클릭하면 `- [ ] 할 일`로 복원되고, 취소선이 제거된다.

#### 수용 기준
- AC-008: Given `- [ ] task`가 있을 때, When 체크박스를 클릭하면, Then 문서 내용이 `- [x] task`로 변경된다.
- AC-009: Given `- [x] task`가 있을 때, When 체크박스를 클릭하면, Then 문서 내용이 `- [ ] task`로 변경된다.
- AC-010: Given 체크박스 토글이 발생했을 때, Then editorStore의 해당 탭 `isDirty`가 `true`로 설정된다.
- AC-011: Given `- [x] task`가 있을 때, Then task 텍스트에 취소선과 회색 색상이 적용된다.

#### Smart Hiding 동작
- 기존과 동일: 커서가 TaskMarker 줄에 있으면 원본 `[ ]`/`[x]` 마크업 표시, 밖이면 체크박스 위젯 표시
- 체크박스 클릭 시에는 Smart Hiding과 무관하게 즉시 토글 반영

#### 기술적 고려사항
- `CheckboxWidget`에 `EditorView` 참조를 전달해야 한다. 현재 `WidgetType`은 `toDOM()`만 제공하므로, 생성자에서 view 참조와 문서 내 위치(from, to)를 받아야 한다.
- `Decoration.replace`로 교체된 위젯 내부의 클릭 이벤트가 CodeMirror의 포커스/선택 동작과 충돌하지 않도록 `event.stopPropagation()`과 `event.preventDefault()`를 적용한다.

---

### F-04: 테이블 렌더링

**우선순위**: P1 (높음)

| 항목 | 내용 |
|------|------|
| 현재 상태 | GFM 테이블 마크업이 일반 텍스트로 표시됨 |
| 목표 상태 | 시각적인 테이블로 렌더링 (보더, 정렬, 헤더 구분) |
| 트리거 | `Table` 노드 감지 (@lezer/markdown GFM 확장) |

#### 상세 요구사항
- FR-017: `@lezer/markdown`의 GFM 확장(`Table`, `TableHeader`, `TableRow`, `TableCell`, `TableDelimiter`)을 마크다운 파서에 활성화한다. 현재 `useCodeMirror.ts`에서 `markdown()` 호출 시 GFM extension을 추가해야 한다.
- FR-018: 커서가 테이블 밖에 있을 때, 테이블 전체를 `<table>` 기반 HTML 위젯으로 대체한다.
- FR-019: 렌더링된 테이블 스타일:
  - 테두리: `1px solid #b8b2a1` (border 색상)
  - 헤더 행: 배경 `#cfc9b8` (bg-secondary), `font-weight: 600`
  - 본문 행: 배경 `transparent`, 호버 시 `rgba(88, 129, 87, 0.08)`
  - 셀 패딩: `6px 12px`
  - 정렬: 구분선의 `:` 위치에 따라 `text-align: left|center|right` 적용
- FR-020: 테이블 위젯은 에디터 콘텐츠 영역의 최대 너비(`max-width: 100%`)를 넘지 않으며, 넘을 경우 가로 스크롤을 제공한다 (`overflow-x: auto`).

#### 사용자 시나리오
- **정상 흐름**: GFM 테이블을 입력하고 커서를 테이블 밖으로 이동하면, 보더와 정렬이 적용된 시각적 테이블이 표시된다.
- **정렬**: `|:---:|`(가운데), `|---:|`(오른쪽) 구분선 정보에 따라 셀 내용이 정렬된다.
- **편집**: 커서를 테이블 영역으로 이동하면 원본 마크업이 표시되어 직접 편집할 수 있다.

#### 수용 기준
- AC-012: Given GFM 테이블 마크업이 있을 때, When 커서가 테이블 밖에 있으면, Then 보더와 헤더 구분이 있는 HTML 테이블이 표시된다.
- AC-013: Given 구분선에 정렬 지시자(`:`)가 있을 때, Then 해당 열의 셀이 지정된 방향으로 정렬된다.
- AC-014: Given 테이블 너비가 콘텐츠 영역을 초과할 때, Then 가로 스크롤이 제공된다.

#### Smart Hiding 동작
- 테이블은 여러 줄에 걸치므로, 커서가 테이블의 첫 줄 ~ 마지막 줄 범위 안에 있으면 전체 원본 마크업 표시
- 커서가 테이블 밖으로 벗어나면 HTML 테이블 위젯으로 전체 대체

#### 기술적 고려사항
- `@lezer/markdown`에 GFM 테이블 파서 extension을 추가해야 한다. `useCodeMirror.ts`의 `markdown()` 호출 시 `extensions` 옵션을 통해 GFM을 활성화한다.
- 테이블이 큰 경우 (10행 이상) 위젯 생성 비용이 커질 수 있으므로, DOM 생성을 최적화한다.

---

### F-05: Mermaid 다이어그램

**우선순위**: P2 (보통)

| 항목 | 내용 |
|------|------|
| 현재 상태 | ` ```mermaid ` 코드블록이 일반 코드블록(배경 + 텍스트)으로 표시됨 |
| 목표 상태 | Mermaid 구문을 파싱하여 SVG 다이어그램으로 렌더링 |
| 트리거 | `FencedCode` 노드의 언어가 `mermaid`인 경우 |

#### 상세 요구사항
- FR-021: `FencedCode` 노드에서 `CodeInfo` 자식 노드의 텍스트가 `mermaid`(대소문자 무시)일 때, 해당 코드블록을 Mermaid 렌더링 대상으로 식별한다.
- FR-022: 커서가 코드블록 밖에 있을 때, 코드 내용을 Mermaid 라이브러리로 렌더링한 SVG 위젯으로 대체한다.
- FR-023: Mermaid 렌더링 실패 시(구문 오류) 기존 코드블록 스타일을 유지하되, 상단에 빨간색 에러 배너(`background: rgba(155, 34, 38, 0.1); color: #9b2226; padding: 4px 8px; font-size: 0.85em`)를 추가하고 에러 메시지를 표시한다.
- FR-024: SVG 다이어그램의 최대 너비는 콘텐츠 영역 100%, 배경은 `#f5f3ed` (bg-primary보다 약간 밝은 톤), `border-radius: 6px`, `padding: 16px`를 적용한다.
- FR-025: Mermaid 테마를 프로젝트 색상 체계에 맞춘다 (`theme: 'base'`, `themeVariables` 커스터마이즈).

#### 사용자 시나리오
- **정상 흐름**: ` ```mermaid\ngraph TD\n  A --> B\n``` ` 입력 후 커서를 이동하면 flowchart SVG가 표시된다.
- **에러**: 잘못된 Mermaid 구문 입력 시 에러 배너와 함께 원본 코드가 표시된다.
- **편집**: 커서를 코드블록으로 이동하면 원본 Mermaid 코드를 편집할 수 있다.

#### 수용 기준
- AC-015: Given 유효한 Mermaid 코드블록이 있을 때, When 커서가 블록 밖에 있으면, Then SVG 다이어그램이 표시된다.
- AC-016: Given 잘못된 Mermaid 구문일 때, Then 에러 배너와 원본 코드가 함께 표시된다.
- AC-017: Given Mermaid 다이어그램이 렌더링되었을 때, Then 프로젝트 색상 테마가 적용되어 있다.

#### Smart Hiding 동작
- `FencedCode` 전체 범위(` ``` ` 시작 ~ ` ``` ` 종료)를 기준으로 판단
- 커서가 범위 안이면 원본 Mermaid 코드 표시, 밖이면 SVG 위젯으로 대체

#### 성능 고려사항
- Mermaid 렌더링은 비용이 높으므로 debounce (300ms)를 적용한다.
- 렌더링 결과를 캐싱하여 코드 내용이 변경되지 않은 경우 재렌더링하지 않는다.
- Mermaid 라이브러리는 lazy import하여 초기 로딩 시간에 영향을 주지 않도록 한다.

---

### F-06: 각주

**우선순위**: P2 (보통)

| 항목 | 내용 |
|------|------|
| 현재 상태 | `[^1]` 참조와 `[^1]: 설명` 정의가 일반 텍스트로 표시됨 |
| 목표 상태 | 참조는 윗첨자 번호로, 정의는 구분된 블록으로 렌더링 |
| 트리거 | 각주 참조/정의 패턴 감지 |

#### 상세 요구사항
- FR-026: 각주 참조 `[^id]`를 윗첨자 스타일의 번호 링크로 렌더링한다 (`font-size: 0.75em; vertical-align: super; color: #588157; cursor: pointer`).
- FR-027: 각주 정의 `[^id]: 내용`을 구분된 블록으로 렌더링한다 (`border-top: 1px solid #b8b2a1; padding-top: 8px; font-size: 0.9em; color: #4a4a4a`).
- FR-028: 각주 참조를 클릭하면 해당 각주 정의 위치로 에디터가 스크롤된다.
- FR-029: 각주는 문서 내 등장 순서대로 자동 번호를 매긴다 (작성된 `id`와 무관하게 1, 2, 3...).
- FR-030: `@lezer/markdown`의 기본 파서는 각주를 인식하지 않으므로, 정규식 기반 커스텀 파싱 로직을 `markdownDecorations` 내에 구현한다.

#### 사용자 시나리오
- **정상 흐름**: 본문에 `중요한 내용[^1]`을 작성하고, 문서 하단에 `[^1]: 참고 문헌 링크`를 작성한다. 커서가 벗어나면 `[^1]`은 윗첨자 `1`로, 정의는 구분선 아래 블록으로 표시된다.
- **클릭 이동**: 윗첨자 번호를 클릭하면 해당 각주 정의 위치로 스크롤된다.

#### 수용 기준
- AC-018: Given 각주 참조 `[^note]`가 있을 때, When 커서가 해당 줄 밖에 있으면, Then 윗첨자 번호가 표시된다.
- AC-019: Given 각주 정의 `[^note]: 설명`이 있을 때, When 커서가 해당 줄 밖에 있으면, Then 구분된 블록 스타일로 표시된다.
- AC-020: Given 윗첨자 번호를 클릭했을 때, Then 에디터가 해당 각주 정의 위치로 스크롤된다.

#### Smart Hiding 동작
- 각주 참조: 커서가 `[^id]`를 포함한 줄에 있으면 원본 표시
- 각주 정의: 커서가 `[^id]: ...` 줄에 있으면 원본 표시

---

## 3. 구현 단계

### Step 1: 인프라 및 파서 준비
**대상**: 모듈 분리, GFM 파서 활성화, 패키지 설치

| 항목 | 내용 |
|------|------|
| 작업 | `markdownDecorations.ts`를 모듈 디렉토리로 분리, GFM extension 활성화, KaTeX/Mermaid 패키지 설치 |
| 의존성 | 없음 (기반 작업) |
| 난이도 | 낮음 |

### Step 2: 체크박스 토글 (F-03)
**대상**: 기존 `CheckboxWidget` 수정

| 항목 | 내용 |
|------|------|
| 작업 | `CheckboxWidget`에 view 참조 전달, 클릭 핸들러 구현, 완료 항목 스타일 |
| 의존성 | Step 1 (모듈 분리) |
| 난이도 | 낮음 |

### Step 3: 이미지 미리보기 (F-02)
**대상**: 기존 `Image` 렌더링 교체

| 항목 | 내용 |
|------|------|
| 작업 | `ImagePreviewWidget` 구현, 로컬/원격 경로 해석, fallback 처리 |
| 의존성 | Step 1 |
| 난이도 | 중간 (Electron 파일 프로토콜 설정 필요) |

### Step 4: 수식 렌더링 (F-01)
**대상**: KaTeX 통합

| 항목 | 내용 |
|------|------|
| 작업 | 인라인/블록 수식 패턴 감지, `KaTeXWidget` 구현, 에러 핸들링 |
| 의존성 | Step 1, KaTeX 패키지 |
| 난이도 | 중간 (커스텀 파싱 필요 - Lezer가 `$` 구문을 기본 지원하지 않음) |

### Step 5: 테이블 렌더링 (F-04)
**대상**: GFM 테이블 시각화

| 항목 | 내용 |
|------|------|
| 작업 | `TableWidget` 구현, 정렬 파싱, 테이블 스타일링 |
| 의존성 | Step 1 (GFM 파서 활성화) |
| 난이도 | 중간 |

### Step 6: Mermaid 다이어그램 (F-05)
**대상**: Mermaid SVG 렌더링

| 항목 | 내용 |
|------|------|
| 작업 | Mermaid lazy import, `MermaidWidget` 구현, 캐싱, 에러 핸들링 |
| 의존성 | Step 1, Mermaid 패키지 |
| 난이도 | 높음 (비동기 렌더링, 캐싱, 성능 최적화) |

### Step 7: 각주 (F-06)
**대상**: 각주 참조/정의 렌더링

| 항목 | 내용 |
|------|------|
| 작업 | 정규식 기반 각주 파싱, `FootnoteRefWidget` / `FootnoteDefWidget` 구현, 클릭 스크롤 |
| 의존성 | Step 1 |
| 난이도 | 중간 (커스텀 파싱, 문서 전체 스캔 필요) |

### 구현 순서 요약

```
Step 1  인프라 준비
  ├── Step 2  체크박스 토글 (P0, 낮음)
  ├── Step 3  이미지 미리보기 (P0, 중간)
  ├── Step 4  수식 렌더링 (P0, 중간)
  ├── Step 5  테이블 렌더링 (P1, 중간)
  ├── Step 6  Mermaid 다이어그램 (P2, 높음)
  └── Step 7  각주 (P2, 중간)
```

Step 2~4는 P0이므로 우선 구현하며, Step 5는 GFM 파서가 Step 1에서 활성화되면 바로 착수 가능하다. Step 6과 7은 독립적으로 순서 변경 가능하다.

---

## 4. 기술 설계

### 4.1 모듈 구조

현재 `markdownDecorations.ts` 단일 파일(약 360줄)에 모든 데코레이션 로직이 들어있다. Phase 6에서 6개 기능이 추가되면 파일이 지나치게 비대해지므로, 다음과 같이 모듈화한다.

```
src/renderer/src/components/editor/
├── markdownDecorations.ts          # 기존 파일 → 핵심 인프라 + 플러그인 등록
├── decorations/
│   ├── index.ts                    # 모든 데코레이션 모듈 re-export
│   ├── types.ts                    # 공유 타입 정의
│   ├── base.ts                     # 기존 데코레이션 (heading, bold, italic 등)
│   ├── checkbox.ts                 # F-03: 체크박스 토글
│   ├── image.ts                    # F-02: 이미지 미리보기
│   ├── math.ts                     # F-01: 수식 렌더링
│   ├── table.ts                    # F-04: 테이블 렌더링
│   ├── mermaid.ts                  # F-05: Mermaid 다이어그램
│   └── footnote.ts                 # F-06: 각주
```

### 4.2 핵심 인터페이스

```typescript
// decorations/types.ts

import { EditorView, Decoration } from '@codemirror/view'
import { Range } from '@codemirror/state'
import { SyntaxNode } from '@lezer/common'

/** 각 데코레이션 모듈이 구현하는 인터페이스 */
export interface DecorationHandler {
  /** 이 핸들러가 처리할 수 있는 노드인지 판단 */
  canHandle(node: SyntaxNode, view: EditorView): boolean

  /** 데코레이션 Range 배열을 반환 */
  createDecorations(
    node: SyntaxNode,
    view: EditorView,
    isActive: boolean
  ): Range<Decoration>[]
}

/** 정규식 기반 커스텀 파싱이 필요한 핸들러 (수식, 각주) */
export interface RegexDecorationHandler {
  /** 문서 텍스트에서 직접 패턴을 찾아 데코레이션 생성 */
  createDecorationsFromText(
    text: string,
    from: number,
    to: number,
    view: EditorView
  ): Range<Decoration>[]
}
```

### 4.3 markdownDecorations.ts 리팩토링 방향

`buildDecorations()` 함수 내 `syntaxTree.iterate()` 콜백에서 각 노드 타입별 분기를 `DecorationHandler.canHandle()` 호출로 대체한다.

```typescript
// markdownDecorations.ts (리팩토링 후 의사코드)

import { baseHandlers } from './decorations/base'
import { checkboxHandler } from './decorations/checkbox'
import { imageHandler } from './decorations/image'
import { mathHandler } from './decorations/math'
import { tableHandler } from './decorations/table'
import { mermaidHandler } from './decorations/mermaid'
import { footnoteHandler } from './decorations/footnote'

const handlers: DecorationHandler[] = [
  ...baseHandlers,
  checkboxHandler,
  imageHandler,
  tableHandler,
  mermaidHandler,
]

const regexHandlers: RegexDecorationHandler[] = [
  mathHandler,
  footnoteHandler,
]

function buildDecorations(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = []

  // 1. 구문 트리 기반 데코레이션
  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from, to,
      enter(node) {
        const isActive = cursorInRange(view, node.from, node.to)
        for (const handler of handlers) {
          if (handler.canHandle(node.node, view)) {
            decorations.push(...handler.createDecorations(node.node, view, isActive))
            break
          }
        }
      }
    })
  }

  // 2. 정규식 기반 데코레이션 (수식, 각주)
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to)
    for (const handler of regexHandlers) {
      decorations.push(...handler.createDecorationsFromText(text, from, to, view))
    }
  }

  return Decoration.set(decorations, true)
}
```

### 4.4 GFM 파서 활성화

`useCodeMirror.ts`에서 마크다운 언어 설정 시 GFM 확장을 추가한다.

```typescript
// useCodeMirror.ts 변경 포인트

import { GFM } from '@lezer/markdown'

// markdown() 호출 시:
markdown({
  base: markdownLanguage,
  codeLanguages: languages,
  extensions: [GFM]  // Table, Strikethrough, TaskList 노드 활성화
})
```

현재 `Strikethrough`과 `TaskMarker` 노드가 이미 데코레이션에서 사용되고 있는데, `@lezer/markdown`의 `markdownLanguage`에 이미 일부 GFM이 포함되어 있거나 별도 설정이 되어 있을 수 있다. GFM 확장을 명시적으로 추가할 때 기존 동작이 중복되지 않는지 확인이 필요하다.

### 4.5 수식 파싱 전략

`@lezer/markdown`은 `$...$` 수식 구문을 기본 지원하지 않는다. 두 가지 접근법이 있다.

| 방법 | 장점 | 단점 |
|------|------|------|
| A. 정규식 기반 (RegexDecorationHandler) | 구현 간단, 파서 독립적 | 마크다운 구문 내부의 `$` (코드블록 등)와 충돌 가능 |
| B. @lezer/markdown 커스텀 extension | 파서 수준에서 정확한 토큰화 | 구현 복잡도 높음 |

**권장**: 방법 A를 기본으로 하되, 코드블록/인라인코드 영역을 제외하는 로직을 추가한다. 정규식 매칭 후 해당 위치가 `FencedCode` 또는 `InlineCode` 노드 범위에 속하는지 syntaxTree로 확인하여 필터링한다.

인라인 수식 정규식: `/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g`
블록 수식 정규식: `/\$\$([\s\S]+?)\$\$/g`

### 4.6 Mermaid 비동기 렌더링 전략

Mermaid의 `render()` 함수는 비동기이고, CodeMirror의 `buildDecorations()`는 동기여야 한다. 이를 해결하기 위한 전략:

1. 초기 상태: Mermaid 코드블록에 "로딩 중" placeholder 위젯을 표시한다.
2. 백그라운드 렌더링: `requestIdleCallback` 또는 `setTimeout(0)`으로 Mermaid 렌더링을 비동기 실행한다.
3. 캐시 업데이트: 렌더링 결과(SVG 문자열)를 `Map<string, string>` 캐시에 저장한다. 키는 Mermaid 코드의 해시값.
4. 강제 업데이트: 캐시 업데이트 후 `view.dispatch({ effects: ... })`로 데코레이션 재계산을 트리거한다.
5. 이후 동일 코드 감지 시 캐시에서 즉시 SVG를 반환한다.

### 4.7 이미지 로컬 경로 해석

현재 에디터는 `editorStore`에서 `filePath`를 관리한다. 이미지의 상대 경로를 해석하려면 현재 편집 중인 파일의 디렉토리 경로가 필요하다.

방법: `ImagePreviewWidget` 생성 시 현재 탭의 `filePath`를 전달하고, 위젯 내부에서 `path.dirname(filePath)` + 상대 경로로 절대 경로를 계산한다. Renderer 프로세스에서 `path` 모듈을 직접 사용할 수 없으므로, 간단한 경로 조합 유틸리티 함수를 구현하거나 preload API를 통해 경로를 해석한다.

---

## 5. UI/UX 고려사항

### 5.1 각 요소별 렌더링 스타일

| 요소 | 렌더링 스타일 | 색상/크기 |
|------|---------------|-----------|
| 인라인 수식 | KaTeX 인라인 렌더링 | 본문 텍스트와 동일 크기, `color: #2d2d2d` |
| 블록 수식 | KaTeX 블록 렌더링, 가운데 정렬 | 본문보다 약간 큰 크기, 위아래 `12px` 여백 |
| 수식 에러 | 원본 텍스트 + 붉은 테두리 | `border: 1px solid #9b2226`, `border-radius: 3px` |
| 이미지 | `<img>` 태그, 그림자 효과 | `max-width: 100%`, `max-height: 400px`, `border-radius: 4px` |
| 이미지 캡션 | 가운데 정렬 텍스트 | `color: #7a7a7a`, `font-size: 0.85em` |
| 체크박스 (미완료) | 커스텀 체크박스 (빈 사각형) | `14px`, `border: 1.5px solid #7a7a7a` |
| 체크박스 (완료) | 커스텀 체크박스 (체크 표시) | `14px`, `background: #588157`, `color: white` |
| 완료 항목 텍스트 | 취소선 + 회색 | `text-decoration: line-through`, `color: #7a7a7a` |
| 테이블 헤더 | 진한 배경, 볼드 | `background: #cfc9b8`, `font-weight: 600` |
| 테이블 셀 | 보더, 패딩 | `border: 1px solid #b8b2a1`, `padding: 6px 12px` |
| Mermaid 다이어그램 | SVG in container | `background: #f5f3ed`, `border-radius: 6px`, `padding: 16px` |
| Mermaid 에러 | 에러 배너 + 코드블록 | 배너: `background: rgba(155,34,38,0.1)`, `color: #9b2226` |
| 각주 참조 | 윗첨자 번호 | `font-size: 0.75em`, `color: #588157`, `cursor: pointer` |
| 각주 정의 | 구분선 + 작은 텍스트 | `border-top: 1px solid #b8b2a1`, `font-size: 0.9em` |

### 5.2 Smart Hiding 동작 일관성

모든 신규 요소는 기존 Smart Hiding 패턴을 따른다:

- **판단 기준**: `cursorInRange(view, from, to)` 함수 사용 (줄 단위 판단)
- **인라인 요소** (수식 인라인, 각주 참조): 해당 요소를 포함한 줄에 커서가 있으면 원본 표시
- **블록 요소** (수식 블록, 테이블, Mermaid, 각주 정의): 블록의 첫 줄 ~ 마지막 줄 범위 내에 커서가 있으면 원본 표시
- **전환 애니메이션**: 없음 (즉시 전환). 기존 동작과 일관성 유지

### 5.3 접근성

- 체크박스: `role="checkbox"`, `aria-checked` 속성 적용
- 이미지: `alt` 텍스트를 `aria-label`로 전달
- 수식: KaTeX의 `aria-label` 자동 생성 기능 활용 (KaTeX 옵션 `output: 'htmlAndMathml'`)
- 테이블: 시맨틱 `<table>`, `<thead>`, `<tbody>` 태그 사용

### 5.4 로딩 상태

- **Mermaid**: "Rendering diagram..." 텍스트와 함께 회색 배경 placeholder 표시 (`color: #7a7a7a`, `font-style: italic`)
- **이미지**: `<img>` 태그의 기본 로딩 동작을 사용하되, `loading="lazy"` 속성을 적용하여 뷰포트 밖 이미지는 지연 로드

---

## 6. 성능 고려사항

### 6.1 대용량 문서 최적화 원칙

| 전략 | 적용 대상 | 설명 |
|------|-----------|------|
| Viewport 제한 | 전체 | CodeMirror의 `view.visibleRanges`만 처리 (기존 동작 유지) |
| 위젯 캐싱 | Mermaid, 수식 | 동일 입력에 대한 렌더링 결과를 `Map` 캐시에 저장 |
| Debounce | Mermaid | 코드 변경 후 300ms 대기 후 렌더링 |
| Lazy Import | Mermaid, KaTeX | 동적 `import()`로 첫 사용 시에만 로드 |
| 이미지 지연 로드 | 이미지 | `loading="lazy"` 속성으로 뷰포트 밖 이미지 지연 |
| 정규식 최적화 | 수식, 각주 | 전체 문서가 아닌 `visibleRanges`만 스캔 |

### 6.2 벤치마크 목표

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 데코레이션 빌드 시간 (1000줄 문서) | < 16ms (60fps) | `performance.now()` 래핑 |
| Mermaid 렌더링 (단일 다이어그램) | < 500ms | Mermaid render 콜백 타이밍 |
| KaTeX 렌더링 (단일 수식) | < 10ms | `katex.renderToString()` 타이밍 |
| 초기 로딩 증가량 | < 50KB gzipped (KaTeX + Mermaid 제외 시) | 번들 크기 비교 |

### 6.3 대용량 문서 안전장치

- 문서 내 Mermaid 블록이 5개를 초과하면, 뷰포트 밖 블록은 placeholder만 유지하고 렌더링하지 않는다.
- 이미지가 10개를 초과하는 뷰포트에서는 `loading="lazy"`를 강제 적용한다.
- KaTeX 렌더링이 단일 수식에서 50ms를 초과하면, 해당 수식의 캐시를 저장하고 이후 캐시에서만 제공한다.

---

## 7. 패키지 의존성

### 추가할 npm 패키지

| 패키지 | 버전 | 용도 | 번들 크기 (gzipped) | 필요 시점 |
|--------|------|------|---------------------|-----------|
| `katex` | ^0.16 | 수식 렌더링 (F-01) | ~100KB (CSS 포함) | Step 4 |
| `mermaid` | ^11 | 다이어그램 렌더링 (F-05) | ~200KB | Step 6 |

### 이미 포함된 패키지 (추가 불필요)

| 패키지 | 현재 버전 | 용도 |
|--------|-----------|------|
| `@lezer/markdown` | ^1.6.3 | GFM 테이블 파싱 (Table extension 이미 포함) |
| `@codemirror/view` | ^6.39.15 | `WidgetType`, `ViewPlugin`, `Decoration` |
| `@codemirror/lang-markdown` | ^6.5.0 | 마크다운 언어 지원 |

### KaTeX CSS 로딩

KaTeX는 렌더링을 위해 자체 CSS가 필요하다. 두 가지 방법:

| 방법 | 설명 |
|------|------|
| A. CSS import | `main.css`에 `@import 'katex/dist/katex.min.css'` 추가 |
| B. 런타임 주입 | `katex.renderToString()` 결과를 Shadow DOM에 넣고, CSS를 해당 scope에만 적용 |

**권장**: 방법 A. 전역 CSS import가 가장 간단하고, CodeMirror 위젯은 일반 DOM에 삽입되므로 CSS가 자연스럽게 적용된다. KaTeX CSS가 에디터 외부 스타일과 충돌할 가능성은 낮다 (KaTeX 클래스명이 `.katex-` prefix를 사용).

### Mermaid 초기화

Mermaid는 `mermaid.initialize()` 호출이 필요하다. 앱 전체에서 한 번만 호출하도록, lazy import 시 초기화를 함께 수행한다.

```typescript
// decorations/mermaid.ts (초기화 의사코드)
let mermaidReady: Promise<typeof import('mermaid')> | null = null

function getMermaid() {
  if (!mermaidReady) {
    mermaidReady = import('mermaid').then(m => {
      m.default.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          primaryColor: '#588157',
          primaryTextColor: '#2d2d2d',
          primaryBorderColor: '#b8b2a1',
          lineColor: '#4a4a4a',
          secondaryColor: '#cfc9b8',
          tertiaryColor: '#dad7cd'
        }
      })
      return m
    })
  }
  return mermaidReady
}
```

---

## 8. 제약사항 및 리스크

### 기술적 제약

| 제약 | 영향 | 완화 방안 |
|------|------|-----------|
| CodeMirror `buildDecorations()`는 동기 함수 | Mermaid 비동기 렌더링 불가 | 캐시 + 비동기 후처리 패턴 (4.6 참조) |
| `@lezer/markdown`에 수식 구문 미지원 | 수식을 파서 트리에서 직접 감지 불가 | 정규식 기반 커스텀 파싱 + 코드 영역 제외 필터 |
| Renderer 프로세스에서 `path` 모듈 미사용 | 이미지 상대 경로 해석 불가 | 경로 조합 유틸리티 함수 또는 preload API |
| Electron CSP로 인한 외부 리소스 제한 가능 | 원격 이미지 로드 실패 가능 | CSP `img-src` 허용 설정 확인 |

### 리스크 및 완화

| 리스크 | 발생 확률 | 영향 | 완화 |
|--------|-----------|------|------|
| KaTeX/Mermaid 번들 크기로 초기 로딩 저하 | 높음 | 중간 | dynamic import로 지연 로드 |
| 수식 정규식이 코드 내 `$` 기호와 충돌 | 중간 | 낮음 | syntaxTree로 코드 노드 내부 필터링 |
| GFM 확장 추가 시 기존 Strikethrough/TaskMarker 동작 변경 | 낮음 | 중간 | 추가 전 기존 기능 회귀 테스트 |
| Mermaid 렌더링이 UI 스레드 블로킹 | 중간 | 높음 | Web Worker 이관 또는 debounce + requestIdleCallback |
| 대용량 문서에서 정규식 스캔 성능 저하 | 낮음 | 중간 | visibleRanges 제한, 정규식 최적화 |

---

## 9. 요약

| Step | 기능 | 우선순위 | 난이도 | 핵심 패키지 |
|------|------|----------|--------|-------------|
| 1 | 인프라 (모듈 분리 + GFM 활성화) | - | 낮음 | - |
| 2 | 체크박스 토글 | P0 | 낮음 | - |
| 3 | 이미지 미리보기 | P0 | 중간 | - |
| 4 | 수식 렌더링 | P0 | 중간 | katex |
| 5 | 테이블 렌더링 | P1 | 중간 | - |
| 6 | Mermaid 다이어그램 | P2 | 높음 | mermaid |
| 7 | 각주 | P2 | 중간 | - |

P0 기능(Step 2~4)을 먼저 완료하여 일상적인 마크다운 작성 경험을 개선하고, P1(Step 5)으로 GFM 호환성을 확보한 뒤, P2(Step 6~7)로 고급 기능을 추가하는 순서로 진행한다.
