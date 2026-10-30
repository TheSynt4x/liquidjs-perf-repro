// Each case builds { sync(), async() } for a given liquidjs build.
const fs = require('fs')
const path = require('path')
const { candidateRoot } = require('./versions')

const cases = {
  // Production-shaped: renderFileSync of an email whose rows {% render %} component partials.
  'email-components': lib => {
    const { Liquid } = require(lib)
    const root = path.join(__dirname, '../cases/email')
    const engine = new Liquid({ root, extname: '.liquid', cache: true })
    const data = require('../cases/email/data')()
    return {
      sync: () => engine.renderFileSync('email', data),
      async: () => engine.renderFile('email', data)
    }
  },
  // The upstream repo's own perf:diff case (benchmark/templates/todolist), loaded from the candidate checkout.
  'upstream-todolist': lib => {
    const { Liquid } = require(lib)
    const root = path.join(candidateRoot, 'benchmark/templates')
    const engine = new Liquid({ root, extname: '.liquid', cache: true })
    engine.registerFilter('url', p => `https://example.com${p}`)
    const tpl = engine.parse(fs.readFileSync(path.join(root, 'todolist.liquid'), 'utf8'))
    const data = require(path.join(candidateRoot, 'benchmark/data/todolist.json'))
    return {
      sync: () => engine.renderSync(tpl, data),
      async: () => engine.render(tpl, data)
    }
  }
}
module.exports = { cases }
