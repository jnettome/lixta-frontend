import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function highlightCode(str: string, lang: string | null): string {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return (
        '<pre><code class="hljs">' +
        hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
        '</code></pre>'
      )
    } catch {
      /* ignore */
    }
  }
  return '<pre><code class="hljs">' + escapeHtml(str) + '</code></pre>'
}

export const mdRenderer = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true,
  highlight: highlightCode,
})

const defaultRender =
  mdRenderer.renderer.rules.link_open ||
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

mdRenderer.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('target', '_blank')
  tokens[idx].attrSet('rel', 'noopener noreferrer')
  return defaultRender(tokens, idx, options, env, self)
}

mdRenderer.use((mdInst) => {
  mdInst.inline.ruler.before('text', 'mention', (state, silent) => {
    const pos = state.pos
    if (state.src.charCodeAt(pos) !== 0x5b /* [ */) {
      return false
    }

    const mentionRegex =
      /\[@\s+(?:id="(\d+)"[^\]]*label="([^"]+)"|label="([^"]+)"[^\]]*id="(\d+)")\s*\]/
    const match = state.src.slice(pos).match(mentionRegex)

    if (!match) {
      return false
    }

    if (silent) {
      return true
    }

    const mentionId = match[1] || match[4] || ''
    const mentionLabel = match[2] || match[3] || ''
    const fullMatch = match[0]

    if (!mentionId || !mentionLabel) {
      return false
    }

    const token = state.push('mention', '', 0)
    token.content = mentionLabel
    token.attrs = [
      ['data-user-id', mentionId],
      ['data-label', mentionLabel],
    ]
    token.markup = fullMatch

    state.pos += fullMatch.length
    return true
  })

  mdInst.renderer.rules.mention = (tokens, idx) => {
    const token = tokens[idx]
    const userId = token.attrs?.find(([key]) => key === 'data-user-id')?.[1] ?? ''
    const label =
      token.content || token.attrs?.find(([key]) => key === 'data-label')?.[1] || ''

    return `<span class="mention-chip" data-user-id="${escapeHtml(userId)}">@${escapeHtml(label)}</span>`
  }
})
