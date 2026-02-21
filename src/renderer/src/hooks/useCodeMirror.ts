import { useRef, useEffect } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { GFM } from '@lezer/markdown'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { json } from '@codemirror/lang-json'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { markdownDecorationPlugin, wysiwygTheme, filePathFacet } from '../components/editor/markdownDecorations'
import { languages } from '@codemirror/language-data'

function getLanguageExtension(lang: string) {
  switch (lang) {
    case 'markdown':
      return markdown({ base: markdownLanguage, codeLanguages: languages, extensions: [GFM] })
    case 'javascript':
    case 'typescript':
      return javascript({ typescript: lang === 'typescript', jsx: true })
    case 'python':
      return python()
    case 'json':
      return json()
    case 'html':
      return html()
    case 'css':
      return css()
    default:
      return markdown({ base: markdownLanguage, codeLanguages: languages, extensions: [GFM] })
  }
}

interface UseCodeMirrorOptions {
  content: string
  language: string
  filePath?: string | null
  onChange?: (content: string) => void
}

export function useCodeMirror({ content, language, filePath, onChange }: UseCodeMirrorOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current) return

    const isMarkdown = language === 'markdown'

    const extensions = [
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
      getLanguageExtension(language),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      highlightSelectionMatches(),
      wysiwygTheme,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current?.(update.state.doc.toString())
        }
      })
    ]

    if (isMarkdown) {
      extensions.push(filePathFacet.of(filePath || ''))
      extensions.push(markdownDecorationPlugin)
      extensions.push(EditorView.lineWrapping)
    }

    const state = EditorState.create({
      doc: content,
      extensions
    })

    const view = new EditorView({
      state,
      parent: containerRef.current
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [language])

  // content가 외부에서 변경되면 에디터에 반영
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const currentContent = view.state.doc.toString()
    if (currentContent !== content) {
      view.dispatch({
        changes: { from: 0, to: currentContent.length, insert: content }
      })
    }
  }, [content])

  return { containerRef }
}
