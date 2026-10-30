const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const root = path.join(__dirname, '..')
const candidate = process.env.CANDIDATE || path.join(root, '.candidate/dist/liquid.node.js')
if (!fs.existsSync(candidate)) {
  console.error(`candidate build not found: ${candidate}\nrun \`npm run setup\` first (or set CANDIDATE=...)`)
  process.exit(1)
}
const baseline = process.env.BASELINE || require.resolve('liquidjs')

function describe () {
  const bver = process.env.BASELINE ? 'custom' : require('liquidjs/package.json').version
  let csha = 'custom build'
  try { csha = execSync('git rev-parse --short HEAD', { cwd: path.dirname(path.dirname(candidate)), stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch (e) {}
  return { baseline: process.env.BASELINE ? path.relative(root, baseline) : `liquidjs@${bver} (npm)`, candidate: `${path.relative(root, candidate)} @ ${csha}` }
}

module.exports = { versions: { baseline, candidate }, describe, candidateRoot: path.dirname(path.dirname(candidate)) }
