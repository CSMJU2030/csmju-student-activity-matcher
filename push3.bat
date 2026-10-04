@echo off
cd c:\Users\Windows\csmju2030\csmju-student-activity-matcher
call pnpm install --no-frozen-lockfile
git add pnpm-lock.yaml
git commit -m "fix(ci): update pnpm-lock.yaml to resolve ERR_PNPM_OUTDATED_LOCKFILE"
git push
