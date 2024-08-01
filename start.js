const { exec } = require('node:child_process');

exec('npm run server', (err, stdout, _) => {
  console.log(stdout);
});
exec('npm run backend', (err, stdout, _) => {
  console.log(stdout);
});
exec('npm run frontend', (err, stdout, _) => {
  console.log(stdout);
});
