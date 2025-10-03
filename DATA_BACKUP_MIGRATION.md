# Data Backup & Migration Operations

This document defines procedures and standards for managing database schema changes and backups for the Prisma-managed database.

## Objectives

- Preserve data integrity across schema migrations.
- Provide repeatable backup & restore playbooks.
- Enable safe roll-forward and roll-back during releases.
- Maintain audit trail of migration history.

## Components

| Element              | Location                      | Purpose                              |
| -------------------- | ----------------------------- | ------------------------------------ |
| Prisma Schema        | `prisma/schema.prisma`        | Canonical DB schema definition       |
| Migrations           | `prisma/migrations/*`         | Incremental, ordered applied changes |
| Generated Client     | `node_modules/@prisma/client` | Type-safe DB API                     |
| Seed Script (future) | `prisma/seed.ts`              | Deterministic base data population   |

## Migration Workflow

1. Modify `prisma/schema.prisma` (add model / field / index / enum).
2. Generate new migration:
   ```bash
   npx prisma migrate dev --name <change-name>
   ```
3. Commit the new folder under `prisma/migrations/`.
4. Run unit/integration tests.
5. In CI for main merges (future production deploy) use:
   ```bash
   npx prisma migrate deploy
   ```
6. (Optional) Regenerate client manually if needed:
   ```bash
   npx prisma generate
   ```

## Safe Migration Guidelines

- Prefer additive changes first (add columns nullable, backfill, then set NOT NULL).
- Avoid dropping columns in the same deploy where writes still occur—stage removal.
- For large tables, create indexes concurrently where supported (Postgres: `CREATE INDEX CONCURRENTLY`). Prisma may not support concurrently keyword; fallback to custom SQL migration file if needed.
- For destructive changes (drop column/table), ensure backup snapshot taken immediately before deploy.
- Explicitly set default values in schema to avoid implicit engine defaults changing over time.

## Backups

(Assuming Postgres; adapt for other engines.)

### Logical Dump

Use `pg_dump` for portable schema + data.

```bash
pg_dump --format=custom --file=backup_$(date +%Y%m%d_%H%M).dump "$DATABASE_URL"
```

Pros: Restorable to different version (within reason).  
Cons: Slower for very large datasets.

### Physical / Managed Snapshots

If using a managed service (RDS, Neon, Supabase, etc.) enable automated daily snapshots + point-in-time recovery window (>= 7 days recommended).

### Backup Cadence

| Type                          | Frequency           | Retention         | Trigger                  |
| ----------------------------- | ------------------- | ----------------- | ------------------------ |
| Daily automated snapshot      | Daily               | 7–14 days         | Managed service schedule |
| Weekly full logical dump      | Weekly              | 4 weeks           | Cron / pipeline          |
| Pre-deploy migration snapshot | On migration deploy | 1–2 deploy cycles | CI/CD hook               |

### Integrity Verification

- After logical dump, run `pg_restore --list` to validate format.
- Periodically rehearse restores in staging (`pg_restore --clean --create`).
- Maintain hash of dump file (SHA256) to detect corruption.

## Restore Procedures

1. Identify target snapshot / dump.
2. Quiesce production writes (put app in maintenance mode if needed).
3. Provision fresh database or drop & recreate (CAUTION) depending on recovery objective.
4. Restore:
   ```bash
   pg_restore --clean --if-exists --exit-on-error --dbname=$DATABASE_URL backup_xxxx.dump
   ```
5. Run `npx prisma migrate deploy` to ensure migration alignment (should be no-op if dump current).
6. Validate application smoke tests + critical queries.
7. Exit maintenance mode.

## Rollback Strategy

If new migration introduces issue:

- If reversible quickly: create new corrective migration (preferred forward fix).
- If needs immediate rollback: restore pre-deploy snapshot and redeploy previous app version.
- Avoid manually editing migration files after they are applied to production (causes drift).

## Drift Detection

Use:

```bash
npx prisma migrate status
```

If drift detected (production differs from migrations), investigate manual changes. For non-critical environments you can reset with:

```bash
npx prisma migrate reset --force
```

Never reset production.

## Seeding (Future)

Implement `prisma/seed.ts` with idempotent upserts for fixed reference data (e.g., roles, default admin). CI can run:

```bash
npx prisma db seed
```

## Environment Variables

Ensure `DATABASE_URL` is managed via secrets store, rotated periodically. Avoid embedding credentials in migration scripts.

## Observability & Audit

- Log each migration application (Prisma already writes to `_prisma_migrations`).
- Capture migration duration metrics (wrap deploy command in timing script if needed).

## Automation Roadmap

- Add GitHub Action job for scheduled weekly dump (store in secure artifact or offsite bucket).
- Integrate drift status check in CI (warn on PR if drift vs main schema).
- Add pre-deploy step that exports logical dump before applying new migrations.

## Common Pitfalls

| Pitfall                                  | Mitigation                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| Long-running locks during migration      | Schedule off-peak; break large DDL into smaller steps.                           |
| Accidental data loss on column drop      | Two-phase removal with deprecation period.                                       |
| Inconsistent enums after manual DB edits | Only change or add enums via Prisma migrations.                                  |
| Forgetting to commit migration folder    | Add CI check failing when `prisma/schema.prisma` hash changed but no new folder. |

---

Owner: Data / Platform Team. Update as operational practices evolve.
