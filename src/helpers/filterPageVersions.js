'use strict'

const VERSION_SORT_KEY = 'version-sort-key'

module.exports = (pageVersions, componentName, siteComponents) => {
  if (!pageVersions || !componentName || !siteComponents) return pageVersions
  const component = siteComponents[componentName]
  if (!component) return pageVersions
  return pageVersions.filter((pv) => {
    const cv = component.versions.find((v) => v.version === pv.version)
    return !cv || cv.asciidoc.attributes[VERSION_SORT_KEY] !== '!'
  })
}
