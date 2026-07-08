"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  initialHtml: string;
  onChange: (html: string) => void;
}

const TOOLS: { cmd: string; icon: string; label: string; arg?: string }[] = [
  { cmd: "bold", icon: "𝐁", label: "Bold" },
  { cmd: "italic", icon: "𝐼", label: "Italic" },
  { cmd: "underline", icon: "U̲", label: "Underline" },
  { cmd: "insertUnorderedList", icon: "• —", label: "Bullet list" },
  { cmd: "formatBlock", icon: "H", label: "Heading", arg: "h3" },
  { cmd: "formatBlock", icon: "❝", label: "Quote", arg: "blockquote" },
  { cmd: "removeFormat", icon: "⌫", label: "Clear formatting" },
];

/**
 * Lightweight contentEditable rich text editor (bold/italic/lists/quote).
 * Output HTML is sanitised in the save path (see sanitizeHtml).
 */
export function RichTextEditor({ initialHtml, onChange }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== initialHtml) {
      ref.current.innerHTML = initialHtml;
    }
    // Only on mount / letter switch — user edits flow through onInput.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML ?? "");
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-blush-200/70 dark:border-white/10">
      <div className="flex flex-wrap gap-0.5 border-b border-blush-200/60 bg-white/50 p-1.5 dark:border-white/10 dark:bg-white/5" role="toolbar" aria-label="Text formatting">
        {TOOLS.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.label}
            aria-label={t.label}
            onMouseDown={(e) => e.preventDefault()} /* keep selection */
            onClick={() => exec(t.cmd, t.arg)}
            className="grid size-8 place-items-center rounded-lg text-sm font-bold text-ink-soft transition-colors hover:bg-blush-100 hover:text-blush-600 dark:hover:bg-white/10"
          >
            {t.icon}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Letter body"
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
        className={cn(
          "prose-sm min-h-48 max-w-none bg-white/60 px-4 py-3 text-sm leading-relaxed focus:outline-none dark:bg-white/5",
          "[&_blockquote]:border-l-4 [&_blockquote]:border-blush-300 [&_blockquote]:pl-3 [&_blockquote]:italic",
          "[&_h3]:text-lg [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-5",
        )}
      />
    </div>
  );
}
