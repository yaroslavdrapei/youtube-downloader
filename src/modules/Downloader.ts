import { Merger } from "./Merger";
import { ProgressBarStream } from "./ProgressBarStream";
import { InformUser, SimplifiedFormat } from "../types/types";
import { ReadStream } from "node:fs";
import path from "node:path";
import fs from "node:fs";
import { deleteFile, generateRandomSeed } from "../utils/utils";
import { Video } from "./Video";
import ytdl from "@distube/ytdl-core";

export class Downloader {
  private progressBarMessageCallback: InformUser;
  private storage: string;

  public constructor(progressBarMessageCallback: InformUser) {
    this.progressBarMessageCallback = progressBarMessageCallback;
    this.storage = path.join(path.resolve(), 'storage');

    fs.mkdir(this.storage, { recursive: true }, err => {
      if (err) throw err;
    });
  }

  public async download(video: Video, format: SimplifiedFormat): Promise<string> {
    const { itag, hasVideo, hasAudio } = format;

    try {
      if (hasVideo && !hasAudio) {
        return await this.mergeDownload(video, itag);
      }
      
      if (hasVideo && hasAudio) {
        return await this.videoDownload(video, itag);
      } 

      return await this.audioDownload(video, itag);
    } catch (err) {
      throw Error(err as string);
    }
  }

  private async audioDownload(video: Video, itag: number): Promise<string> {
    return await this.basicDownload(video, itag, '.mp3');
  }

  private async videoDownload(video: Video, itag: number): Promise<string> {
    return await this.basicDownload(video, itag, '.mp4');
  }

  private async basicDownload(video: Video, itag: number, extension: string): Promise<string> {
    const filePath = path.join(this.storage, `${video.title}.${extension}`);
    
    const returnedStream = ytdl(video.link, { quality: itag });

    const output = fs.createWriteStream(filePath);

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

  private async mergeDownload(video: Video, itag: number): Promise<string> {
    const inputStreams = [
      ytdl(video.link, { quality: itag }),
      ytdl(video.link, { quality: 'lowestaudio' })
    ];

    const progressBar = new ProgressBarStream(2000, 'Downloading', this.progressBarMessageCallback);

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

    const filePath = path.join(this.storage, `${video.title}.mp4`);

    const merger = new Merger(this.progressBarMessageCallback);

    try {
      await merger.mergeVideoAudio(filePath, videoPath, audioPath);
      
      return filePath;
    } finally {
      deleteFile(videoPath);
      deleteFile(audioPath);
      deleteFile(filePath);
    }

  }

  private generateFilenamesForVideoAudio(): {videoFilename: string, audioFilename: string} {
    const seed = generateRandomSeed(15);

    return {
      videoFilename: `video${seed}.mp4`,
      audioFilename: `audio${seed}.mp3`,
    };
  }
}
