export function CodeSnippet({ code }: { code: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-muted/50 px-3 py-2 text-xs font-mono text-foreground/80">
      <code>{code}</code>
    </pre>
  )
}
