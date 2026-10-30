// Candidate = the PR branch. Override with env vars:
//   CANDIDATE_REPO, CANDIDATE_BRANCH  -> what `npm run setup` clones and builds
//   CANDIDATE=/abs/path/liquid.node.js -> skip setup, use an existing build
module.exports = {
  repo: process.env.CANDIDATE_REPO || 'https://github.com/TheSynt4x/liquidjs.git',
  branch: process.env.CANDIDATE_BRANCH || 'perf/render-limit-and-loader'
}
