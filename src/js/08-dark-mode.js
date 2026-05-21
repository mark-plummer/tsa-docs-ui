;(function () {
  'use strict'

  var root = document.documentElement

  function isDark () {
    var theme = root.dataset.theme
    if (theme === 'dark') return true
    if (theme === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  function setTheme (dark) {
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (dark === systemDark) {
      delete root.dataset.theme
      window.localStorage.removeItem('theme')
    } else {
      root.dataset.theme = dark ? 'dark' : 'light'
      window.localStorage.setItem('theme', dark ? 'dark' : 'light')
    }
    updateLabel()
  }

  function updateLabel () {
    var label = isDark() ? 'Switch to light mode' : 'Switch to dark mode'
    var toggles = document.querySelectorAll('.theme-toggle')
    toggles.forEach(function (toggle) { toggle.setAttribute('aria-label', label) })
  }

  var toggles = document.querySelectorAll('.theme-toggle')
  toggles.forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      setTheme(!isDark())
    })
  })

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (!window.localStorage.getItem('theme')) updateLabel()
  })

  updateLabel()
})()
