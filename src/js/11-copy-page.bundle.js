;(function () {
  'use strict'

  var TurndownService = require('turndown')
  var gfm = require('turndown-plugin-gfm').gfm

  var article = document.querySelector('article.doc')
  if (!article) return
  var heading = article.querySelector('h1.page')
  if (!heading || heading.parentNode !== article) return
  var supportsCopy = window.navigator.clipboard
  if (!supportsCopy) return

  var turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' }).use(gfm)
  // elements injected by other site scripts (embedded TOC, code copy buttons) or by Asciidoctor
  // (empty heading permalink icons) that aren't authored page content
  var chromeSelector = 'nav.pagination, .copy-page, aside.toc, .source-toolbox, a.anchor'

  function pageMarkdown () {
    var clone = article.cloneNode(true)
    ;[].slice.call(clone.querySelectorAll(chromeSelector)).forEach(function (el) {
      el.parentNode.removeChild(el)
    })
    return turndownService.turndown(clone.innerHTML).trim()
  }

  function llmPromptUrl (base) {
    var prompt = 'Read from ' + window.location.href + ' so I can ask questions about it.'
    return base + encodeURIComponent(prompt)
  }

  function copyToClipboard (onDone) {
    window.navigator.clipboard.writeText(pageMarkdown()).then(function () {
      onDone && onDone()
    }, function () {})
  }

  function actionRow (action, iconClass, title, desc, external) {
    var isLink = action === 'chatgpt' || action === 'claude'
    var tag = isLink ? 'a' : 'button'
    var attrs = isLink ? ' target="_blank" rel="noopener noreferrer"' : ' type="button"'
    return (
      '<' + tag + ' class="copy-page-action" data-action="' + action + '"' + attrs + '>' +
        '<span class="copy-page-action-icon ' + iconClass + '"></span>' +
        '<span class="copy-page-action-text">' +
          '<span class="copy-page-action-title">' + title +
            (external ? '<span class="copy-page-action-ext"></span>' : '') +
          '</span>' +
          '<span class="copy-page-action-desc">' + desc + '</span>' +
        '</span>' +
      '</' + tag + '>'
    )
  }

  var wrapper = document.createElement('div')
  wrapper.className = 'page-heading'
  heading.parentNode.insertBefore(wrapper, heading)
  wrapper.appendChild(heading)

  var copyPage = document.createElement('div')
  copyPage.className = 'copy-page'
  copyPage.innerHTML =
    '<div class="copy-page-inner">' +
      '<div class="copy-page-toggle">' +
        '<button type="button" class="copy-page-toggle-main">' +
          '<span class="copy-page-toggle-icon"></span>' +
          '<span class="copy-page-toggle-label">Copy page</span>' +
        '</button>' +
        '<button type="button" class="copy-page-toggle-caret" aria-label="More copy options"></button>' +
      '</div>' +
      '<div class="copy-page-menu">' +
        actionRow('copy', 'icon-copy', 'Copy page', 'Copy page as Markdown for LLMs', false) +
        actionRow('view', 'icon-markdown', 'View as Markdown', 'View this page as plain text', true) +
        actionRow('chatgpt', 'icon-openai', 'Open in ChatGPT', 'Ask questions about this page', true) +
        actionRow('claude', 'icon-claude', 'Open in Claude', 'Ask questions about this page', true) +
      '</div>' +
    '</div>'
  wrapper.appendChild(copyPage)

  var chatgptLink = copyPage.querySelector('[data-action="chatgpt"]')
  var claudeLink = copyPage.querySelector('[data-action="claude"]')
  chatgptLink.href = llmPromptUrl('https://chatgpt.com/?hints=search&q=')
  claudeLink.href = llmPromptUrl('https://claude.ai/new?q=')

  var toggleMain = copyPage.querySelector('.copy-page-toggle-main')
  var toggleCaret = copyPage.querySelector('.copy-page-toggle-caret')

  function toggleMenu (e) {
    copyPage.classList.toggle('is-active')
    e.stopPropagation()
  }

  toggleMain.addEventListener('click', toggleMenu)
  toggleCaret.addEventListener('click', toggleMenu)

  document.addEventListener('click', function (e) {
    if (!copyPage.contains(e.target)) copyPage.classList.remove('is-active')
  }, true)

  var toggleLabel = toggleMain.querySelector('.copy-page-toggle-label')
  var toggleLabelDefault = toggleLabel.textContent

  var copyAction = copyPage.querySelector('[data-action="copy"]')
  var copyActionDesc = copyAction.querySelector('.copy-page-action-desc')
  var copyActionDescDefault = copyActionDesc.textContent
  copyAction.addEventListener('click', function () {
    copyToClipboard(function () {
      copyActionDesc.textContent = 'Copied to clipboard!'
      toggleLabel.textContent = 'Copied'
      copyPage.classList.remove('is-active')
      window.setTimeout(function () {
        copyActionDesc.textContent = copyActionDescDefault
        toggleLabel.textContent = toggleLabelDefault
      }, 2000)
    })
  })

  copyPage.querySelector('[data-action="view"]').addEventListener('click', function () {
    var blob = new window.Blob([pageMarkdown()], { type: 'text/markdown;charset=utf-8' })
    var url = window.URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener')
    window.setTimeout(function () {
      window.URL.revokeObjectURL(url)
    }, 60000)
    copyPage.classList.remove('is-active')
  })
  ;[chatgptLink, claudeLink].forEach(function (link) {
    link.addEventListener('click', function () {
      copyPage.classList.remove('is-active')
    })
  })
})()
