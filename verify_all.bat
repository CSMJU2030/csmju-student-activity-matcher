@echo off
set "BASH_PATH=C:\Program Files\Git\bin\bash.exe"

echo Running Branch Name...
"%BASH_PATH%" standards/scripts/check-branch-name.sh . origin/main > ci_log.txt 2>&1
if errorlevel 1 echo FAILED GH-01 >> ci_log.txt

echo Running Commit Messages...
"%BASH_PATH%" standards/scripts/check-commit-messages.sh . origin/main >> ci_log.txt 2>&1
if errorlevel 1 echo FAILED GH-02 >> ci_log.txt

echo Running CI Untouched...
"%BASH_PATH%" standards/scripts/check-ci-untouched.sh . origin/main >> ci_log.txt 2>&1
if errorlevel 1 echo FAILED GH-03 >> ci_log.txt

echo Running Submodule Pointer...
"%BASH_PATH%" standards/scripts/check-submodule-pointer.sh . >> ci_log.txt 2>&1
if errorlevel 1 echo FAILED GH-04 >> ci_log.txt

echo Running Field Aliases...
"%BASH_PATH%" standards/scripts/check-field-aliases.sh . >> ci_log.txt 2>&1
if errorlevel 1 echo FAILED DD-01 >> ci_log.txt

echo Running OpenAPI...
"%BASH_PATH%" standards/scripts/check-openapi-sync.sh . >> ci_log.txt 2>&1
if errorlevel 1 echo FAILED API-01 >> ci_log.txt

echo Running UI Tokens...
"%BASH_PATH%" standards/scripts/check-ui-tokens.sh . >> ci_log.txt 2>&1
if errorlevel 1 echo FAILED UI-01 >> ci_log.txt

echo Running ALL QA...
"%BASH_PATH%" standards/scripts/check-qa.sh . >> ci_log.txt 2>&1
if errorlevel 1 echo FAILED QA >> ci_log.txt

echo Done! >> ci_log.txt
