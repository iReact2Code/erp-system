#!/usr/bin/env node
/**
 * License compliance scanner
 * - Uses `npm ls --json` to enumerate dependencies and their license field
 * - Compares against an allowlist loaded from license-allowlist.json
 * - Fails with non-zero exit if any disallowed license is found
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const allowlistPath = path.join(root, 'tools', 'license-allowlist.json')
const allowlist = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'))

function getPackageTree() {
  // Include prod + dev to catch violations early in PRs; CI can switch to prod-only if desired.
  const cmd = process.env.LICENSES_PROD_ONLY === '1' ? 'npm ls --omit=dev --json' : 'npm ls --all --json'
  try {
    const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] })
    const tree = JSON.parse(out.toString('utf8'))
    return tree
  } catch (err) {
    console.error('\nLicense scan could not enumerate dependencies. Ensure dependencies are installed first (npm ci).')
    if (process.env.CI !== 'true') {
      console.error('Tip: run "npm ci" locally before running the license scan.')
    }
    throw err
  }
}

function collectPackages(node, acc = new Map()) {
  if (!node) return acc
  const name = node.name || ''
  const version = node.version || ''
  const key = `${name}@${version}`
  if (name && version && !acc.has(key)) {
    acc.set(key, node)
  }
  const deps = node.dependencies || {}
  for (const depName of Object.keys(deps)) {
    collectPackages(deps[depName], acc)
  }
  return acc
}

function normalizeLicense(licenseField) {
  if (!licenseField) return 'UNKNOWN'
  if (typeof licenseField === 'string') return licenseField
  if (Array.isArray(licenseField)) {
    // take unique list of types
    const types = Array.from(new Set(licenseField.map(l => (typeof l === 'string' ? l : l.type).trim())))
    return types.join(' OR ')
  }
  if (typeof licenseField === 'object' && licenseField.type) return licenseField.type
  return String(licenseField)
}

function main() {
  const tree = getPackageTree()
  const pkgs = Array.from(collectPackages(tree).entries())
  const violations = []

  for (const [key, node] of pkgs) {
    const license = normalizeLicense(node.license || node.licenses)
    const allowed = allowlist.allowed.some(pattern => {
      if (pattern === '*') return true
      // simple case-insensitive compare, supports pipes like MIT OR Apache-2.0
      return license.toLowerCase().includes(pattern.toLowerCase())
    })
    if (!allowed) {
      violations.push({ pkg: key, license })
    }
  }

  if (violations.length) {
    console.error('Disallowed licenses found:')
    for (const v of violations) {
      console.error(` - ${v.pkg}: ${v.license}`)
    }
    process.exitCode = 1
  } else {
    console.log('License scan passed: all dependencies compliant.')
  }
}

main()
