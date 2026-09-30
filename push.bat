@echo off
git add .
git commit -m "fix(ci): remove unauthorized ui dependencies from frontend package.json to pass ARC-02"
git push
