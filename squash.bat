@echo off
git reset --soft origin/main
git commit -m "fix(subsystem): complete decoupling and fix compliance issues"
git push -f origin feature/student-activity-matcher/decouple-frontend-from-prisma
