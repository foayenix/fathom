import type { ReactNode } from "react";
import { Fragment } from "react";

// Minimal markdown renderer for tutor replies — bold, italic, inline code,
// fenced code blocks, lists, and light headings. Builds React elements
// directly (no innerHTML), and tolerates the unterminated syntax that
// appears mid-stream while a reply is still arriving.

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;

function renderInline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{renderInline(part.slice(2, -2))}</strong>;
    }
    if (
      ((part.startsWith("*") && part.endsWith("*")) ||
        (part.startsWith("_") && part.endsWith("_"))) &&
      part.length > 2
    ) {
      return <em key={i}>{renderInline(part.slice(1, -1))}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function renderLines(lines: string[]): ReactNode[] {
  return lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {renderInline(line)}
    </Fragment>
  ));
}

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "heading"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "code"; text: string };

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (line.trimStart().startsWith("```")) {
      // Fenced code: collect until the closing fence, or (mid-stream) the end.
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing fence if present
      blocks.push({ kind: "code", text: buf.join("\n") });
      continue;
    }

    const heading = line.match(/^#{1,4}\s+(.*)$/);
    if (heading) {
      blocks.push({ kind: "heading", text: heading[1] });
      i++;
      continue;
    }

    const isBullet = (l: string) => /^\s*[-*•]\s+/.test(l);
    const isNumbered = (l: string) => /^\s*\d+[.)]\s+/.test(l);

    if (isBullet(line) || isNumbered(line)) {
      const numbered = isNumbered(line);
      const match = numbered ? isNumbered : isBullet;
      const strip = numbered ? /^\s*\d+[.)]\s+/ : /^\s*[-*•]\s+/;
      const items: string[] = [];
      while (i < lines.length && match(lines[i])) {
        items.push(lines[i].replace(strip, ""));
        i++;
      }
      blocks.push({ kind: numbered ? "ol" : "ul", items });
      continue;
    }

    // Paragraph: consecutive plain lines, kept as soft breaks.
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trimStart().startsWith("```") &&
      !/^#{1,4}\s/.test(lines[i]) &&
      !isBullet(lines[i]) &&
      !isNumbered(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "p", lines: buf });
  }

  return blocks;
}

export function Markdown({ text }: { text: string }) {
  return (
    <div className="md">
      {parseBlocks(text).map((b, i) => {
        switch (b.kind) {
          case "code":
            return (
              <pre key={i}>
                <code>{b.text}</code>
              </pre>
            );
          case "heading":
            return <p key={i} className="md-heading">{renderInline(b.text)}</p>;
          case "ul":
            return (
              <ul key={i}>
                {b.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i}>
                {b.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ol>
            );
          default:
            return <p key={i}>{renderLines(b.lines)}</p>;
        }
      })}
    </div>
  );
}
