import ytdl, { videoInfo } from '@distube/ytdl-core';
import express, { Request, Response, NextFunction } from 'express';
import { Video } from '../shared/services/Video';

const validateUrl = (req: Request, res: Response, next: NextFunction): void => {
  const link = req.query.link as string;

  if (!link || !ytdl.validateURL(link)) {
    res.status(400).json({ message: 'Invalid url' });
    return;
  }

  next();
};

const PORT = 3000;

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello world');
});

app.get('/api/info', validateUrl, async (req, res) => {
  const link = req.query.link as string;

  try {
    const info = await ytdl.getInfo(link);
    const video = new Video(link, info);

    res.status(200).json({
      formats: video.formats,
      simplifiedFormats: video.simplifiedFormats,
      thumbnail: video.thumbnail,
      title: video.title,
      link
    });
  } catch (err) {
    res.status(500).json({ message: `${err}` });
  }
});

// app.get('/api/download', (req, res) => {});

app.listen(PORT, () => {
  console.log(`Port: ${PORT}`);
});
