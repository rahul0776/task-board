import React from 'react';

// Port of the regex tokenizer from the design handoff's taskboard-home.js.
// Emits React elements instead of HTML strings.

const GO_RE = new RegExp(
  [
    '(\\/\\/[^\\n]*)', // 1 comment
    '("(?:[^"\\\\\\n]|\\\\.)*"|`[^`]*`)', // 2 string
    '\\b(func|package|import|type|struct|interface|map|chan|return|if|else|for|range|select|case|default|var|const|go|defer|nil|true|false|delete|close|make|new|error)\\b', // 3 keyword
    '\\b(\\d+(?:\\.\\d+)?)\\b', // 4 number
    '\\b([A-Z][A-Za-z0-9]*)\\b', // 5 type-ish
  ].join('|'),
  'g'
);

const DOCKER_RE =
  /(#[^\n]*)|("(?:[^"\\\n]|\\.)*")|(^\s*(?:FROM|RUN|COPY|WORKDIR|CMD|EXPOSE|ENV|ARG|ENTRYPOINT)\b)|\b(AS|builder)\b/gm;

const CLASSES_GO = [null, 'tok-com', 'tok-str', 'tok-kw', 'tok-num', 'tok-typ'];
const CLASSES_DOCKER = [null, 'tok-com', 'tok-str', 'tok-kw', 'tok-typ'];

interface Token {
  text: string;
  cls: string | null;
}

function tokenize(src: string, re: RegExp, classes: (string | null)[]): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) tokens.push({ text: src.slice(last, m.index), cls: null });
    let cls: string | null = null;
    for (let g = 1; g < m.length; g++) {
      if (m[g] !== undefined) {
        cls = classes[g];
        break;
      }
    }
    tokens.push({ text: m[0], cls });
    last = m.index + m[0].length;
  }
  if (last < src.length) tokens.push({ text: src.slice(last), cls: null });
  return tokens;
}

export function highlight(src: string, lang: 'go' | 'docker'): React.ReactNode[] {
  const cleaned = src.replace(/^\n+|\s+$/g, '');
  const tokens =
    lang === 'docker'
      ? tokenize(cleaned, DOCKER_RE, CLASSES_DOCKER)
      : tokenize(cleaned, GO_RE, CLASSES_GO);
  return tokens.map((t, i) =>
    t.cls ? (
      <span key={i} className={t.cls}>
        {t.text}
      </span>
    ) : (
      <React.Fragment key={i}>{t.text}</React.Fragment>
    )
  );
}
