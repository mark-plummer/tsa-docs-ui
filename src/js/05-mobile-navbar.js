;(function () {
  'use strict'

  var sectionDropdown = document.querySelector('.mobile-section-dropdown')
  var sectionToggle = document.querySelector('.mobile-section-toggle')
  if (!sectionToggle || !sectionDropdown) return

  sectionToggle.addEventListener('click', function (e) {
    e.stopPropagation()
    var expanded = sectionDropdown.classList.toggle('is-active')
    sectionToggle.setAttribute('aria-expanded', String(expanded))
  })

  document.addEventListener('click', function () {
    if (sectionDropdown.classList.contains('is-active')) {
      sectionDropdown.classList.remove('is-active')
      sectionToggle.setAttribute('aria-expanded', 'false')
    }
  })

  sectionDropdown.addEventListener('click', function (e) {
    e.stopPropagation()
  })
})()
