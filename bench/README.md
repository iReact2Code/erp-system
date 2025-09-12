# Benchmarks

This folder contains a small synthetic benchmark to exercise the API cache/dedupe paths.

How to run locally:

1. Start the app locally (`pnpm dev`, `npm run dev`, or equivalent).
2. Run the benchmark:

```bash
node bench/bench-cache.js
```

CI behavior: A GitHub Actions workflow runs this script with conservative defaults; to fail CI on slow results set `BENCH_FAIL_ON_SLOW=true` in the workflow and choose an appropriate `BENCH_FAIL_THRESHOLD_MS`.
