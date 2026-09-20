import type { ReactNode } from "react";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(`[^`\n]+`)/g);

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }

    return <span key={key}>{part}</span>;
  });
}

export function QuizRichText({
  text,
  compact = false,
}: {
  text: string;
  compact?: boolean;
}) {
  const segments: ReactNode[] = [];
  const pattern = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    const before = text.slice(cursor, match.index);

    if (before.trim()) {
      segments.push(
        <span className="quiz-inline-copy" key={`text-${index}`}>
          {renderInline(before, `inline-${index}`)}
        </span>,
      );
    }

    segments.push(
      <span className="quiz-code-block" key={`code-${index}`}>
        {match[1] ? <span className="quiz-code-label">{match[1]}</span> : null}
        <code>{match[2].trimEnd()}</code>
      </span>,
    );

    cursor = pattern.lastIndex;
    index += 1;
  }

  const tail = text.slice(cursor);

  if (tail.trim() || segments.length === 0) {
    segments.push(
      <span className="quiz-inline-copy" key={`text-${index}`}>
        {renderInline(tail, `inline-${index}`)}
      </span>,
    );
  }

  return (
    <span className={compact ? "quiz-rich-text compact" : "quiz-rich-text"}>
      {segments}
    </span>
  );
}
