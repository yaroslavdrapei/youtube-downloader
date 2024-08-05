const fs = require('node:fs');

const toMb = (bytes) => {
  return (bytes / 1024 / 1024).toFixed(2) + 'mb';
};

const deleteFile = (pathToFile) =>
  fs.unlink(pathToFile, (err) => {
    if (err) console.log(err);
  });

const generateRandomSeed = (length = 10) => {
  let seed = '';
  for (let i = 0; i < length; i++) {
    seed += Math.floor(Math.random() * 10).toString();
  }
  return seed;
};

module.exports = {
  toMb,
  deleteFile,
  generateRandomSeed,
};
