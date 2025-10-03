# SBOM Generation

This project produces a CycloneDX Software Bill of Materials (SBOM) in CI for both JSON and XML formats.

## Purpose

- Supply chain transparency (list of all dependencies & versions)
- Enables downstream vulnerability correlation and license analysis
- Facilitates incident response and compliance audits

## Workflow

Workflow file: `.github/workflows/sbom.yml`

- Triggers on pushes & PRs to `main`/`develop` and weekly schedule
- Runs frozen install via `npm ci`
- Generates: `sbom.json` & `sbom.xml`
- Uploads artifacts for download / archiving

## Local Generation

```bash
npm run sbom      # JSON (CycloneDX 1.5)
npm run sbom:xml  # XML  (CycloneDX 1.5)
```

Artifacts are written to project root.

## Tooling

Using `@cyclonedx/cyclonedx-npm` to output a full dependency graph including dev dependencies. For production-only SBOM you can add `--omit dev` (future optional script variant).

## Future Enhancements

- Integrate vulnerability correlation (e.g., Grype or Dependency Track ingestion)
- Generate SPDX format alongside CycloneDX
- Sign SBOM (attestation) with Sigstore / cosign
- Automate diff highlighting between successive SBOMs

## Policy Integration

If a policy to block critical vulnerabilities is adopted:

1. Run vulnerability scanner (e.g., `npm audit --json` or `grype sbom:sbom.json`).
2. Parse results; fail CI on severity threshold.
3. Attach annotated SARIF to GitHub Security tab.

## Troubleshooting

- Missing dependencies? Ensure lockfile committed and use `npm ci`.
- Action failing to resolve? Confirm GitHub Actions runners have network access and no proxy blocks registry.

---

Maintained as part of supply chain security posture.
