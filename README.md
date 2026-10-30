# liquidjs-perf-repro

A/B benchmark and CPU profiles comparing the published `liquidjs@10.30.1` against a PR branch.

- **baseline**: `liquidjs@10.30.1` from npm (pinned in `package.json`)
- **candidate**: `perf/render-limit-and-loader` from https://github.com/TheSynt4x/liquidjs, cloned and built by `npm run setup`

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

Node v24.21.0, Linux, Intel i7-1255U, candidate `perf/render-limit-and-loader` (applied to upstream `master` on its own, independent of `perf/sync-yield-overhead`).

| case | mode | 10.30.1 | candidate | speedup |
|---|---|---|---|---|
| email-components | sync | 6.84 ms | 6.56 ms | **1.04x** |
| upstream-todolist | sync | 82.3 µs | 77.5 µs | **1.06x** |
| email-components | async | 10.87 ms | 10.47 ms | **1.04x** |
| upstream-todolist | async | 124.2 µs | 116.3 µs | **1.07x** |

A/A control (`BASELINE` = candidate build): 1.00x and 1.00x.

On top of `perf/sync-yield-overhead` (both patches applied to `master`, compared with that branch alone), the same change is worth **1.10x** (email-components) and **1.12x** (upstream-todolist) sync, because it removes a fixed per-node cost that becomes a larger share once the generator overhead is gone.

### Profile: self time as a share of time inside liquidjs

| function | case | 10.30.1 | candidate |
|---|---|---|---|
| `performance.now` (native) | upstream-todolist | 3.0% | 0.0% |
| `getPerformance` | upstream-todolist | 1.7% | 0.0% |
| `performance.now` (native) | email-components | 1.8% | 0.0% |
| `getPerformance` | email-components | 1.1% | 0.0% |
| `Loader` constructor | email-components | 0.9% | 0.1% |

Results for the earlier PR are on the [`perf/sync-yield-overhead`](https://github.com/TheSynt4x/liquidjs-perf-repro/tree/perf/sync-yield-overhead) branch.
