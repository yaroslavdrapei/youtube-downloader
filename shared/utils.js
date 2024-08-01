const ytdl = require('@distube/ytdl-core');
const fs = require('node:fs');
const path = require('node:path');

const validateURL = (url) => {
  return ytdl.validateURL(url);
};

const toMb = (bytes) => (bytes / 1024 / 1024).toFixed(2) + 'mb';
const getRandom = (max) => Math.floor(Math.random() * max);

const deleteFile = pathToFile => fs.unlink(pathToFile, err => {
  if (err) console.log(err);
});

const emptyFolder = directory => {
  fs.readdir(directory, (err, files) => {
    if (err) console.log(err);

    for (const file of files) {
      deleteFile(path.join(directory, file));
    }
  });
};

const postRequest = async (url, body) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response;
};

const getBuffer = async (readableStream) => {
  const reader = readableStream.getReader();
  const buffers = [];

  let { done, value } = await reader.read();

  while (!done) {
    buffers.push(value);
    ({ done, value } = await reader.read());
  }

  return Buffer.concat(buffers);
};

module.exports = {
  validateURL,
  toMb,
  getRandom,
  deleteFile,
  emptyFolder,
  postRequest,
  getBuffer
};
