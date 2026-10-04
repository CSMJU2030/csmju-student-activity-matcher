@echo off
cd c:\Users\Windows\csmju2030\csmju-student-activity-matcher
call pnpm install
git add .
git commit -m "fix(ci): remove all unauthorized ui dependencies to pass ARC-02"
git push
