'use strict'

const Asciidoctor = require('@asciidoctor/core')()
require('@asciidoctor/tabs').register(Asciidoctor.Extensions)
const fs = require('fs-extra')

Asciidoctor.Extensions.register(function () {
  this.preprocessor(function () {
    this.process(function (doc, reader) {
      const lines = reader.readLines()
      const result = []
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^SPOTTER:\s+(.*)$/)
        if (match) {
          result.push('[SPOTTER]')
          result.push('====')
          result.push(match[1])
          result.push('====')
        } else {
          result.push(lines[i])
        }
      }
      reader.pushInclude(result, '<stdin>', '<stdin>', 1, {})
    })
  })
  this.block('SPOTTER', function () {
    this.onContext(['example'])
    this.process(function (parent, reader, attrs) {
      const lines = reader.readLines()
      const innerHtml = Asciidoctor.load(lines.join('\n'), { safe: 'safe' }).convert()
      const html = '<div class="admonitionblock spotter"><table><tr>' +
        '<td class="icon"><i class="icon-spotter" title="Spotter"></i></td>' +
        '<td class="content">' + innerHtml + '</td>' +
        '</tr></table></div>'
      return this.createPassBlock(parent, html, {}, {})
    })
  })
})
const handlebars = require('handlebars')
const merge = require('merge-stream')
const ospath = require('path')
const path = ospath.posix
const requireFromString = require('require-from-string')
const { Transform } = require('stream')
const map = (transform = () => {}, flush = undefined) => new Transform({ objectMode: true, transform, flush })
const vfs = require('vinyl-fs')
const yaml = require('js-yaml')

const ASCIIDOC_ATTRIBUTES = {
  experimental: '',
  icons: 'font',
  sectanchors: '',
  'source-highlighter': 'highlight.js',
  imagesdir: '_images',
}

module.exports = (src, previewSrc, previewDest, sink = () => map()) => (done) =>
  Promise.all([
    loadSampleUiModel(previewSrc),
    toPromise(
      merge(compileLayouts(src), registerPartials(src), registerHelpers(src), copyImages(previewSrc, previewDest))
    ),
  ])
    .then(([baseUiModel, { layouts }]) => {
      const extensions = ((baseUiModel.asciidoc || {}).extensions || []).map((request) => {
        ASCIIDOC_ATTRIBUTES[request.replace(/^@|\.js$/, '').replace(/[/]/g, '-') + '-loaded'] = ''
        const extension = require(request)
        extension.register.call(Asciidoctor.Extensions)
        return extension
      })
      const asciidoc = { extensions }
      for (const component of baseUiModel.site.components) {
        for (const version of component.versions || []) version.asciidoc = asciidoc
      }
      baseUiModel = { ...baseUiModel, env: process.env }
      delete baseUiModel.asciidoc
      return [baseUiModel, layouts]
    })
    .then(([baseUiModel, layouts]) =>
      vfs
        .src('**/*.adoc', { base: previewSrc, cwd: previewSrc })
        .pipe(
          map((file, enc, next) => {
            const siteRootPath = path.relative(ospath.dirname(file.path), ospath.resolve(previewSrc))
            const uiModel = { ...baseUiModel }
            uiModel.page = { ...uiModel.page }
            uiModel.siteRootPath = siteRootPath
            uiModel.uiRootPath = path.join(siteRootPath, '_')
            if (file.stem === '404') {
              uiModel.page = { layout: '404', title: 'Page Not Found' }
            } else {
              const asciidocAttrs = { ...ASCIIDOC_ATTRIBUTES, uiRootPath: uiModel.uiRootPath }
              const doc = Asciidoctor.load(file.contents, { safe: 'safe', attributes: asciidocAttrs })
              uiModel.page.attributes = Object.entries(doc.getAttributes())
                .filter(([name, val]) => name.startsWith('page-'))
                .reduce((accum, [name, val]) => {
                  accum[name.slice(5)] = val
                  return accum
                }, {})
              uiModel.page.description = doc.getAttribute('description')
              uiModel.page.layout = doc.getAttribute('page-layout', 'default')
              uiModel.page.title = doc.getDocumentTitle()
              uiModel.page.contents = Buffer.from(doc.convert())
            }
            file.extname = '.html'
            try {
              file.contents = Buffer.from(layouts.get(uiModel.page.layout)(uiModel))
              next(null, file)
            } catch (e) {
              next(transformHandlebarsError(e, uiModel.page.layout))
            }
          })
        )
        .pipe(vfs.dest(previewDest))
        .on('error', done)
        .pipe(sink())
    )

function loadSampleUiModel (src) {
  return fs.readFile(ospath.join(src, 'ui-model.yml'), 'utf8').then((contents) => yaml.safeLoad(contents))
}

function registerPartials (src) {
  return vfs.src('partials/*.hbs', { base: src, cwd: src }).pipe(
    map((file, enc, next) => {
      handlebars.registerPartial(file.stem, file.contents.toString())
      next()
    })
  )
}

function registerHelpers (src) {
  handlebars.registerHelper('resolvePage', resolvePage)
  handlebars.registerHelper('resolvePageURL', resolvePageURL)
  return vfs.src('helpers/*.js', { base: src, cwd: src }).pipe(
    map((file, enc, next) => {
      handlebars.registerHelper(file.stem, requireFromString(file.contents.toString()))
      next()
    })
  )
}

function compileLayouts (src) {
  const layouts = new Map()
  return vfs.src('layouts/*.hbs', { base: src, cwd: src }).pipe(
    map(
      (file, enc, next) => {
        const srcName = path.join(src, file.relative)
        layouts.set(file.stem, handlebars.compile(file.contents.toString(), { preventIndent: true, srcName }))
        next()
      },
      function (done) {
        this.push({ layouts })
        done()
      }
    )
  )
}

function copyImages (src, dest) {
  return vfs
    .src('**/*.{png,svg}', { base: src, cwd: src })
    .pipe(vfs.dest(dest))
    .pipe(map((file, enc, next) => next()))
}

function resolvePage (spec, context = {}) {
  if (spec) return { pub: { url: resolvePageURL(spec) } }
}

function resolvePageURL (spec, context = {}) {
  if (spec) return '/' + (spec = spec.split(':').pop()).slice(0, spec.lastIndexOf('.')) + '.html'
}

function transformHandlebarsError ({ message, stack }, layout) {
  const m = stack.match(/^ *at Object\.ret \[as (.+?)\]/m)
  const templatePath = `src/${m ? 'partials/' + m[1] : 'layouts/' + layout}.hbs`
  const err = new Error(`${message}${~message.indexOf('\n') ? '\n^ ' : ' '}in UI template ${templatePath}`)
  err.stack = [err.toString()].concat(stack.slice(message.length + 8)).join('\n')
  return err
}

function toPromise (stream) {
  return new Promise((resolve, reject, data = {}) =>
    stream
      .on('error', reject)
      .on('data', (chunk) => chunk.constructor === Object && Object.assign(data, chunk))
      .on('finish', () => resolve(data))
  )
}
