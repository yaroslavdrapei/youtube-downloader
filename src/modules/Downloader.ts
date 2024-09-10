import ytdl, { videoFormat, videoInfo } from "@distube/ytdl-core";
import { Merger } from "./Merger";
import { ProgressBarStream } from "./ProgressBarStream";
import { InformUser } from "../types/types";
import { ReadStream } from "node:fs";
import { getBuffer } from "../utils/utils";

export class Downloader {
  public progressBarMessageCallback: InformUser;
  private _info: videoInfo;

  public constructor(info: videoInfo, progressBarMessageCallback: InformUser) {
    this._info = info;
    this.progressBarMessageCallback = progressBarMessageCallback;
  }

  public get info(): videoInfo { return this._info; }

  public async download(format: videoFormat): Promise<Buffer> {
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

  private async basicDownload(itag: number, extension: string): Promise<Buffer> {
    // need to choose from audioonly formats for music
    const formats = extension == '.mp3' ? ytdl.filterFormats(this._info.formats, 'audioonly') : this._info.formats;
    const format = ytdl.chooseFormat(formats, { quality: itag });

    const returnedStream = ytdl.downloadFromInfo(this._info, { format: format });

    return await getBuffer(returnedStream as NodeJS.ReadStream);
  }

  private async mergeDownload(itag: number): Promise<Buffer> {
    const videoStream = ytdl.downloadFromInfo(this._info, { quality: itag });
    const audioStream = ytdl.downloadFromInfo(this._info, { quality: 'lowestaudio'});

    const progressBar = new ProgressBarStream(2500, 'Video', this.progressBarMessageCallback);

    progressBar.start([videoStream as ReadStream, audioStream as ReadStream]);

    const merger = new Merger();

    try {
      const buffer = await merger.mergeVideoAudio(videoStream as ReadStream, audioStream as ReadStream);
      return buffer;
    } catch (e) {
      progressBar.stop();
      throw new Error(e as string);
    }
  }
}
