import {
  ViewPlugin,
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType
} from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import { Range } from '@codemirror/state'

class CheckboxWidget extends WidgetType {
  constructor(readonly checked: boolean) {
    super()
  }
  toDOM(): HTMLElement {
    const el = document.createElement('input')
    el.type = 'checkbox'
    el.checked = this.checked
    el.disabled = true
    el.style.marginRight = '4px'
    el.style.verticalAlign = 'middle'
    return el
  }
}

class HorizontalRuleWidget extends WidgetType {
  toDOM(): HTMLElement {
    const el = document.createElement('hr')
    el.style.border = 'none'
    el.style.borderTop = '1px solid #b8b2a1'
    el.style.margin = '8px 0'
    return el
  }
}

const headingStyles: Record<number, string> = {
  1: 'font-size: 1.8em; font-weight: 700; line-height: 1.3;',
  2: 'font-size: 1.5em; font-weight: 700; line-height: 1.3;',
  3: 'font-size: 1.25em; font-weight: 600; line-height: 1.3;',
  4: 'font-size: 1.1em; font-weight: 600; line-height: 1.3;',
  5: 'font-size: 1em; font-weight: 600; line-height: 1.3;',
  6: 'font-size: 0.9em; font-weight: 600; line-height: 1.3; color: #4a4a4a;'
}

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

function buildDecorations(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = []
  const { state } = view

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter(node) {
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
                const spaceEnd = state.doc.sliceString(afterMark, afterMark + 1) === ' '
                  ? afterMark + 1
                  : afterMark
                decorations.push(
                  Decoration.replace({}).range(mark.from, spaceEnd)
                )
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
              // Hide [, ]( and )
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
              Decoration.replace({ widget: new CheckboxWidget(checked) }).range(
                node.from,
                node.to
              )
            )
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
            // Hide opening and closing fences
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

        // Image
        if (node.name === 'Image') {
          if (!isActive) {
            const url = node.node.getChild('URL')
            if (url) {
              const urlText = state.doc.sliceString(url.from, url.to)
              decorations.push(
                Decoration.replace({
                  widget: new (class extends WidgetType {
                    toDOM(): HTMLElement {
                      const el = document.createElement('span')
                      el.style.color = '#588157'
                      el.style.fontSize = '0.85em'
                      el.textContent = `🖼 image`
                      el.title = urlText
                      return el
                    }
                  })()
                }).range(node.from, node.to)
              )
            }
          }
        }
      }
    })
  }

  return Decoration.set(decorations, true)
}

export const markdownDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view)
    }

    update(update: { docChanged: boolean; selectionSet: boolean; view: EditorView; viewportChanged: boolean }): void {
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
