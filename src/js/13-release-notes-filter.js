;(function () {
  'use strict'

  var STATUSES = [
    { key: 'all', label: 'All' },
    { key: 'ga', label: 'GA' },
    { key: 'early-access', label: 'Early Access' },
    { key: 'beta', label: 'Beta' },
  ]

  var FILTER_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" class="release-notes-filter-label-icon" aria-hidden="true">' +
    '<path d="M2 5h20"/><path d="M6 12h12"/><path d="M9 19h6"/></svg>'

  function slugify (text) {
    return text.trim().toLowerCase().replace(/\s+/g, '-')
  }

  document.querySelectorAll('.release-notes-filter').forEach(function (section) {
    var entries = []
    section.querySelectorAll('.dlist dt').forEach(function (dt) {
      var dd = dt.nextElementSibling
      if (!dd || dd.tagName !== 'DD') return
      var badge = dt.querySelector('.badge')
      entries.push({ dt: dt, dd: dd, status: badge ? slugify(badge.textContent) : null })
    })
    if (!entries.length) return

    var toolbar = document.createElement('div')
    toolbar.className = 'release-notes-filter-toolbar'

    var label = document.createElement('div')
    label.className = 'release-notes-filter-label'
    label.innerHTML = FILTER_ICON + '<span>Features by status</span>'
    toolbar.appendChild(label)

    var buttonGroup = document.createElement('div')
    buttonGroup.className = 'release-notes-filter-buttons'
    buttonGroup.setAttribute('role', 'group')
    buttonGroup.setAttribute('aria-label', 'Filter by feature status')
    toolbar.appendChild(buttonGroup)

    var buttons = STATUSES.map(function (status) {
      var btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'release-notes-filter-btn' + (status.key === 'all' ? ' is-active' : '')
      btn.dataset.status = status.key
      btn.textContent = status.label
      btn.setAttribute('aria-pressed', status.key === 'all' ? 'true' : 'false')
      buttonGroup.appendChild(btn)
      return btn
    })

    var sectionBody = section.querySelector('.sectionbody') || section
    var firstSubsection = sectionBody.querySelector('.sect2')
    sectionBody.insertBefore(toolbar, firstSubsection || sectionBody.firstChild)

    function applyFilter (statusKey) {
      entries.forEach(function (entry) {
        var visible = statusKey === 'all' || entry.status === statusKey
        entry.dt.style.display = visible ? '' : 'none'
        entry.dd.style.display = visible ? '' : 'none'
      })

      section.querySelectorAll('.dlist').forEach(function (dlist) {
        var visible = Array.prototype.some.call(dlist.querySelectorAll('dt'), function (dt) {
          return dt.style.display !== 'none'
        })
        dlist.style.display = visible ? '' : 'none'
      })

      section.querySelectorAll('.sect2').forEach(function (sect2) {
        var visible = Array.prototype.some.call(sect2.querySelectorAll('.dlist'), function (dlist) {
          return dlist.style.display !== 'none'
        })
        sect2.style.display = visible ? '' : 'none'
      })
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) {
          b.classList.remove('is-active')
          b.setAttribute('aria-pressed', 'false')
        })
        btn.classList.add('is-active')
        btn.setAttribute('aria-pressed', 'true')
        applyFilter(btn.dataset.status)
      })
    })
  })
})()
