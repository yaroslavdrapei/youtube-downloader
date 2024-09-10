import ytdl, { videoFormat, videoInfo } from "@distube/ytdl-core";
import sanitize from "sanitize-filename";
import Merger from "./Merger";
import ProgressBarStream from "./ProgressBarStream";
import { InformUser } from "../types/types";
import { ReadStream } from "node:fs";
import { getBuffer } from "../utils/utils";

export default class Downloader {
  private info: videoInfo;
  private progressBarMessageCallback: InformUser;
  private videoTitle: string;
  constructor(info: videoInfo, progressBarMessageCallback: InformUser) {
    this.info = info;
    this.videoTitle = sanitize(this.info.videoDetails.title);
    this.progressBarMessageCallback = progressBarMessageCallback;
  }

  private async basicDownload(itag: number, extension: string) {
    // need to choose from audioonly formats for music
    const formats = extension == '.mp3' ? ytdl.filterFormats(this.info.formats, 'audioonly') : this.info.formats;
    const format = ytdl.chooseFormat(formats, { quality: itag });

    const returnedStream = ytdl.downloadFromInfo(this.info, { format: format });

    return await getBuffer(returnedStream as NodeJS.ReadStream);
  }

  private async mergeDownload(itag: number) {
    const videoStream = ytdl.downloadFromInfo(this.info, { quality: itag });
    const audioStream = ytdl.downloadFromInfo(this.info, { quality: 'lowestaudio'});

    const progressBar = new ProgressBarStream(2500, 'Video', this.progressBarMessageCallback);

    progressBar.start([videoStream as ReadStream, audioStream as ReadStream]);

    const merger = new Merger();

    try {
      const buffer = await merger.mergeVideoAudio(videoStream as ReadStream, audioStream as ReadStream);
      return buffer;
    } catch (e) {
      progressBar.stop();
      throw new Error();
    }
  }

  async download(format: videoFormat) {
    const { itag, hasVideo, hasAudio } = format;
    let buffer;

    try {
      if (hasVideo && !hasAudio) {
        buffer = await this.mergeDownload(itag);
      } else if (hasVideo && hasAudio) {
        buffer = await this.basicDownload(itag, '.mp4');
      } else {
        // (!hasVideo && hasAudio)
        buffer = await this.basicDownload(itag, '.mp3');
      }

      return buffer;
    } catch (err) {
      return Promise.reject(err);
    }
  }
}
