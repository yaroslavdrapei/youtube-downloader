import ytdl, { videoFormat, videoInfo } from "@distube/ytdl-core";
import { Merger } from "./Merger";
import { ProgressBarStream } from "./ProgressBarStream";
import { InformUser } from "../types/types";
import { ReadStream } from "node:fs";
import path from "node:path";
import fs from "node:fs";
import sanitize from "sanitize-filename";
import { deleteFile, generateRandomSeed } from "../utils/utils";

export class Downloader {
  public progressBarMessageCallback: InformUser;
  public storage: string;
  public title: string;
  private _info: videoInfo;

  public constructor(info: videoInfo, progressBarMessageCallback: InformUser) {
    this._info = info;
    this.progressBarMessageCallback = progressBarMessageCallback;
    this.title = sanitize(this._info.videoDetails.title);
    this.storage = path.join(path.resolve(), 'storage');
    fs.mkdir(this.storage, { recursive: true }, err => {
      if (err) throw err;
    });
  }

  public get info(): videoInfo { return this._info; }

  public async download(format: videoFormat): Promise<string> {
    const { itag, hasVideo, hasAudio } = format;
    try {
      if (hasVideo && !hasAudio) {
        return await this.mergeDownload(itag);
      }
      
      if (hasVideo && hasAudio) {
        return await this.basicDownload(itag, '.mp4');
      } 

      return await this.basicDownload(itag, '.mp3');
    } catch (err) {
      return Promise.reject(err);
    }
  }

  private async basicDownload(itag: number, extension: string): Promise<string> {
    // need to choose from audioonly formats for music
    const formats = extension == '.mp3' ? ytdl.filterFormats(this._info.formats, 'audioonly') : this._info.formats;
    const format = ytdl.chooseFormat(formats, { quality: itag });

    const filePath = path.join(this.storage, this.title + extension);

    const output = fs.createWriteStream(filePath);

    const returnedStream = ytdl.downloadFromInfo(this.info, { format: format });

    const downloadPromise = new Promise((resolve, reject) => {
      const progressBar = new ProgressBarStream(2000, 'Downloading', this.progressBarMessageCallback);
      progressBar.start([returnedStream as ReadStream]);

      returnedStream.on('error', (err) => {
        progressBar.stop();
        reject(err);
      });

      returnedStream.pipe(output);

      output.on('finish', resolve);
    });

    await downloadPromise;

    return filePath;
  }

  private async mergeDownload(itag: number): Promise<string> {
    const inputStreams = [
      ytdl.downloadFromInfo(this._info, { quality: itag }),
      ytdl.downloadFromInfo(this._info, { quality: 'lowestaudio' })
    ];

    const progressBar = new ProgressBarStream(2500, 'Video', this.progressBarMessageCallback);

    const { videoFilename, audioFilename } = this.generateFilenamesForVideoAudio();

    const videoPath = path.join(this.storage, videoFilename);
    const audioPath = path.join(this.storage, audioFilename);

    const downloadPromises: Promise<void>[] = [];

    inputStreams.forEach((stream, i) => {
      const downloadPromise = new Promise<void>((resolve, reject) => {
        stream.on('error', (err) => {
          progressBar.stop();
          reject(err);
        });

        const outputStream = fs.createWriteStream(i == 0 ? videoPath : audioPath);

        stream.pipe(outputStream);

        outputStream.on('finish', resolve);
      });

      downloadPromises.push(downloadPromise);
    });

    progressBar.start(inputStreams as ReadStream[]);

    await Promise.all(downloadPromises);

    const filePath = path.join(this.storage, this.title + '.mp4');

    const merger = new Merger(this.progressBarMessageCallback);

    await merger.mergeVideoAudio(filePath, videoPath, audioPath);

    deleteFile(videoPath);
    deleteFile(audioPath);

    return filePath;
  }

  private generateFilenamesForVideoAudio(): {videoFilename: string, audioFilename: string} {
    const seed = generateRandomSeed(15);

    return {
      videoFilename: `video${seed}.mp4`,
      audioFilename: `audio${seed}.mp3`,
    };
  }
}
