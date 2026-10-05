@echo off
git log --no-merges -n 10 --format="%%s" > commit_logs.txt
