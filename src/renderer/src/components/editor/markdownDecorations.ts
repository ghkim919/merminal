import {
  ViewPlugin,
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType
} from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import { EditorState, Facet, Range } from '@codemirror/state'
import katex from 'katex'

// Facet to pass the current file path into the editor state
export const filePathFacet = Facet.define<string, string>({
  combine: (values) => values[0] || ''
})

// ── Widgets ────────────────────────────────────────────────

class CheckboxWidget extends WidgetType {
  constructor(
    readonly checked: boolean,
    readonly from: number,
    readonly to: number
  ) {
    super()
  }

  eq(other: CheckboxWidget): boolean {
    return this.checked === other.checked && this.from === other.from
  }

  toDOM(view: EditorView): HTMLElement {
    const el = document.createElement('input')
    el.type = 'checkbox'
    el.checked = this.checked
    el.style.marginRight = '4px'
    el.style.verticalAlign = 'middle'
    el.style.accentColor = '#588157'
    el.style.width = '14px'
    el.style.height = '14px'
    el.style.cursor = 'pointer'
    el.setAttribute('role', 'checkbox')
    el.setAttribute('aria-checked', String(this.checked))

    el.addEventListener('mousedown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const newText = this.checked ? '[ ]' : '[x]'
      view.dispatch({ changes: { from: this.from, to: this.to, insert: newText } })
    })

    return el
  }
}

class HorizontalRuleWidget extends WidgetType {
  eq(): boolean {
    return true
  }

  toDOM(): HTMLElement {
    const el = document.createElement('hr')
    el.style.border = 'none'
    el.style.borderTop = '1px solid #b8b2a1'
    el.style.margin = '8px 0'
    return el
  }
}

class ImagePreviewWidget extends WidgetType {
  constructor(
    readonly src: string,
    readonly alt: string,
    readonly fileDir: string
  ) {
    super()
  }

  eq(other: ImagePreviewWidget): boolean {
    return this.src === other.src && this.fileDir === other.fileDir
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.style.margin = '4px 0'

    const resolvedSrc = this.resolveSrc()

    const img = document.createElement('img')
    img.src = resolvedSrc
    img.alt = this.alt
    img.setAttribute('aria-label', this.alt || 'image')
    img.loading = 'lazy'
    img.style.maxWidth = '100%'
    img.style.maxHeight = '400px'
    img.style.borderRadius = '4px'
    img.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
    img.style.display = 'block'

    img.addEventListener('error', () => {
      wrapper.textContent = ''
      const fallback = document.createElement('span')
      fallback.style.color = '#588157'
      fallback.style.fontSize = '0.85em'
      fallback.textContent = `🖼 ${this.alt || 'image'}`
      fallback.title = this.src
      wrapper.appendChild(fallback)
    })

    wrapper.appendChild(img)

    if (this.alt) {
      const caption = document.createElement('div')
      caption.textContent = this.alt
      caption.style.color = '#7a7a7a'
      caption.style.fontSize = '0.85em'
      caption.style.textAlign = 'center'
      caption.style.marginTop = '4px'
      wrapper.appendChild(caption)
    }

    return wrapper
  }

  private resolveSrc(): string {
    const src = this.src
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      return src
    }
    if (!this.fileDir) return src

    if (src.startsWith('/')) {
      return `file://${src}`
    }
    // Relative path: resolve against file directory
    const dir = this.fileDir.endsWith('/') ? this.fileDir : this.fileDir + '/'
    // Simple relative path resolution (handles ./ and plain relative)
    const cleanSrc = src.startsWith('./') ? src.slice(2) : src
    return `file://${dir}${cleanSrc}`
  }
}

class InlineMathWidget extends WidgetType {
  constructor(
    readonly formula: string
  ) {
    super()
  }

  eq(other: InlineMathWidget): boolean {
    return this.formula === other.formula
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span')
    span.className = 'cm-math-inline'
    try {
      const html = katex.renderToString(this.formula, {
        displayMode: false,
        throwOnError: false,
        output: 'htmlAndMathml'
      })
      span.innerHTML = html
      span.style.verticalAlign = 'middle'
    } catch {
      span.textContent = `$${this.formula}$`
      span.style.border = '1px solid #9b2226'
      span.style.borderRadius = '3px'
      span.style.padding = '0 4px'
      span.style.color = '#9b2226'
    }
    return span
  }
}

