#!/usr/bin/env node
// CPU-profile baseline and candidate on one case (sync), print a per-function self-time diff.
// usage: node profile.js [--case email-components] [--seconds 5]
// writes profiles/<case>.<side>.cpuprofile  (open in Chrome DevTools or https://www.speedscope.app)
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const { summarize } = require('./lib/analyze')

const args = process.argv.slice(2)
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
const name = opt('--case', 'email-components')
const seconds = opt('--seconds', '5')
const dir = path.join(__dirname, 'profiles')
fs.mkdirSync(dir, { recursive: true })

const sums = {}
for (const side of ['baseline', 'candidate']) {
  const file = `${name}.${side}.cpuprofile`
  fs.rmSync(path.join(dir, file), { force: true })
  const out = execFileSync(process.execPath, ['--cpu-prof', '--cpu-prof-dir', dir, `--cpu-prof-name=${file}`, '--cpu-prof-interval', '100',
    path.join(__dirname, 'lib/profile-child.js'), side, name, seconds])
  sums[side] = { ...summarize(JSON.parse(fs.readFileSync(path.join(dir, file)))), rps: +out }
}
const { baseline: b, candidate: c } = sums
const keys = new Set([...Object.keys(b.fns), ...Object.keys(c.fns)])
const rows = [...keys].map(k => {
  const x = b.fns[k] || { self: 0, total: 0 }; const y = c.fns[k] || { self: 0, total: 0 }
  return { k, bs: x.self / b.renderTime, cs: y.self / c.renderTime }
}).sort((p, q) => Math.max(q.bs, q.cs) - Math.max(p.bs, p.cs)).slice(0, 15)
const pct = x => (x * 100).toFixed(1) + '%'
console.log(`case ${name}: ${b.rps.toFixed(0)} -> ${c.rps.toFixed(0)} renders/s under profiler (${(c.rps / b.rps).toFixed(2)}x)`)
console.log(`max toValueSync recursion depth: ${b.maxDepth} -> ${c.maxDepth}\n`)
console.log('| function | baseline self | candidate self |\n|---|---|---|')
for (const r of rows) console.log(`| \`${r.k}\` | ${pct(r.bs)} | ${pct(r.cs)} |`)
console.log(`\nprofiles: profiles/${name}.{baseline,candidate}.cpuprofile`)
