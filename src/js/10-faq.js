;(function () {
  'use strict'

  document.querySelectorAll('.faq .dlist dt').forEach(function (dt) {
    var dd = dt.nextElementSibling
    if (!dd || dd.tagName !== 'DD') return

    dt.setAttribute('aria-expanded', 'false')
    dt.setAttribute('tabindex', '0')
    dd.style.maxHeight = '0'

    function toggle () {
      var isOpen = dt.getAttribute('aria-expanded') === 'true'
      dt.setAttribute('aria-expanded', isOpen ? 'false' : 'true')

      if (isOpen) {
        dd.style.maxHeight = dd.scrollHeight + 'px'
        requestAnimationFrame(function () { dd.style.maxHeight = '0' })
      } else {
        dd.style.maxHeight = dd.scrollHeight + 'px'
        dd.addEventListener('transitionend', function onEnd () {
          dd.removeEventListener('transitionend', onEnd)
          if (dt.getAttribute('aria-expanded') === 'true') dd.style.maxHeight = 'none'
        })
      }
    }

    dt.addEventListener('click', toggle)
    dt.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggle()
      }
    })
  })
})()
