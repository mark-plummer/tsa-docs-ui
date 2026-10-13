;(function () {
  'use strict'

  var sidebar = document.querySelector('aside.release-nav')
  if (!sidebar) return
  var list = sidebar.querySelector('ul')
  var sourceUrl = new URL(sidebar.dataset.source, window.location.href)
  var cacheKey = 'release-nav:' + sourceUrl.pathname

  function samePage (a, b) {
    return a.replace(/\/index\.html$|\.html$|\/$/, '') === b.replace(/\/index\.html$|\.html$|\/$/, '')
  }

  // Each summary section is a release: its heading is the label, its "Read the full release notes" link the target.
  function extract (root) {
    var items = []
    root.querySelectorAll('article.doc .sect1').forEach(function (sect) {
      var heading = sect.querySelector('h2')
      if (!heading) return
      var link = Array.prototype.filter.call(sect.querySelectorAll('a[href]'), function (a) {
        return /^read the full/i.test(a.textContent.trim())
      })[0]
      if (!link) return
      items.push({ label: heading.textContent.trim(), href: new URL(link.getAttribute('href'), sourceUrl).pathname })
    })
    return items
  }

  function link (item) {
    var li = document.createElement('li')
    var a = document.createElement('a')
    a.href = item.href
    a.textContent = item.label
    if (samePage(item.href, window.location.pathname)) {
      a.className = 'is-active'
      a.setAttribute('aria-current', 'page')
    }
    li.appendChild(a)
    return li
  }

  // Group releases by the year in their label; the newest year and the year of the current page start open.
  function render (items) {
    if (!items.length) return sidebar.parentNode.removeChild(sidebar)
    list.appendChild(link({ label: 'Summary', href: sourceUrl.pathname }))
    var groups = []
    var byYear = {}
    items.forEach(function (item) {
      var match = item.label.match(/\b(\d{4})\b/)
      var year = match ? match[1] : 'Other'
      if (!byYear[year]) groups.push((byYear[year] = { year: year, items: [] }))
      byYear[year].items.push(item)
    })
    groups.forEach(function (group, idx) {
      var li = document.createElement('li')
      var details = document.createElement('details')
      var summary = document.createElement('summary')
      var inner = document.createElement('ul')
      summary.textContent = group.year
      group.items.forEach(function (item) { inner.appendChild(link(item)) })
      details.open = idx === 0 || !!inner.querySelector('.is-active')
      details.appendChild(summary)
      details.appendChild(inner)
      li.appendChild(details)
      list.appendChild(li)
    })
    var active = list.querySelector('.is-active')
    if (active) list.scrollTop = Math.max(0, active.offsetTop - list.clientHeight / 2)
  }

  if (samePage(sourceUrl.pathname, window.location.pathname)) return render(extract(document))

  var cached
  try { cached = JSON.parse(window.sessionStorage.getItem(cacheKey)) } catch (e) { cached = null }
  if (cached) render(cached)

  window.fetch(sourceUrl.href)
    .then(function (res) { return res.ok ? res.text() : Promise.reject(new Error(res.status)) })
    .then(function (html) {
      var items = extract(new window.DOMParser().parseFromString(html, 'text/html'))
      try { window.sessionStorage.setItem(cacheKey, JSON.stringify(items)) } catch (e) {}
      if (JSON.stringify(items) === JSON.stringify(cached)) return
      list.textContent = ''
      render(items)
    })
    .catch(function () { if (!cached) sidebar.parentNode.removeChild(sidebar) })
})()
