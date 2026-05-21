;(function () {
  'use strict'

  var toggle = document.querySelector('.page-versions .version-menu-toggle')
  if (!toggle) return

  var selector = document.querySelector('.page-versions')

  toggle.addEventListener('click', function (e) {
    selector.classList.toggle('is-active')
    e.stopPropagation()
  })

  document.addEventListener('click', function (e) {
    if (!selector.contains(e.target)) selector.classList.remove('is-active')
  }, true)

  selector.querySelectorAll('.version-menu a').forEach(function (link) {
    link.addEventListener('click', function () {
      selector.classList.remove('is-active')
    })
  })
})()
