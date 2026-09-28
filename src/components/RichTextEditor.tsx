'use client';

/**
 * The rich text editor, ported from hthub's `RichTextEditor` (Lexical): bold,
 * italic, bulleted and numbered lists, with history and Markdown shortcuts
 * ("- " starts a list, "**x**" is bold).
 *
 * MARKDOWN OUT, not HTML. hthub's version emits HTML for pages that render
 * it; here the text is a task objective a model reads and a person re-reads,
 * and Markdown is what both read best — it stays legible as plain text in an
 * email, a log or a prompt. The HTML source toggle is left out for the same
 * reason.
 */

import { useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { FORMAT_TEXT_COMMAND, type EditorState } from 'lexical';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const btn = 'cursor-pointer rounded p-1.5 text-ink-700 hover:bg-canvas hover:text-ink-900';
  return (
    <div className="flex items-center gap-0.5 border-b border-line px-1.5 py-1">
      <button type="button" className={btn} title="Bold (Ctrl+B)" aria-label="Bold" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}>
        <Bold className="h-3.5 w-3.5" strokeWidth={2.4} />
      </button>
      <button type="button" className={btn} title="Italic (Ctrl+I)" aria-label="Italic" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}>
        <Italic className="h-3.5 w-3.5" strokeWidth={2.4} />
      </button>
      <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
      <button type="button" className={btn} title="Bulleted list" aria-label="Bulleted list" onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}>
        <List className="h-3.5 w-3.5" strokeWidth={2.4} />
      </button>
      <button type="button" className={btn} title="Numbered list" aria-label="Numbered list" onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}>
        <ListOrdered className="h-3.5 w-3.5" strokeWidth={2.4} />
      </button>
    </div>);

}

/**
 * Replace the content from outside — an example clicked, a retry's text — but
 * only when it differs from what the editor already holds, so typing never
 * resets the caret.
 */
function ExternalValue({ value }: {value: string;}) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    const current = editor.getEditorState().read(() => $convertToMarkdownString(TRANSFORMERS));
    if (current === value) return;
    editor.update(() => $convertFromMarkdownString(value || '', TRANSFORMERS));
  }, [editor, value]);
  return null;
}

export function RichTextEditor({
  value, onChange, placeholder = 'Write here…', minHeight = 120, ariaLabel, autoFocus = false
}: {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  minHeight?: number;
  ariaLabel?: string;
  autoFocus?: boolean;
}) {
  const initialConfig = {
    namespace: 'DutyCaptainRichText',
    theme: {
      paragraph: 'mb-1.5',
      text: { bold: 'font-semibold', italic: 'italic' },
      heading: { h1: 'text-[17px] font-semibold mb-2', h2: 'text-[15px] font-semibold mb-1.5' },
      list: {
        ul: 'list-disc pl-5 mb-1.5',
        ol: 'list-decimal pl-5 mb-1.5',
        listitem: 'mb-0.5'
      },
      quote: 'border-l-2 border-line pl-3 text-ink-700',
      code: 'font-mono text-[12px] bg-canvas rounded px-1'
    },
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode],
    editorState: () => $convertFromMarkdownString(value || '', TRANSFORMERS),
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    }
  };

  const handleChange = (state: EditorState) => {
    state.read(() => onChange($convertToMarkdownString(TRANSFORMERS)));
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="overflow-hidden rounded-lg border border-line bg-panel focus-within:border-brand-500">
        <Toolbar />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
            <ContentEditable
              aria-label={ariaLabel}
              autoFocus={autoFocus}
              className="max-h-[420px] overflow-y-auto px-3 py-2.5 text-[14px] leading-relaxed text-ink-900 focus:outline-none"
              style={{ minHeight }} />
            }
            placeholder={<div className="pointer-events-none absolute left-3 top-2.5 text-[14px] text-ink-400">{placeholder}</div>}
            ErrorBoundary={LexicalErrorBoundary} />

        </div>
        <HistoryPlugin />
        <ListPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
        <ExternalValue value={value} />
      </div>
    </LexicalComposer>);

}
