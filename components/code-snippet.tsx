export function CodeSnippet({ code, noScroll }: { code: string; noScroll?: boolean }) {
  return (
    <pre className={`rounded-md border border-border bg-muted/50 px-3 py-2 text-xs font-mono text-foreground/80 ${noScroll ? "overflow-x-visible whitespace-pre-wrap" : "overflow-x-auto"}`}>
      <code>{code}</code>
    </pre>
  )
}
