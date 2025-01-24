import { InformUser, SimplifiedFormat } from '../types/types';
import path from 'node:path';
import fs from 'node:fs';
import { Video } from './Video';
import YTDlpWrap from 'yt-dlp-wrap';
import { deleteFolder } from '../utils/utils';
import sanitize from 'sanitize-filename';
import { ProgressBarYtdlp } from './ProgressBarYtdlp';

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

    const pathToFile = path.resolve(this.storage, sanitize(video.id), `${video.title}.${hasVideo ? 'mp4' : 'mp3'}`);

    const downloadTypes = {
      merge: [video.link, '-f', `${itag}+140`, '--merge-output-format', 'mp4', '-o', pathToFile],
      audio: [video.link, '-f', '140', '-o', pathToFile],
      video: [video.link, '-f', itag.toString(), '-o', pathToFile]
    };

    try {
      return new Promise((resolve, reject) => {
        let command: string[];

        if (hasVideo && !hasAudio) {
          command = downloadTypes.merge;
        } else if (hasVideo && hasAudio) {
          command = downloadTypes.video;
        } else {
          command = downloadTypes.audio;
        }

        const progressBar = new ProgressBarYtdlp(2000, this.progressBarMessageCallback);
        progressBar.start();

        ytdlpwrap
          .exec(command)
          .on('progress', ({ percent }) => {
            progressBar.updateProgress(percent);
          })
          .on('close', () => {
            progressBar.stop();
            resolve(pathToFile);
          })
          .on('error', (err) => {
            progressBar.stop();
            reject(err);
          });
      });
    } catch (err) {
      deleteFolder(path.parse(pathToFile).dir);
      throw Error(err as string);
    }
  }
}
