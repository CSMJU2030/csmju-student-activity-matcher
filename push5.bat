@echo off
cd c:\Users\Windows\csmju2030\csmju-student-activity-matcher
echo Starting pnpm update... > debug.txt
call pnpm install --no-frozen-lockfile >> debug.txt 2>&1
echo Done pnpm install. >> debug.txt 
git status >> debug.txt 2>&1
git add .
git commit -m "fix(ci): lock pnpm file correctly without frozen-lockfile (ARC-02)" >> debug.txt 2>&1
git push >> debug.txt 2>&1