class BlockMathWidget extends WidgetType {
  constructor(
    readonly formula: string
  ) {
    super()
  }

  eq(other: BlockMathWidget): boolean {
    return this.formula === other.formula
  }

  toDOM(): HTMLElement {
    const div = document.createElement('div')
    div.className = 'cm-math-block'
    div.style.textAlign = 'center'
    div.style.margin = '4px 0'
    try {
      const html = katex.renderToString(this.formula, {
        displayMode: true,
        throwOnError: false,
        output: 'htmlAndMathml'
      })
      div.innerHTML = html
      // Scale down to 80% to reduce vertical space
      const katexEl = div.querySelector('.katex-display') as HTMLElement | null
      if (katexEl) {
        katexEl.style.margin = '0'
        katexEl.style.fontSize = '0.8em'
      }
    } catch (err) {
      div.textContent = this.formula
      div.style.border = '1px solid #9b2226'
      div.style.borderRadius = '3px'
      div.style.padding = '8px'
      div.style.color = '#9b2226'
      div.title = err instanceof Error ? err.message : 'KaTeX error'
    }
    return div
  }
}

// ── Styles ─────────────────────────────────────────────────

const headingStyles: Record<number, string> = {
  1: 'font-size: 1.8em; font-weight: 700; line-height: 1.3;',
  2: 'font-size: 1.5em; font-weight: 700; line-height: 1.3;',
  3: 'font-size: 1.25em; font-weight: 600; line-height: 1.3;',
  4: 'font-size: 1.1em; font-weight: 600; line-height: 1.3;',
  5: 'font-size: 1em; font-weight: 600; line-height: 1.3;',
  6: 'font-size: 0.9em; font-weight: 600; line-height: 1.3; color: #4a4a4a;'
}

// ── Helpers ────────────────────────────────────────────────

function cursorInRange(view: EditorView, from: number, to: number): boolean {
  const { state } = view
  for (const range of state.selection.ranges) {
    const lineFrom = state.doc.lineAt(from).number
    const lineTo = state.doc.lineAt(to).number
    for (let ln = lineFrom; ln <= lineTo; ln++) {
      const line = state.doc.line(ln)
      if (range.from <= line.to && range.to >= line.from) return true
    }
  }
  return false
}

function getFileDir(filePath: string): string {
  if (!filePath) return ''
  const lastSlash = filePath.lastIndexOf('/')
  return lastSlash >= 0 ? filePath.slice(0, lastSlash) : ''
}

/** Character-level cursor check: is the cursor inside [from, to)? */
function isCursorInside(state: EditorState, from: number, to: number): boolean {
  for (const range of state.selection.ranges) {
    if (range.head >= from && range.head < to) return true
  }
  return false
}

/** Check if a document position is inside a FencedCode or InlineCode node */
function isInsideCode(view: EditorView, pos: number): boolean {
  const tree = syntaxTree(view.state)
  let inside = false
  tree.iterate({
    from: pos,
    to: pos,
    enter(node) {
      if (node.name === 'FencedCode' || node.name === 'InlineCode') {
        inside = true
      }
    }
  })
  return inside
}

// ── Math ───────────────────────────────────────────────────

// Inline: $formula$ — no space adjacent to $, no newlines in content
const INLINE_MATH_RE = /(?<!\$)\$(?!\$|\s)([^\$\n]+?)(?<!\s)\$(?!\$)/g

const mathDelimStyle = Decoration.mark({
  attributes: { style: 'color: #9b2226; font-weight: 600;' }
})

interface MathResult {
  decorations: Range<Decoration>[]
  blockRegions: { from: number; to: number }[]
}

