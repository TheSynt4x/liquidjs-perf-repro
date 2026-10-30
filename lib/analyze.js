// Summarize a V8 .cpuprofile: self/total time per function (samples inside liquidjs), toValueSync recursion depth.
const path = require('path')
function summarize (prof) {
  const inLiquid = n => /liquid\.node\.js$/.test(n.callFrame.url)
  const nodes = new Map(prof.nodes.map(n => [n.id, n]))
  const parent = new Map()
  for (const n of prof.nodes) for (const c of n.children || []) parent.set(c, n.id)
  const label = n => `${n.callFrame.functionName || '(anon)'} (${path.basename(n.callFrame.url || '') || 'native'})`
  const dt = new Map()
  for (let i = 0; i < prof.samples.length; i++) dt.set(i, prof.timeDeltas[i + 1] || 0)
  const fns = {}
  let renderTime = 0; let maxDepth = 0
  const cache = new Map()
  const stackOf = id => {
    if (cache.has(id)) return cache.get(id)
    const s = []
    for (let x = id; x !== undefined; x = parent.get(x)) s.push(nodes.get(x))
    cache.set(id, s); return s
  }
  prof.samples.forEach((id, i) => {
    const stack = stackOf(id)
    if (!stack.some(inLiquid)) return
    const t = dt.get(i); renderTime += t
    const seen = new Set()
    let depth = 0
    stack.forEach((n, j) => {
      const k = label(n)
      if (n.callFrame.functionName === 'toValueSync') depth++
      fns[k] = fns[k] || { self: 0, total: 0 }
      if (j === 0) fns[k].self += t
      if (!seen.has(k)) { seen.add(k); fns[k].total += t }
    })
    maxDepth = Math.max(maxDepth, depth)
  })
  const wall = (prof.endTime - prof.startTime)
  return { fns, renderTime, maxDepth, rps: 0, wall }
}
module.exports = { summarize }
