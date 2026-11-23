# Operations Runbook

## 1. Deployments & Builds
- **Production URL**: `https://civic-grievance-up.netlify.app/`
- **Build Command**: `pnpm build` (builds data snapshots, PIN shards, and static HTML pages)
- **Publish Directory**: `.` (or `public`)

## 2. Emergency Rollback
To roll back a bad data snapshot:
1. Navigate to Admin Console (`/admin`) -> **Publish History**.
2. Select previous snapshot version.
3. Trigger Netlify build hook to republish the verified static bundle.

## 3. Data Ingestion & Officer Updates
1. Run quarterly refresh: `pnpm tsx scripts/import-officers.ts path/to/officers.json --dry-run`.
2. Inspect dry-run diff in Admin Console.
3. Apply pending contact versions.
4. Complete 40-record spot-check audit (must pass < 10% error threshold).
5. Trigger atomic publish.

## 4. Secret Rotation
- Daily salt for report IP hashing rotates automatically every 24h.
- To rotate Postgres credentials, update `DATABASE_URL` in Netlify environment variables and redeploy functions.
