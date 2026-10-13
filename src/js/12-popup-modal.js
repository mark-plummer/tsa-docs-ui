;(function () {
  'use strict'

  document.querySelectorAll('.popup-modal').forEach(function (modal) {
    var overlay = document.createElement('div')
    overlay.className = 'popup-modal-overlay'

    var closeBtn = document.createElement('button')
    closeBtn.className = 'popup-modal-close'
    closeBtn.type = 'button'
    closeBtn.setAttribute('aria-label', 'Close')
    closeBtn.innerHTML = '&times;'

    modal.parentNode.insertBefore(overlay, modal)
    overlay.appendChild(modal)
    modal.insertBefore(closeBtn, modal.firstChild)

    function close () {
      overlay.classList.remove('is-open')
      document.body.classList.remove('popup-modal-locked')
    }

    function open () {
      overlay.classList.add('is-open')
      document.body.classList.add('popup-modal-locked')
    }

    closeBtn.addEventListener('click', close)

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close()
    })

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) close()
    })

    // double rAF ensures the initial (closed) state paints before the
    // is-open class is added, so the opening transition actually plays
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(open)
    })
  })
})()
