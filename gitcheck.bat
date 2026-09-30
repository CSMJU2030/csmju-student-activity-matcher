@echo off
git status > gitcheck.txt
git log -3 --stat >> gitcheck.txt
git branch -r >> gitcheck.txt
