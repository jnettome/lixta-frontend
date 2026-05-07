import DOMPurify from 'dompurify'
import { useMemo } from 'react'

import { mdRenderer } from '@/lib/markdown'
import { cn } from '@/lib/utils'

type MarkdownBodyProps = {
  markdown: string
  className?: string
}

export function MarkdownBody({ markdown, className }: MarkdownBodyProps) {
  const html = useMemo(() => {
    const raw = mdRenderer.render(markdown ?? '')
    return DOMPurify.sanitize(raw, {
      ADD_ATTR: ['target', 'rel', 'data-user-id', 'data-label', 'class'],
    })
  }, [markdown])

  return (
    <div
      className={cn(
        'markdown-body prose prose-invert max-w-none',
        'prose-headings:scroll-mt-4 prose-p:leading-relaxed',
        'prose-pre:bg-surface-2 prose-pre:border prose-pre:border-border prose-pre:rounded-lg',
        'prose-code:text-fg prose-code:before:content-none prose-code:after:content-none',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
