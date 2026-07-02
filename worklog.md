---
Task ID: 1
Agent: Main
Task: Fix critical 500 Internal Server Error on login/setup

Work Log:
- Investigated auth routes - found /api/auth (login) and /api/setup (owner creation)
- Login route returned proper 401 for invalid creds - not the issue
- Setup route returned 500 on POST - added debug logging to catch actual error
- Discovered root cause: `SqliteError: attempt to write a readonly database` (error code 1032)
- Traced to filesystem: `/home/z/my-project/db/custom.db` lives on a `volatile` overlay filesystem
- SQLite cannot create journal/WAL files on this FS, causing all write operations to fail
- Direct node test confirmed DB operations work when pointed to `/tmp/titan.db` (PolarFS, rw)

Stage Summary:
- Changed `.env` DATABASE_URL from `file:/home/z/my-project/db/custom.db` to `file:/tmp/titan.db`
- Created `scripts/init-db.sh` - copies DB from project dir if /tmp doesn't have one, runs prisma db push
- Updated `package.json` dev/start scripts to run init-db.sh before server start
- Verified full auth flow: setup (create owner) → login → session check — all pass
- Removed debug code from setup route, committed and pushed to origin/main