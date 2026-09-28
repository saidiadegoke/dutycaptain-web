import React from 'react';

/**
 * The Markdown the rich text editor writes — paragraphs, bulleted and numbered
 * lists, **bold**, *italic*, `code`, headings — rendered as React elements.
 * Never as HTML: an objective is text a person typed or pasted, and building
 * elements (rather than injecting markup) is what keeps pasted HTML inert.
 */

function inline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith('**') || tok.startsWith('__')) out.push(<strong key={key} className="font-semibold">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={key} className="rounded bg-canvas px-1 font-mono text-[0.9em]">{tok.slice(1, -1)}</code>);
    else out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function MarkdownText({ text, className = '' }: {text: string;className?: string;}) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let list: {ordered: boolean;items: string[];} | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      const k = `p${blocks.length}`;
      blocks.push(<p key={k} className="mb-1.5 last:mb-0">{inline(para.join(' '), k)}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      const k = `l${blocks.length}`;
      const items = list.items.map((it, i) => <li key={`${k}-${i}`} className="mb-0.5">{inline(it, `${k}-${i}`)}</li>);
      blocks.push(list.ordered ?
      <ol key={k} className="mb-1.5 list-decimal pl-5 last:mb-0">{items}</ol> :
      <ul key={k} className="mb-1.5 list-disc pl-5 last:mb-0">{items}</ul>);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (bullet || numbered) {
      flushPara();
      const ordered = Boolean(numbered);
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push((bullet || numbered)![1]);
    } else if (heading) {
      flushPara();
      flushList();
      const k = `h${blocks.length}`;
      blocks.push(<p key={k} className="mb-1.5 font-semibold">{inline(heading[1], k)}</p>);
    } else if (!line.trim()) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return <div className={className}>{blocks}</div>;
}

/** The first line as plain text — for a title, a list row, an email subject. */
export function firstLine(text: string): string {
  const line = String(text || '').split('\n').map((l) => l.trim()).find(Boolean) || '';
  return line.replace(/^#{1,6}\s+|^\s*[-*+]\s+|^\s*\d+[.)]\s+/, '').replace(/\*\*|__|`/g, '').replace(/(^|\s)[*_](\S)/g, '$1$2');
}
