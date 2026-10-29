;(function () {
  'use strict'

  if (!document.body.classList.contains('connector-search')) return

  var sections = []
  document.querySelectorAll('.doc .sect2').forEach(function (sect) {
    var table = sect.querySelector('table.tableblock')
    if (!table) return
    var names = []
    table.querySelectorAll('td').forEach(function (td) {
      var name = td.textContent.trim()
      if (name) names.push({ name: name, key: normalize(name) })
    })
    if (!names.length) return
    var list = document.createElement('ul')
    list.className = 'connector-search-results'
    list.hidden = true
    table.parentNode.insertBefore(list, table.nextSibling)
    sections.push({ sect: sect, table: table, list: list, names: names })
  })
  if (!sections.length) return

  var first = sections[0].sect
  var bar = document.createElement('div')
  bar.className = 'connector-search'
  bar.innerHTML =
    '<label class="connector-search-label" for="connector-search-input">Search connectors</label>' +
    '<input id="connector-search-input" class="connector-search-input" type="search" ' +
    'placeholder="Search by connector name" autocomplete="off" spellcheck="false">' +
    '<p class="connector-search-status" role="status" aria-live="polite"></p>'
  first.parentNode.insertBefore(bar, first)

  var input = bar.querySelector('input')
  var status = bar.querySelector('.connector-search-status')

  input.addEventListener('input', update)

  function update () {
    var query = normalize(input.value)
    var total = 0
    sections.forEach(function (s) {
      if (!query) {
        s.sect.hidden = false
        s.table.hidden = false
        s.list.hidden = true
        return
      }
      var matches = s.names.filter(function (n) { return n.key.indexOf(query) !== -1 })
      s.list.innerHTML = ''
      matches.forEach(function (n) {
        var li = document.createElement('li')
        li.textContent = n.name
        s.list.appendChild(li)
      })
      total += matches.length
      s.sect.hidden = !matches.length
      s.table.hidden = true
      s.list.hidden = !matches.length
    })
    status.textContent = !query ? '' : total
      ? total + (total === 1 ? ' connector found' : ' connectors found')
      : 'No connectors match “' + input.value.trim() + '”'
  }

  function normalize (text) {
    return text.toLowerCase().replace(/[‘’]/g, "'").trim()
  }
})()
