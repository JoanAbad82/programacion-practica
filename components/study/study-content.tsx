import type { ReactNode } from "react";
import type { StudySection } from "@/types/study";

function inlineTokens(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={`${index}-${part}`}>{part.slice(2, -2)}</strong>;
      }

      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={`${index}-${part}`}>{part.slice(1, -1)}</code>;
      }

      return <span key={`${index}-${part}`}>{part}</span>;
    });
}

export function StudyContent({ sections }: { sections: StudySection[] }) {
  return (
    <div className="study-content">
      {sections.map((section) => (
        <section className="study-section" id={section.id} key={section.id}>
          <h2>{inlineTokens(section.title)}</h2>
          {section.blocks.map((block, index) => {
            if (block.kind === "paragraph") {
              return <p key={index}>{inlineTokens(block.text)}</p>;
            }

            if (block.kind === "code") {
              return (
                <div className="code-shell" key={index}>
                  <div className="code-label">{block.language}</div>
                  <pre>
                    <code className={`language-${block.language}`}>{block.code}</code>
                  </pre>
                </div>
              );
            }

            if (block.kind === "list") {
              const List = block.ordered ? "ol" : "ul";
              return (
                <List key={index}>
                  {block.items.map((item) => (
                    <li key={item}>{inlineTokens(item)}</li>
                  ))}
                </List>
              );
            }

            return (
              <blockquote key={index}>{inlineTokens(block.text)}</blockquote>
            );
          })}
        </section>
      ))}
    </div>
  );
}
