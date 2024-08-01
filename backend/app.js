const fs = require('node:fs');
const ytdl = require('@distube/ytdl-core');
const Downloader = require('./modules/Downloader');
const Server = require('./modules/Server');
const { deleteFile } = require('../shared/utils');

const port = 3000;
const app = new Server(port, `Server running on port ${port}`);

app.post('/api/video-info', async (body, res) => {
  const data = JSON.parse(body);

  const info = await ytdl.getInfo(data.link);

  res.writeHead(200, { 'Content-type': 'application/json' });
  res.end(JSON.stringify(info));
});

app.post('/api/download-by-link', async (body, res) => {
  const data = JSON.parse(body);

  const { format, info } = data;

  const downloader = new Downloader();

  try {
    const pathToFile = await downloader.download(format, info);

    const readStream = fs.createReadStream(pathToFile);
  
    readStream.on('error', err => console.log(err, 'readstream error'));
    readStream.on('end', () => {
      deleteFile(pathToFile);
    });
  
    res.writeHead(200, { 'Content-type': 'application/octet-stream' });
    readStream.pipe(res);
  } catch (err) {
    const errorCode = 403;
    res.writeHead(errorCode, { 'Content-type': 'text/plain' });
    res.end(`Server error ${errorCode} occurred\n Most likely the bot was overloaded\n Try again later\n More info: ${err}`);
  }
});
