const { execSync } = require('child_process');
const log = execSync('git --no-pager log --no-merges -n 10 --format="%s"').toString();
require('fs').writeFileSync('commit_logs.txt', log);
