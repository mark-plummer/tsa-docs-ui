;(function () {
  'use strict'

  var SECT_CLASS_RX = /^sect(\d)$/

  var navContainer = document.querySelector('.nav-container')
  var navToggle = document.querySelector('.nav-toggle')
  var mobileNavToggle = document.querySelector('.mobile-nav-toggle')
  if (!navContainer) return
  var nav = navContainer.querySelector('.nav')
  var navMenuToggle = navContainer.querySelector('.nav-menu-toggle')

  if (navToggle) navToggle.addEventListener('click', showNav)
  if (mobileNavToggle) mobileNavToggle.addEventListener('click', showNav)
  navContainer.addEventListener('click', trapEvent)

  var menuPanel = navContainer.querySelector('[data-panel=menu]')
  if (!menuPanel) return
  var explorePanel = navContainer.querySelector('[data-panel=explore]')

  var currentPageItem = menuPanel.querySelector('.is-current-page')
  var originalPageItem = currentPageItem
  nav.classList.add('is-initializing')

  // Validate is-current-page against the actual URL and correct if needed.
  // This handles cases where the nav is built with a hardcoded page URL that
  // doesn't match the page being served (e.g. the UI preview server).
  var currentFile = window.location.pathname.split('/').pop() || 'index.html'
  var urlMatchedLink = menuPanel.querySelector('.nav-link[href="' + currentFile + '"]') ||
    menuPanel.querySelector('.nav-link[href$="/' + currentFile + '"]')
  if (urlMatchedLink && urlMatchedLink.parentElement !== currentPageItem) {
    if (currentPageItem) currentPageItem.classList.remove('is-current-page')
    currentPageItem = urlMatchedLink.parentElement
    currentPageItem.classList.add('is-current-page')
    originalPageItem = currentPageItem
  }
  if (currentPageItem) {
    activateCurrentPath(currentPageItem)
    scrollItemToMidpoint(menuPanel, currentPageItem.querySelector('.nav-link'))
  } else {
    menuPanel.scrollTop = 0
  }
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      nav.classList.remove('is-initializing')
    })
  })

  find(menuPanel, '.nav-item-toggle').forEach(function (btn) {
    var li = btn.parentElement
    btn.addEventListener('click', toggleActive.bind(li))
    var navItemSpan = findNextElement(btn, '.nav-text')
    if (navItemSpan) {
      navItemSpan.style.cursor = 'pointer'
      navItemSpan.addEventListener('click', toggleActive.bind(li))
    }
    var navLink = li.querySelector(':scope > .nav-link')
    if (navLink) {
      navLink.addEventListener('click', function (e) {
        var href = navLink.getAttribute('href')
        if (!href || href.charAt(0) === '#') {
          e.preventDefault()
          toggleActive.call(li)
        } else if (li.classList.contains('is-active') && li.classList.contains('is-current-page')) {
          e.preventDefault()
        }
      })
    }
  })

  if (navMenuToggle && menuPanel.querySelector('.nav-item-toggle')) {
    navMenuToggle.style.display = ''
    navMenuToggle.addEventListener('click', function () {
      var collapse = !this.classList.toggle('is-active')
      find(menuPanel, '.nav-item > .nav-item-toggle').forEach(function (btn) {
        collapse ? btn.parentElement.classList.remove('is-active') : btn.parentElement.classList.add('is-active')
      })
      if (currentPageItem) {
        if (collapse) activateCurrentPath(currentPageItem)
        scrollItemToMidpoint(menuPanel, currentPageItem.querySelector('.nav-link'))
      } else {
        menuPanel.scrollTop = 0
      }
    })
  }

  if (explorePanel) {
    explorePanel.querySelector('.context').addEventListener('click', function () {
      // NOTE logic assumes there are only two panels
      find(nav, '[data-panel]').forEach(function (panel) {
        panel.classList.toggle('is-active')
      })
    })
  }

  // NOTE prevent text from being selected by double click
  menuPanel.addEventListener('mousedown', function (e) {
    if (e.detail > 1) e.preventDefault()
  })

  function onHashChange () {
    var navLink
    var hash = window.location.hash
    if (hash) {
      if (hash.indexOf('%')) hash = decodeURIComponent(hash)
      navLink = menuPanel.querySelector('.nav-link[href="' + hash + '"]')
      if (!navLink) {
        var targetNode = document.getElementById(hash.slice(1))
        if (targetNode) {
          var current = targetNode
          var ceiling = document.querySelector('article.doc')
          while ((current = current.parentNode) && current !== ceiling) {
            var id = current.id
            // NOTE: look for section heading
            if (!id && (id = SECT_CLASS_RX.test(current.className))) id = (current.firstElementChild || {}).id
            if (id && (navLink = menuPanel.querySelector('.nav-link[href="#' + id + '"]'))) break
          }
        }
      }
    }
    var navItem
    if (navLink) {
      navItem = navLink.parentNode
    } else if (originalPageItem) {
      navLink = (navItem = originalPageItem).querySelector('.nav-link')
    } else {
      return
    }
    if (navItem === currentPageItem) return
    find(menuPanel, '.nav-item.is-active').forEach(function (el) {
      el.classList.remove('is-active', 'is-current-path', 'is-current-page')
    })
    navItem.classList.add('is-current-page')
    currentPageItem = navItem
    activateCurrentPath(navItem)
    scrollItemToMidpoint(menuPanel, navLink)
  }

  if (menuPanel.querySelector('.nav-link[href^="#"]')) {
    if (window.location.hash) onHashChange()
    window.addEventListener('hashchange', onHashChange)
  }

  function activateCurrentPath (navItem) {
    var ancestorClasses
    var ancestor = navItem.parentNode
    while (!(ancestorClasses = ancestor.classList).contains('nav-menu')) {
      if (ancestor.tagName === 'LI' && ancestorClasses.contains('nav-item')) {
        ancestorClasses.add('is-active', 'is-current-path')
      }
      ancestor = ancestor.parentNode
    }
    navItem.classList.add('is-active')
  }

  function toggleActive () {
    if (this.classList.toggle('is-active')) {
      var padding = parseFloat(window.getComputedStyle(this).marginTop)
      var rect = this.getBoundingClientRect()
      var menuPanelRect = menuPanel.getBoundingClientRect()
      var overflowY = (rect.bottom - menuPanelRect.top - menuPanelRect.height + padding).toFixed()
      if (overflowY > 0) menuPanel.scrollTop += Math.min((rect.top - menuPanelRect.top - padding).toFixed(), overflowY)
    }
  }

  function showNav (e) {
    var isActive = (navToggle && navToggle.classList.contains('is-active')) ||
      (mobileNavToggle && mobileNavToggle.classList.contains('is-active'))
    if (isActive) return hideNav(e)
    trapEvent(e)
    var html = document.documentElement
    html.classList.add('is-clipped--nav')
    if (navToggle) navToggle.classList.add('is-active')
    if (mobileNavToggle) {
      mobileNavToggle.classList.add('is-active')
      mobileNavToggle.setAttribute('aria-expanded', 'true')
      mobileNavToggle.setAttribute('aria-label', 'Close navigation')
    }
    navContainer.classList.add('is-active')
    var bounds = nav.getBoundingClientRect()
    var expectedHeight = window.innerHeight - Math.round(bounds.top)
    if (Math.round(bounds.height) !== expectedHeight) nav.style.height = expectedHeight + 'px'
    html.addEventListener('click', hideNav)
  }

  function closeNav () {
    var html = document.documentElement
    html.classList.remove('is-clipped--nav')
    if (navToggle) navToggle.classList.remove('is-active')
    if (mobileNavToggle) {
      mobileNavToggle.classList.remove('is-active')
      mobileNavToggle.setAttribute('aria-expanded', 'false')
      mobileNavToggle.setAttribute('aria-label', 'Open navigation')
    }
    navContainer.classList.remove('is-active')
    html.removeEventListener('click', hideNav)
  }

  function hideNav (e) {
    trapEvent(e)
    closeNav()
  }

  find(menuPanel, '.nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
      if (window.innerWidth < 1024) closeNav()
    })
  })

  find(navContainer, '.version-menu a').forEach(function (link) {
    link.addEventListener('click', function () {
      if (window.innerWidth < 1024) closeNav()
    })
  })

  function trapEvent (e) {
    e.stopPropagation()
  }

  function scrollItemToMidpoint (panel, el) {
    var rect = panel.getBoundingClientRect()
    var effectiveHeight = rect.height
    var navStyle = window.getComputedStyle(nav)
    if (navStyle.position === 'sticky') effectiveHeight -= rect.top - parseFloat(navStyle.top)
    panel.scrollTop = Math.max(0, (el.getBoundingClientRect().height - effectiveHeight) * 0.5 + el.offsetTop)
  }

  function find (from, selector) {
    return [].slice.call(from.querySelectorAll(selector))
  }

  function findNextElement (from, selector) {
    var el = from.nextElementSibling
    return el && selector ? el[el.matches ? 'matches' : 'msMatchesSelector'](selector) && el : el
  }
})()
