;(function () {
  'use strict'

  var FILTER_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" class="notes-weekly-filter-icon" aria-hidden="true">' +
    '<path d="M2 5h20"/><path d="M6 12h12"/><path d="M9 19h6"/></svg>'

  var CHEVRON_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" class="notes-weekly-filter-chevron" aria-hidden="true">' +
    '<polyline points="6 9 12 15 18 9"/></svg>'

  var CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" class="notes-weekly-filter-check" aria-hidden="true">' +
    '<polyline points="20 6 9 17 4 12"/></svg>'

  function slugify (text) {
    return text.trim().toLowerCase().replace(/\s+/g, '-')
  }

  document.querySelectorAll('body.dated-updates .doc').forEach(function (doc) {
    var firstSect1 = doc.querySelector(':scope > .sect1')
    if (!firstSect1) return

    var categories = []
    var seen = {}
    doc.querySelectorAll(':scope > .sect1 .sect2 > h3').forEach(function (h3) {
      var label = h3.textContent.trim()
      var key = slugify(label)
      if (seen[key]) return
      seen[key] = true
      categories.push({ key: key, label: label })
    })
    if (!categories.length) return

    categories.sort(function (a, b) { return a.label.localeCompare(b.label) })

    var selected = {}

    var wrapper = document.createElement('div')
    wrapper.className = 'notes-weekly-filter'

    var button = document.createElement('button')
    button.type = 'button'
    button.className = 'notes-weekly-filter-button'
    button.setAttribute('aria-haspopup', 'true')
    button.setAttribute('aria-expanded', 'false')
    button.innerHTML = FILTER_ICON + '<span>Feature category</span>' + CHEVRON_ICON
    wrapper.appendChild(button)

    var menu = document.createElement('div')
    menu.className = 'notes-weekly-filter-menu'
    menu.setAttribute('role', 'menu')
    wrapper.appendChild(menu)

    var items = categories.map(function (category) {
      var item = document.createElement('button')
      item.type = 'button'
      item.className = 'notes-weekly-filter-item'
      item.setAttribute('role', 'menuitemcheckbox')
      item.setAttribute('aria-checked', 'false')
      item.dataset.key = category.key
      item.innerHTML = '<span>' + category.label + '</span>' + CHECK_ICON
      menu.appendChild(item)
      return item
    })

    firstSect1.parentNode.insertBefore(wrapper, firstSect1)

    function applyFilter () {
      var activeKeys = Object.keys(selected).filter(function (key) { return selected[key] })
      var hasFilter = activeKeys.length > 0

      doc.querySelectorAll(':scope > .sect1').forEach(function (sect1) {
        var sectionbody = sect1.querySelector(':scope > .sectionbody')
        if (!sectionbody) return
        var anyVisible = false
        var firstVisibleChild = null

        Array.prototype.forEach.call(sectionbody.children, function (child) {
          var visible
          if (child.classList.contains('sect2')) {
            var h3 = child.querySelector(':scope > h3')
            var key = h3 ? slugify(h3.textContent) : null
            visible = !hasFilter || (key !== null && activeKeys.indexOf(key) !== -1)
          } else if (child.matches('table.tableblock')) {
            visible = !hasFilter
          } else {
            return
          }
          child.style.display = visible ? '' : 'none'
          if (visible) {
            anyVisible = true
            if (!firstVisibleChild) firstVisibleChild = child
          }
        })

        sect1.style.display = anyVisible ? '' : 'none'

        // reset every heading's alignment, then measure and set the exact pixel
        // margin needed to line up whichever one is first VISIBLE with the date,
        // rather than relying on a fixed margin value matching by coincidence
        sectionbody.querySelectorAll(':scope > .sect2 > h3').forEach(function (h3) {
          h3.classList.remove('notes-weekly-aligned-heading')
          h3.style.marginTop = ''
        })
        if (anyVisible && firstVisibleChild && firstVisibleChild.classList.contains('sect2')) {
          var h2 = sect1.querySelector(':scope > h2')
          var alignedH3 = firstVisibleChild.querySelector(':scope > h3')
          if (h2 && alignedH3) {
            alignedH3.classList.add('notes-weekly-aligned-heading')
            var currentMargin = parseFloat(window.getComputedStyle(alignedH3).marginTop) || 0
            var gap = h2.getBoundingClientRect().top - alignedH3.getBoundingClientRect().top
            alignedH3.style.marginTop = (currentMargin + gap) + 'px'
            // a second corrective pass accounts for margin-collapsing not always
            // shifting position 1:1 with the margin change (seen with negative values)
            var residual = h2.getBoundingClientRect().top - alignedH3.getBoundingClientRect().top
            if (residual !== 0) {
              alignedH3.style.marginTop = (parseFloat(alignedH3.style.marginTop) + residual) + 'px'
            }
          }
        }
      })
    }

    applyFilter()

    function setOpen (open) {
      menu.classList.toggle('is-open', open)
      button.setAttribute('aria-expanded', open ? 'true' : 'false')
    }

    button.addEventListener('click', function (event) {
      event.stopPropagation()
      setOpen(!menu.classList.contains('is-open'))
    })

    items.forEach(function (item) {
      item.addEventListener('click', function (event) {
        event.stopPropagation()
        var key = item.dataset.key
        selected[key] = !selected[key]
        item.setAttribute('aria-checked', selected[key] ? 'true' : 'false')
        applyFilter()
      })
    })

    document.addEventListener('click', function (event) {
      if (!wrapper.contains(event.target)) setOpen(false)
    })

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setOpen(false)
    })
  })
})()
