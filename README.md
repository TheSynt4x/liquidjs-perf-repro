# liquidjs-perf-repro

A/B benchmark and CPU profiles comparing the published `liquidjs@10.30.1` against a PR branch.

- **baseline**: `liquidjs@10.30.1` from npm (pinned in `package.json`)
- **candidate**: `perf/sync-yield-overhead` from https://github.com/TheSynt4x/liquidjs, cloned and built by `npm run setup`

## Run it

```bash
npm ci
npm run all          # setup + bench (sync) + bench (async) + profile
```

Or step by step:

```bash
npm run setup                          # clone + `npm ci` + `npm run build:cjs` into .candidate/
node bench.js                          # sync A/B, all cases
node bench.js --async                  # async A/B
node bench.js --case upstream-todolist --seconds 20
node profile.js --case email-components   # writes profiles/*.cpuprofile
```

Overrides:

| env | effect |
|---|---|
| `CANDIDATE_BRANCH`, `CANDIDATE_REPO` | what `npm run setup` clones |
| `CANDIDATE=/abs/liquid.node.js` | use an existing build, skip setup |
| `BASELINE=/abs/liquid.node.js` | replace the npm baseline (e.g. A/A control, or a local `master` build) |

## Method

- Both builds load in one process and run **interleaved** in batches, in random order, after a warmup. The report shows the median per-render time and p10/p90.
- Before timing, each case renders once with both builds and **stops if the outputs aren't byte-identical**.
- Profiles use `node --cpu-prof --cpu-prof-interval 100`, with one process per side.

## Cases

| case | what |
|---|---|
| `email-components` | `renderFileSync` of an email whose rows `{% render %}` text/button/image partials with many `a.b.c \| default: x` lookups. It reproduces the flame graph from a production service, where nearly all time was nested `toValueSync`. |
| `upstream-todolist` | The upstream repo's own `perf:diff` case (`benchmark/templates/todolist.liquid` + `benchmark/data/todolist.json`), loaded from the candidate checkout. |

## Results

Node v24.21.0, Linux, Intel i7-1255U, candidate `perf/sync-yield-overhead @ 54c7d84`.

| case | mode | 10.30.1 | candidate | speedup |
|---|---|---|---|---|
| email-components | sync | 6.76 ms | 3.53 ms | **1.91x** |
| upstream-todolist | sync | 84.4 µs | 47.0 µs | **1.79x** |
| email-components | async | 11.40 ms | 4.75 ms | **2.40x** |
| upstream-todolist | async | 138.8 µs | 65.0 µs | **2.14x** |

A/A control (`BASELINE` = candidate build): 0.97x and 1.00x, so noise is about ±3%.

### Profile: self time as a share of time inside liquidjs (email-components)

| function | 10.30.1 | candidate |
|---|---|---|
| `toValueSync` | 46.5% | 18.8% |
| `isIterator` | 9.3% | 3.1% |
| `evalTokenValue` | 2.0% | 0.0% |
| max `toValueSync` recursion depth | 25 | 19 |

The other functions' *shares* rise because the total shrank by half. Their absolute time is about flat.