function buildMathDecorations(view: EditorView): MathResult {
  const decorations: Range<Decoration>[] = []
  const { state } = view
  const doc = state.doc

  // Phase 1: Block math ($$...$$) — line-by-line scan (handles multi-line reliably)
  const blockRegions: { from: number; to: number; formula: string }[] = []
  let openLineIdx = -1

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    const trimmed = line.text.trim()

    if (openLineIdx === -1) {
      // Single-line block: $$formula$$
      if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
        const formula = trimmed.slice(2, -2).trim()
        if (!formula) continue
        if (isInsideCode(view, line.from)) continue
        blockRegions.push({ from: line.from, to: line.to, formula })
      }
      // Opening $$ (alone on line, possibly with whitespace)
      else if (trimmed === '$$') {
        openLineIdx = i
      }
    } else {
      // Closing $$
      if (trimmed === '$$') {
        const openLine = doc.line(openLineIdx)
        const closeLine = line

        if (!isInsideCode(view, openLine.from)) {
          const formulaLines: string[] = []
          for (let j = openLineIdx + 1; j < i; j++) {
            formulaLines.push(doc.line(j).text)
          }
          const formula = formulaLines.join('\n').trim()
          if (formula) {
            blockRegions.push({ from: openLine.from, to: closeLine.to, formula })
          }
        }
        openLineIdx = -1
      }
    }
  }

  // Apply block math decorations
  for (const region of blockRegions) {
    const firstLine = doc.lineAt(region.from)
    const lastLine = doc.lineAt(region.to)
    const isMultiLine = firstLine.number !== lastLine.number

    const active = isMultiLine
      ? cursorInRange(view, region.from, region.to)
      : isCursorInside(state, region.from, region.to + 1)

    if (active) {
      // Highlight $$ delimiters in red
      const openIdx = firstLine.text.indexOf('$$')
      const closeIdx = lastLine.text.indexOf('$$')
      if (openIdx >= 0) {
        decorations.push(
          mathDelimStyle.range(firstLine.from + openIdx, firstLine.from + openIdx + 2)
        )
      }
      if (isMultiLine && closeIdx >= 0) {
        decorations.push(
          mathDelimStyle.range(lastLine.from + closeIdx, lastLine.from + closeIdx + 2)
        )
      } else if (!isMultiLine) {
        const lastIdx = firstLine.text.lastIndexOf('$$')
        if (lastIdx > openIdx) {
          decorations.push(
            mathDelimStyle.range(firstLine.from + lastIdx, firstLine.from + lastIdx + 2)
          )
        }
      }
    } else if (isMultiLine) {
      // Multi-line: per-line replace (no cross-line block replace, no cursor issues)
      // First line ($$): replace with rendered math widget
      decorations.push(
        Decoration.replace({
          widget: new BlockMathWidget(region.formula)
        }).range(firstLine.from, firstLine.to)
      )
      // Remaining lines: replace with nothing (CM6 hides line when replace covers line start)
      for (let ln = firstLine.number + 1; ln <= lastLine.number; ln++) {
        const line = doc.line(ln)
        decorations.push(Decoration.replace({}).range(line.from, line.to))
      }
    } else {
      // Single-line $$formula$$: simple replace
      decorations.push(
        Decoration.replace({
          widget: new BlockMathWidget(region.formula)
        }).range(region.from, region.to)
      )
    }
  }

  // Phase 2: Inline math ($...$) — regex on visible ranges
  for (const { from, to } of view.visibleRanges) {
    const text = state.doc.sliceString(from, to)
    let match: RegExpExecArray | null

    INLINE_MATH_RE.lastIndex = 0
    while ((match = INLINE_MATH_RE.exec(text)) !== null) {
      const start = from + match.index
      const end = start + match[0].length
      const formula = match[1]

      if (isInsideCode(view, start)) continue
      // Skip if overlaps with any block math region
      if (blockRegions.some((r) => start >= r.from && end <= r.to)) continue

      if (isCursorInside(state, start, end)) {
        // Highlight $ delimiters in red
        decorations.push(mathDelimStyle.range(start, start + 1))
        decorations.push(mathDelimStyle.range(end - 1, end))
      } else if (formula) {
        decorations.push(
          Decoration.replace({ widget: new InlineMathWidget(formula) }).range(start, end)
        )
      }
    }
  }

  return { decorations, blockRegions }
}

