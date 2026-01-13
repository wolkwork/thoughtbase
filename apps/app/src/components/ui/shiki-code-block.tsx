import { useEffect, useMemo, useState } from "react";
import type { BundledLanguage } from "shiki";
import { useTheme } from "~/components/theme-provider";
import { cn } from "~/lib/utils";

type ShikiTheme = "github-light" | "github-dark";

let shikiCodeToHtmlPromise: Promise<
  (code: string, options: { lang: BundledLanguage; theme: ShikiTheme }) => Promise<string>
> | null = null;

async function getCodeToHtml() {
  shikiCodeToHtmlPromise ??= import("shiki").then((m) => m.codeToHtml);
  return await shikiCodeToHtmlPromise;
}

function getResolvedTheme(theme: "dark" | "light" | "system"): "dark" | "light" {
  if (theme !== "system") return theme;
  return "light";
}

export function ShikiCodeBlock({
  code,
  lang,
  className,
  fallbackClassName,
}: {
  code: string;
  lang: BundledLanguage;
  className?: string;
  fallbackClassName?: string;
}) {
  const { theme } = useTheme();
  const resolvedTheme = getResolvedTheme(theme);
  const shikiTheme: ShikiTheme =
    resolvedTheme === "dark" ? "github-dark" : "github-light";

  const [state, setState] = useState<{ key: string; html: string } | null>(null);

  const key = useMemo(() => `${shikiTheme}:${lang}:${code}`, [code, lang, shikiTheme]);
  const html = state?.key === key ? state.html : null;

  useEffect(() => {
    let cancelled = false;
    const localKey = key;

    async function run() {
      try {
        const codeToHtml = await getCodeToHtml();
        const out = await codeToHtml(code, { lang, theme: shikiTheme });
        if (!cancelled) setState({ key: localKey, html: out });
      } catch {
        if (!cancelled) setState(null);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [key, code, lang, shikiTheme]);

  if (!html) {
    return (
      <pre
        className={cn(
          "bg-muted overflow-x-auto rounded-lg border p-4 text-xs",
          fallbackClassName,
        )}
      >
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      className={cn(
        // Shiki returns its own <pre class="shiki"> with inline token styles; we just provide layout chrome.
        "overflow-hidden overflow-x-auto rounded-lg border text-xs [&_.shiki]:m-0 [&_.shiki]:min-w-fit [&_.shiki]:p-4",
        className,
      )}
      // Shiki generates HTML with inline styles; code input is controlled by us.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
