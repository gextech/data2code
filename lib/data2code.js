'use strict'
var Handlebars = require('handlebars')

var processParsers = function (tmpl, gen, data) {
  var sdata = JSON.parse(JSON.stringify(data))
  var parsed
  if (typeof tmpl.parser === 'function') {
    parsed = tmpl.parser(sdata)
  } else if (typeof gen.parser === 'function') {
    parsed = gen.parser(sdata)
  } else {
    parsed = sdata
  }

  return parsed
}
var compileTemplate = function (tmpl) {
  if (typeof tmpl === 'function') {
    return tmpl
  } else if (typeof tmpl === 'string') {
    return Handlebars.compile(tmpl)
  }
}

var handleObjectTemplate = function (tmpl) {

  var key = Object.keys(tmpl)[0]
  var template = {}
  template[key] = {}
  if (typeof tmpl !== 'object') {
    throw new Error('generator.template should be an object')
  }

  if (typeof tmpl[key] === 'object') {
    template[key].tmpl = compileTemplate(tmpl[key].tmpl)
    template[key].parser = tmpl[key].parser
  } else if (typeof tmpl[key] === 'string') {
    template[key].tmpl = compileTemplate(tmpl[key])
  } else if (typeof tmpl[key] === 'function') {
    template[key].tmpl = tmpl[key]
  }
  return template
}

var handleTemplates = function (tmpls) {
  var templates = []
  if (tmpls === undefined) {
    return templates
  }

  if (Array.isArray(tmpls)) {
    tmpls.forEach(function (tmpl) {
      templates.push(handleObjectTemplate(tmpl))
    })
  } else {
    throw new Error('gen.templates must be array')
  }

  return templates
}

var bindTemplate = function (key, tmplDef, data, options) {
  var htmpl = tmplDef[key].tmpl
  var result = {}
  var nameTmpl = Handlebars.compile(key)
  result[nameTmpl(data, options)] = htmpl(data, options)
  return result
}
module.exports.process = function (data, gen) {

  var templates = []
  if (gen.template !== undefined) {
    templates = templates.concat(handleObjectTemplate(gen.template))
  }
  templates = templates.concat(handleTemplates(gen.templates))
  var options = {
    helpers: gen.helpers,
    partials: gen.partials
  }

  var results = []
  templates.forEach(function (template) {
    var key = Object.keys(template)[0]
    var dataParsed = processParsers(template[key], gen, data)
    if (Array.isArray(dataParsed)) {
      dataParsed.forEach(function (element) {
        results.push(bindTemplate(key, template, element, options))
      })
    } else {
      results.push(bindTemplate(key, template, dataParsed, options))
    }
  })

  return results

}