// ── Main decoration builder ────────────────────────────────

function buildDecorations(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = []
  const { state } = view
  const filePath = state.facet(filePathFacet)
  const fileDir = getFileDir(filePath)

  // Compute math regions FIRST so tree iteration can skip nodes inside them
  const math = buildMathDecorations(view)
  const blockMathRegions = math.blockRegions

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter(node): false | void {
        // Skip nodes that fall inside a block math region (prevents decoration conflicts)
        if (
          blockMathRegions.length > 0 &&
          blockMathRegions.some((r) => node.from >= r.from && node.to <= r.to)
        ) {
          return false
        }

        const isActive = cursorInRange(view, node.from, node.to)

        // ATXHeading1 ~ ATXHeading6
        if (node.name.startsWith('ATXHeading') && !node.name.includes('Mark')) {
          const level = parseInt(node.name.replace('ATXHeading', ''), 10)
          if (level >= 1 && level <= 6) {
            decorations.push(
              Decoration.line({ attributes: { style: headingStyles[level] } }).range(
                state.doc.lineAt(node.from).from
              )
            )

            if (!isActive) {
              const mark = node.node.getChild('HeaderMark')
              if (mark) {
                const afterMark = mark.to
                const spaceEnd =
                  state.doc.sliceString(afterMark, afterMark + 1) === ' '
                    ? afterMark + 1
                    : afterMark
                decorations.push(Decoration.replace({}).range(mark.from, spaceEnd))
              }
            }
          }
        }

        // Emphasis (italic)
        if (node.name === 'Emphasis') {
          if (!isActive) {
            decorations.push(Decoration.replace({}).range(node.from, node.from + 1))
            decorations.push(Decoration.replace({}).range(node.to - 1, node.to))
          }
          decorations.push(
            Decoration.mark({ attributes: { style: 'font-style: italic;' } }).range(
              node.from,
              node.to
            )
          )
        }

        // StrongEmphasis (bold)
        if (node.name === 'StrongEmphasis') {
          if (!isActive) {
            decorations.push(Decoration.replace({}).range(node.from, node.from + 2))
            decorations.push(Decoration.replace({}).range(node.to - 2, node.to))
          }
          decorations.push(
            Decoration.mark({ attributes: { style: 'font-weight: 700;' } }).range(
              node.from,
              node.to
            )
          )
        }

        // Strikethrough
        if (node.name === 'Strikethrough') {
          if (!isActive) {
            decorations.push(Decoration.replace({}).range(node.from, node.from + 2))
            decorations.push(Decoration.replace({}).range(node.to - 2, node.to))
          }
          decorations.push(
            Decoration.mark({
              attributes: { style: 'text-decoration: line-through; color: #7a7a7a;' }
            }).range(node.from, node.to)
          )
        }

        // InlineCode
        if (node.name === 'InlineCode') {
          if (!isActive) {
            const marks = node.node.getChildren('CodeMark')
            for (const mark of marks) {
              decorations.push(Decoration.replace({}).range(mark.from, mark.to))
            }
          }
          decorations.push(
            Decoration.mark({
              attributes: {
                style:
                  'background: #cfc9b8; padding: 1px 4px; border-radius: 3px; font-family: ui-monospace, monospace; font-size: 0.9em; color: #9b2226;'
              }
            }).range(node.from, node.to)
          )
        }

        // Link
        if (node.name === 'Link') {
          if (!isActive) {
            const marks = node.node.getChildren('LinkMark')
            const url = node.node.getChild('URL')
            if (marks.length > 0 && url) {
              for (const mark of marks) {
                decorations.push(Decoration.replace({}).range(mark.from, mark.to))
              }
              decorations.push(Decoration.replace({}).range(url.from - 1, url.to + 1))
            }
          }
          const labelChild = node.node.getChild('LinkLabel')
          if (labelChild) {
            decorations.push(
              Decoration.mark({
                attributes: { style: 'color: #588157; text-decoration: underline;' }
              }).range(labelChild.from, labelChild.to)
            )
          }
        }

        // BulletList ListItem - style bullet markers
        if (node.name === 'ListMark' && !isActive) {
          const text = state.doc.sliceString(node.from, node.to)
          if (text === '-' || text === '*' || text === '+') {
            decorations.push(
              Decoration.replace({
                widget: new (class extends WidgetType {
                  toDOM(): HTMLElement {
                    const el = document.createElement('span')
                    el.textContent = '•'
                    el.style.color = '#588157'
                    el.style.fontWeight = '700'
                    el.style.marginRight = '2px'
                    return el
                  }
                })()
              }).range(node.from, node.to)
            )
          }
        }

        // Task list: [ ] or [x]
        if (node.name === 'TaskMarker') {
          const text = state.doc.sliceString(node.from, node.to)
          const checked = text.includes('x') || text.includes('X')

          if (!isActive) {
            decorations.push(
              Decoration.replace({
                widget: new CheckboxWidget(checked, node.from, node.to)
              }).range(node.from, node.to)
            )
          }

          // Strikethrough style for completed task text
          if (checked) {
            const line = state.doc.lineAt(node.from)
            const textStart = node.to + 1
            if (textStart < line.to) {
              decorations.push(
                Decoration.mark({
                  attributes: {
                    style: 'text-decoration: line-through; color: #7a7a7a;'
                  }
                }).range(textStart, line.to)
              )
            }
          }
        }

        // Blockquote
        if (node.name === 'Blockquote') {
          const startLine = state.doc.lineAt(node.from).number
          const endLine = state.doc.lineAt(node.to).number
          for (let ln = startLine; ln <= endLine; ln++) {
            const line = state.doc.line(ln)
            decorations.push(
              Decoration.line({
                attributes: {
                  style:
                    'border-left: 3px solid #588157; padding-left: 12px; color: #4a4a4a; font-style: italic;'
                }
              }).range(line.from)
            )
          }
          if (!isActive) {
            const marks = node.node.getChildren('QuoteMark')
            for (const mark of marks) {
              const spaceEnd =
                state.doc.sliceString(mark.to, mark.to + 1) === ' ' ? mark.to + 1 : mark.to
              decorations.push(Decoration.replace({}).range(mark.from, spaceEnd))
            }
          }
        }

        // HorizontalRule
        if (node.name === 'HorizontalRule') {
          if (!isActive) {
            decorations.push(
              Decoration.replace({ widget: new HorizontalRuleWidget() }).range(
                node.from,
                node.to
              )
            )
          }
        }

        // FencedCode - style the block
        if (node.name === 'FencedCode') {
          const startLine = state.doc.lineAt(node.from).number
          const endLine = state.doc.lineAt(node.to).number
          for (let ln = startLine; ln <= endLine; ln++) {
            const line = state.doc.line(ln)
            decorations.push(
              Decoration.line({
                attributes: {
                  style:
                    'background: #c4bfb0; font-family: ui-monospace, monospace; font-size: 0.9em;'
                }
              }).range(line.from)
            )
          }
          if (!isActive) {
            const codeMark = node.node.getChild('CodeMark')
            if (codeMark) {
              const firstLine = state.doc.lineAt(node.from)
              decorations.push(Decoration.replace({}).range(firstLine.from, firstLine.to + 1))
            }
            const lastLine = state.doc.lineAt(node.to)
            if (lastLine.text.trim().startsWith('```')) {
              decorations.push(Decoration.replace({}).range(lastLine.from - 1, lastLine.to))
            }
          }
        }

        // Image - inline preview
        if (node.name === 'Image') {
          if (!isActive) {
            const url = node.node.getChild('URL')
            if (url) {
              const urlText = state.doc.sliceString(url.from, url.to)
              // Extract alt text from the image markup
              const fullText = state.doc.sliceString(node.from, node.to)
              const altMatch = fullText.match(/^!\[([^\]]*)\]/)
              const altText = altMatch ? altMatch[1] : ''

              decorations.push(
                Decoration.replace({
                  widget: new ImagePreviewWidget(urlText, altText, fileDir),
                  block: true
                }).range(node.from, node.to)
              )
            }
          }
        }

        // Table (GFM) - visual rendering
        if (node.name === 'Table') {
          if (!isActive) {
            const tableText = state.doc.sliceString(node.from, node.to)
            decorations.push(
              Decoration.replace({
                widget: new TableWidget(tableText),
                block: true
              }).range(node.from, node.to)
            )
          }
        }
      }
    })
  }

  // Math decorations (already computed above for block region exclusion)
  decorations.push(...math.decorations)

  return Decoration.set(decorations, true)
}

