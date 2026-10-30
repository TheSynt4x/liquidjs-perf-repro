#!/usr/bin/env node
// Interleaved A/B benchmark, baseline vs candidate, for every case.
// usage: node bench.js [--async] [--seconds N] [--case name]
const { performance } = require('perf_hooks')
const { versions, describe } = require('./lib/versions')
const { cases } = require('./lib/cases')

const args = process.argv.slice(2)
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
const mode = args.includes('--async') ? 'async' : 'sync'
const seconds = +opt('--seconds', 10)
const only = opt('--case')

const stat = xs => {
  const s = [...xs].sort((a, b) => a - b)
  return { median: s[s.length >> 1], p10: s[Math.floor(s.length * 0.1)], p90: s[Math.floor(s.length * 0.9)] }
}
const fmt = ms => ms >= 1 ? `${ms.toFixed(2)} ms` : `${(ms * 1e3).toFixed(1)} µs`

async function runCase (name, make) {
  const sides = Object.entries(versions).map(([side, lib]) => ({ side, run: make(lib)[mode], samples: [] }))
  // separate engines for the parity check so caches are not shared with the timed runs
  const outs = await Promise.all(Object.values(versions).map(lib => make(lib)[mode]()))
  if (outs[0] !== outs[1]) throw new Error(`${name}: OUTPUT MISMATCH between baseline and candidate`)

  const call = async s => { const r = s.run(); if (mode === 'async') await r }
  const t0 = performance.now()
  let one = 0
  for (const s of sides) { const a = performance.now(); await call(s); one = Math.max(one, performance.now() - a) }
  const batch = Math.max(1, Math.round(5 / Math.max(one, 0.01)))
  while (performance.now() - t0 < 1500) for (const s of sides) await call(s) // warmup

  const end = performance.now() + seconds * 1e3
  while (performance.now() < end) {
    for (const s of (Math.random() < 0.5 ? sides : [...sides].reverse())) {
      const a = performance.now()
      for (let i = 0; i < batch; i++) await call(s)
      s.samples.push((performance.now() - a) / batch)
    }
  }
  const [b, c] = sides.map(s => ({ ...stat(s.samples), n: s.samples.length * batch }))
  return { name, out: outs[0].length, b, c, speedup: b.median / c.median }
}

;(async () => {
  const d = describe()
  console.log(`node ${process.version} | ${mode} | ${seconds}s per case`)
  console.log(`baseline:  ${d.baseline}\ncandidate: ${d.candidate}\n`)
  const rows = []
  for (const [name, make] of Object.entries(cases)) {
    if (only && only !== name) continue
    const r = await runCase(name, make)
    rows.push(r)
    console.log(`${name}  (output ${r.out} chars, identical ✓)`)
    console.log(`  baseline   median ${fmt(r.b.median)}  p10 ${fmt(r.b.p10)}  p90 ${fmt(r.b.p90)}  n=${r.b.n}`)
    console.log(`  candidate  median ${fmt(r.c.median)}  p10 ${fmt(r.c.p10)}  p90 ${fmt(r.c.p90)}  n=${r.c.n}`)
    console.log(`  speedup    ${r.speedup.toFixed(2)}x\n`)
  }
  console.log(`| case (${mode}) | baseline median | candidate median | speedup |`)
  console.log('|---|---|---|---|')
  for (const r of rows) console.log(`| ${r.name} | ${fmt(r.b.median)} | ${fmt(r.c.median)} | **${r.speedup.toFixed(2)}x** |`)
})().catch(e => { console.error(e.message); process.exit(2) })
