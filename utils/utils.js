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

const getBuffer = async (readableStream) => {
  // const reader = readableStream.getReader();
  // const buffers = [];

  // let { done, value } = await reader.read();

  // while (!done) {
  //   buffers.push(value);
  //   ({ done, value } = await reader.read());
  // }

  // return Buffer.concat(buffers);
  const buffers = [];

  readableStream.on('data', chunk => {
    buffers.push(chunk);
  });

  return new Promise((resolve, reject) => {
    readableStream.on('end', () => resolve(Buffer.concat(buffers)));
    readableStream.on('error', reject);
  });
};

module.exports = {
  toMb,
  deleteFile,
  generateRandomSeed,
  getBuffer
};
