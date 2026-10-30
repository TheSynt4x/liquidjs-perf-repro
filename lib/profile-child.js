const { versions } = require('./versions')
const { cases } = require('./cases')
const [side, name, seconds] = process.argv.slice(2)
const run = cases[name](versions[side]).sync
const end0 = Date.now() + 1000
while (Date.now() < end0) run()
const end = Date.now() + seconds * 1e3
let n = 0
while (Date.now() < end) { run(); n++ }
process.stdout.write(String(n / seconds))
