;(function () {
  'use strict'

  if (typeof window.mediumZoom === 'undefined') return
  window.mediumZoom('.doc .imageblock img:not(.no-zoom)', {
    background: 'rgba(0, 0, 0, 0.8)',
  })
})()
