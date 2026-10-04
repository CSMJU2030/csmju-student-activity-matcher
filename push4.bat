@echo off
cd c:\Users\Windows\csmju2030\csmju-student-activity-matcher
git add .
git commit -m "fix(ci): remap prisma fields to snake_case and remove hardcoded faculties (DD-03, DD-04)"
git push
