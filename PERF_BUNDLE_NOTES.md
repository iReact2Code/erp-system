# Bundle Optimization Notes

This document summarizes the bundle-related optimizations just applied and how to measure them.

## Changes Implemented

1. Removed unused `recharts` dependency (was present but not imported).
2. Added `@next/bundle-analyzer` integrated via `ANALYZE=true` env flag.
3. Introduced dynamic, client-only code splitting for the date range picker (`DatePickerWithRangeLazy`).
4. Added optional lazy wrapper for reports module (`ReportsComponentLazy`) guarded by `NEXT_PUBLIC_LAZY_REPORTS`.

## Environment Flags

| Flag                       | Purpose                                                  | Values                   |
| -------------------------- | -------------------------------------------------------- | ------------------------ |
| `ANALYZE`                  | Enable bundle analyzer at build time                     | `true` / unset           |
| `NEXT_PUBLIC_LAZY_REPORTS` | (Future) toggle to experiment with eager vs lazy reports | `1` (lazy) / `0` (eager) |

## Running Analyzer

```powershell
$env:ANALYZE='true'; npm run build
```

Analyzer reports will be emitted (default from plugin) inside `.next` under `analyze/` (client & server HTML pages). Open them locally in a browser.

## Measuring Impact

1. Record pre-change main/app bundle size (baseline).
2. After dynamic imports, rebuild and compare: look for removal of `react-day-picker` from the initial critical chunk.
3. Confirm that `recharts` no longer appears in any chunk tree (it should not be installed).

## Current Analyzer Snapshot (Post-Optimization)

Build run with Turbopack + ANALYZE=true.

Top App Routes (First Load JS includes shared chunks):

| Route               | Route Size | First Load JS |
| ------------------- | ---------- | ------------- |
| /[locale]/inventory | 10.8 kB    | 191 kB        |
| /[locale]/orders    | 18.9 kB    | 199 kB        |
| /[locale]/purchases | 14.4 kB    | 195 kB        |
| /[locale]/sales     | 14.8 kB    | 195 kB        |
| /[locale]/users     | 5.48 kB    | 186 kB        |
| /[locale]/reports   | 1.6 kB     | 182 kB        |

Shared First Load JS bundle total: 130 kB (includes framework + common UI + intl + styles). Reports page is now very light (1.6 kB route chunk) because heavy logic/code is deferred via lazy component.

Observation:

- Reports route benefited from lazy loading (small route chunk).
- Inventory route still relatively larger due to table + hooks; potential future split (filters, modals, virtualization code) if needed.
- No `recharts` in dependency graph. Date picker only loaded when the lazy component is rendered.

Next Potential Improvements:

- Extract rarely-used order detail dialog into dynamic import.
- Consider dynamic import for large form components on inventory/sales pages.
- Introduce bundle size budgets (e.g. fail CI if First Load JS shared > 150 kB after gzip/brotli) using a script that parses `.next/analyze` JSON (or `next build --no-lint` + custom analyzer).

## Potential Further Reductions

- Split large dashboard/report composite components using route-level boundaries.
- Audit any future chart library usage: isolate into its own dynamic chunk.
- Consider partial locale/time formatting libs if adding heavy i18n date formatting beyond `Intl`.
- Add a size budget check (e.g., custom script using `source-map-explorer` or `bundlesize`).

## Rollback Strategy

All changes are additive or subtractive without API surface alterations. Reintroduce `recharts` by reinstalling and importing lazily only inside chart components.

## Next Candidates

- Bundle size guard in CI.
- Tree-shake verification script.
- Accessibility and pagination ARIA improvements (next roadmap item).

---

Maintained as part of performance initiative. Update when new lazy modules are added.
