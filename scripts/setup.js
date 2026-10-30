#!/usr/bin/env node
// Clone the candidate branch into .candidate/ and build its CommonJS bundle.
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const { repo, branch } = require('../config')

const dir = path.join(__dirname, '..', '.candidate')
const run = (cmd, cwd = dir) => execSync(cmd, { cwd, stdio: 'inherit' })

fs.rmSync(dir, { recursive: true, force: true })
run(`git clone --depth 1 --branch ${branch} ${repo} .candidate`, path.dirname(dir))
run('npm ci --no-audit --no-fund --ignore-scripts')
run('npm run build:cjs')
const sha = execSync('git rev-parse --short HEAD', { cwd: dir }).toString().trim()
console.log(`\ncandidate ready: ${branch} @ ${sha} -> .candidate/dist/liquid.node.js`)
