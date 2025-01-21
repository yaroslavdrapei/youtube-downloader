import { InformUser, SimplifiedFormat } from '../types/types';
import path from 'node:path';
import fs from 'node:fs';
import { Video } from './Video';
import YTDlpWrap from 'yt-dlp-wrap';
import { deleteFile } from '../utils/utils';

const ytdlpwrap = new YTDlpWrap('./yt-dlp');

export class Downloader {
  private progressBarMessageCallback: InformUser;
  private storage: string;

  public constructor(progressBarMessageCallback: InformUser) {
    this.progressBarMessageCallback = progressBarMessageCallback;
    this.storage = path.join(path.resolve(), 'storage');

    fs.mkdir(this.storage, { recursive: true }, (err) => {
      if (err) throw err;
    });
  }

  public async download(video: Video, format: SimplifiedFormat): Promise<string> {
    const { itag, hasVideo, hasAudio } = format;

    const pathToFile = this.storage + '/' + `${video.title}.${hasVideo ? 'mp4' : 'mp3'}`;

    try {
      if (hasVideo && !hasAudio) {
        await ytdlpwrap.execPromise([
          video.link,
          '-f',
          `${itag}+140`,
          '--merge-output-format',
          'mp4',
          '-o',
          pathToFile
        ]);
      } else if (hasVideo && hasAudio) {
        await ytdlpwrap.execPromise([video.link, '-f', itag.toString(), '-o', pathToFile]);
      } else {
        await ytdlpwrap.execPromise([video.link, '-f', '140', '-o', pathToFile]);
      }

      return pathToFile;
    } catch (err) {
      deleteFile(pathToFile);
      throw Error(err as string);
    }
  }
}