// ── Table Widget (GFM) ─────────────────────────────────────

class TableWidget extends WidgetType {
  constructor(readonly markdown: string) {
    super()
  }

  eq(other: TableWidget): boolean {
    return this.markdown === other.markdown
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.style.overflowX = 'auto'
    wrapper.style.margin = '8px 0'

    const table = document.createElement('table')
    table.style.borderCollapse = 'collapse'
    table.style.width = '100%'
    table.style.maxWidth = '100%'

    const lines = this.markdown.split('\n').filter((l) => l.trim())
    if (lines.length < 2) {
      wrapper.textContent = this.markdown
      return wrapper
    }

    // Parse alignment from delimiter row
    const delimiterCells = lines[1].split('|').filter((c) => c.trim())
    const alignments = delimiterCells.map((cell) => {
      const trimmed = cell.trim()
      const left = trimmed.startsWith(':')
      const right = trimmed.endsWith(':')
      if (left && right) return 'center'
      if (right) return 'right'
      return 'left'
    })

    // Header
    const thead = document.createElement('thead')
    const headerRow = document.createElement('tr')
    const cleanCells = (line: string): string[] => {
      const parts = line.split('|')
      // Remove empty first/last from leading/trailing pipes
      if (parts.length > 0 && parts[0].trim() === '') parts.shift()
      if (parts.length > 0 && parts[parts.length - 1].trim() === '') parts.pop()
      return parts.map((p) => p.trim())
    }

    const hCells = cleanCells(lines[0])
    hCells.forEach((cell, i) => {
      const th = document.createElement('th')
      th.textContent = cell
      th.style.padding = '6px 12px'
      th.style.border = '1px solid #b8b2a1'
      th.style.background = '#cfc9b8'
      th.style.fontWeight = '600'
      th.style.textAlign = alignments[i] || 'left'
      headerRow.appendChild(th)
    })
    thead.appendChild(headerRow)
    table.appendChild(thead)

    // Body rows (skip header and delimiter)
    const tbody = document.createElement('tbody')
    for (let i = 2; i < lines.length; i++) {
      const tr = document.createElement('tr')
      const cells = cleanCells(lines[i])
      cells.forEach((cell, j) => {
        const td = document.createElement('td')
        td.textContent = cell
        td.style.padding = '6px 12px'
        td.style.border = '1px solid #b8b2a1'
        td.style.textAlign = alignments[j] || 'left'
        tr.appendChild(td)
      })
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)
    wrapper.appendChild(table)
    return wrapper
  }
}

// ── Plugin ─────────────────────────────────────────────────

export const markdownDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view)
    }

    update(update: {
      docChanged: boolean
      selectionSet: boolean
      view: EditorView
      viewportChanged: boolean
    }): void {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = buildDecorations(update.view)
      }
    }
  },
  {
    decorations: (v) => v.decorations
  }
)

export const wysiwygTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    backgroundColor: '#dad7cd'
  },
  '.cm-content': {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '16px 24px',
    maxWidth: '800px',
    lineHeight: '1.7',
    caretColor: '#588157',
    color: '#2d2d2d'
  },
  '.cm-cursor': {
    borderLeftColor: '#588157'
  },
  '.cm-gutters': {
    display: 'none'
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(88, 129, 87, 0.08)'
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(88, 129, 87, 0.15) !important'
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(88, 129, 87, 0.25) !important'
  },
  '.cm-scroller': {
    overflow: 'auto'
  }
})
