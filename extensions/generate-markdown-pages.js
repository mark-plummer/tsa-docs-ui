'use strict'

const cheerio = require('cheerio')
const TurndownService = require('turndown')
const { gfm } = require('turndown-plugin-gfm')

// elements injected by site scripts (embedded TOC, code copy buttons, the Copy Page widget itself)
// or by Asciidoctor (empty heading permalink icons, inline <style> passthrough blocks) that
// aren't authored page content and shouldn't appear in the generated Markdown. turndown has no
// special handling for <script>/<style> and otherwise emits their raw text as page content.
const CHROME_SELECTOR = 'nav.pagination, .copy-page, aside.toc, .source-toolbox, a.anchor, script, style'

const LLMS_TXT_URL = 'https://docs.thoughtspot.com/llms.txt'
const LLMS_TXT_DIRECTIVE = `> For the complete documentation index, see [llms.txt](${LLMS_TXT_URL})`

// turndown-plugin-gfm only converts a <table> whose first row is entirely <th> cells;
// anything else is left as raw, unconverted HTML by design (see its `keep()` call).
// Asciidoctor never emits <th> for admonition blocks (NOTE/TIP/WARNING/...) or for
// horizontal definition lists (.hdlist tables), so both leaked straight through as raw
// HTML soup in the generated markdown. This placeholder survives turndown's escaping of
// markdown-special characters (unlike literal "[!NOTE]", whose brackets get backslash-escaped)
// so the GFM alert marker can be swapped in after conversion.
const ADMONITION_LABELS = { note: 'NOTE', tip: 'TIP', warning: 'WARNING', important: 'IMPORTANT', caution: 'CAUTION' }
const ADMONITION_PLACEHOLDER = (label) => `XADMONITIONMARKERX${label}X`

function convertAdmonitions ($, article) {
  article.find('.admonitionblock').each((i, el) => {
    const $el = $(el)
    const type = ($el.attr('class') || '').split(/\s+/).find((c) => c !== 'admonitionblock')
    const label = ADMONITION_LABELS[type] || (type || 'NOTE').toUpperCase()
    const content = $el.find('td.content').first().html() || ''
    $el.replaceWith(`<blockquote><p>${ADMONITION_PLACEHOLDER(label)}</p>${content}</blockquote>`)
  })
}

function promoteHeaderlessTables ($, article) {
  article.find('table').each((i, table) => {
    const firstRowCells = $(table).find('tr').first().children().toArray()
    const hasHeaderRow = firstRowCells.length > 0 && firstRowCells.every((c) => c.tagName === 'th')
    if (!hasHeaderRow) firstRowCells.forEach((c) => { c.tagName = 'th' })
  })
}

function toMarkdown (html, turndownService) {
  const $ = cheerio.load(html)
  const article = $('article.doc').first()
  if (!article.length) return undefined
  article.find(CHROME_SELECTOR).remove()
  // turndown-plugin-gfm's heading-row check requires the first <tr> to be the first
  // child of <table>/first <tbody>. A <colgroup> (Asciidoctor emits one for tables with
  // explicit column widths) sits before <tbody> and breaks that positional check even
  // when the row is already proper <th> cells, so the whole table leaks as raw HTML.
  article.find('table > colgroup').remove()
  // A <caption> (Asciidoctor emits one for tables with a title, e.g. "Table 1. ...")
  // breaks that same positional check, so pull it out as its own paragraph above the table.
  article.find('table > caption').each((i, el) => {
    const $caption = $(el)
    $caption.parent().before(`<p><strong>${$caption.html()}</strong></p>`)
    $caption.remove()
  })
  // Asciidoctor wraps every table cell's content in <p class="tableblock">. Turndown
  // treats <p> as a block element and surrounds it with blank lines even inside a
  // <td>, which breaks the single-line GFM table row syntax and bloats output size.
  article.find('td p, th p').each((i, el) => {
    const $el = $(el)
    $el.replaceWith($el.html())
  })
  convertAdmonitions($, article)
  promoteHeaderlessTables($, article)
  let markdown = turndownService.turndown(article.html() || '').trim()
  markdown = markdown.replace(/XADMONITIONMARKERX(\w+?)X/g, '[!$1]')
  return `${LLMS_TXT_DIRECTIVE}\n\n${markdown}`
}

module.exports.register = function () {
  const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' }).use(gfm)

  this.on('beforePublish', ({ contentCatalog, siteCatalog }) => {
    contentCatalog.getPages((page) => page.out).forEach((page) => {
      const markdown = toMarkdown(page.contents.toString(), turndownService)
      if (markdown === undefined) return
      const out = {
        ...page.out,
        path: page.out.path.replace(/\.html$/, '.md'),
        basename: page.out.basename.replace(/\.html$/, '.md'),
      }
      siteCatalog.addFile({
        contents: Buffer.from(markdown, 'utf8'),
        mediaType: 'text/markdown; charset=utf-8',
        out,
        src: { ...page.src, mediaType: 'text/markdown' },
      })
    })
  })
}
