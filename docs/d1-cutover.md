# D1 production cutover

This runbook moves the production data from Turso to the existing
`liry24-com` D1 database. Keep admin writes paused from the export until the
post-deploy smoke test is complete.

## 1. Build and verify locally

```sh
bun install
bun run db:migrate:local
bun run db:migrate:local
bun run db:verify:migration
bun run typecheck
bun run lint
bun run fmt:check
bun run build
bun run cf:types
```

The second local migration command must report that there is nothing to apply.
`cf:types` writes only to the ignored Nuxt build output.

For normal development, `bun dev` runs `db:sync:local` before Nuxt starts. The
command exports the remote `liry24-com` D1 database read-only, imports it into a
staging local D1, applies the repository migrations locally, and imports the
data in foreign-key order before replacing the active local D1. This also keeps
development usable before the production cutover, when the remote D1 has no
application tables yet. The temporary SQL export is always deleted because it
can contain authentication data. Foreign keys and SQLite integrity are verified
before the swap; local R2 state is not replaced.

## 2. Confirm that the production D1 database is empty

```sh
bunx wrangler d1 execute liry24-com --remote \
  --config .output/server/wrangler.json \
  --command "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE '_cf_%' ORDER BY name"
```

Continue only when this returns no application tables. Do not delete or
overwrite an unexpected table.

## 3. Freeze writes and export Turso

Do not make admin changes after starting this step. Existing sessions are
intentionally not migrated and all users will need to sign in again.

```sh
bun run db:export:turso
```

The generated `.tmp/d1-import.sql` contains OAuth tokens and Passkey data.
It is ignored by Git and must not be shared.

## 4. Initialize and import D1

```sh
bun run db:migrate:remote
bunx wrangler d1 execute liry24-com --remote \
  --config .output/server/wrangler.json \
  --file .tmp/d1-import.sql
```

Compare each D1 row count with `.tmp/d1-import-counts.json`:

```sh
bunx wrangler d1 execute liry24-com --remote \
  --config .output/server/wrangler.json \
  --command "SELECT (SELECT count(*) FROM users) AS users, (SELECT count(*) FROM accounts) AS accounts, (SELECT count(*) FROM sessions) AS sessions, (SELECT count(*) FROM verifications) AS verifications, (SELECT count(*) FROM rate_limits) AS rate_limits, (SELECT count(*) FROM passkeys) AS passkeys, (SELECT count(*) FROM socials) AS socials, (SELECT count(*) FROM careers) AS careers, (SELECT count(*) FROM works) AS works, (SELECT count(*) FROM arts) AS arts, (SELECT count(*) FROM art_images) AS art_images, (SELECT count(*) FROM skills) AS skills, (SELECT count(*) FROM ranks) AS ranks, (SELECT count(*) FROM posts) AS posts, (SELECT count(*) FROM post_tags) AS post_tags"
```

`sessions`, `verifications`, and `rate_limits` must be zero because KV-backed
authentication state is intentionally not migrated. Also verify account
conversion and foreign keys:

```sh
bunx wrangler d1 execute liry24-com --remote \
  --config .output/server/wrangler.json \
  --command "SELECT provider_id, issuer, count(*) AS rows, count(DISTINCT provider_account_id) AS distinct_provider_accounts FROM accounts GROUP BY provider_id, issuer ORDER BY provider_id"

bunx wrangler d1 execute liry24-com --remote \
  --config .output/server/wrangler.json \
  --command "PRAGMA foreign_key_check"

bun run db:sync:local
```

Every issuer must be `local:oauth:<provider_id>` and
`PRAGMA foreign_key_check` must return no rows. D1's remote API does not
authorize `PRAGMA integrity_check`; `db:sync:local` exports the database
read-only and performs that check against the staged local SQLite database.
Primary-key and unique-key conflicts are rejected during the import.

## 5. Deploy and smoke test

Deploy the D1-backed Worker, then verify:

- GitHub and Vercel sign-in
- Passkey sign-in
- admin reads and one reversible content update
- public page and API cache status
- cache-tag purge after the admin update

Keep Turso unchanged until the smoke test passes. After admin writes resume,
D1 is the only source of truth. Retain Turso read-only for seven days, then
revoke its token and remove the database manually.
