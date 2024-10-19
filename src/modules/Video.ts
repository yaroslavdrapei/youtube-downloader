import ytdl, { videoFormat, videoInfo } from "@distube/ytdl-core";
import sanitize from "sanitize-filename";
import { toMb } from "../utils/utils";
import { SimplifiedFormat } from "../types/types";

export class Video {
  public link: string;
  public title: string;
  public formats: videoFormat[];
  public simplifiedFormats: SimplifiedFormat[];

  public constructor(link: string, info: videoInfo, numberOfSimplifiedFormats = 10) {
    this.link = link;
    this.title = sanitize(info.videoDetails.title);
    this.formats = info.formats;
    this.simplifiedFormats = this.getSimplifiedFormats(numberOfSimplifiedFormats);
  }

  private getSimplifiedFormats(max: number): SimplifiedFormat[] {
    const videoFormats = this.getBestFormatsForVideos();
    const simplifiedFormats: SimplifiedFormat[] = [];

    // separately adding 1 mp3 format for music
    const bestAudioFormat = ytdl.chooseFormat(this.formats, { quality: 'highestaudio' });

    simplifiedFormats.push({
      name: `${simplifiedFormats.length + 1} - Audio; ${this.getSizeInMb(bestAudioFormat)}`,
      itag: bestAudioFormat.itag,
      hasAudio: bestAudioFormat.hasAudio,
      hasVideo: bestAudioFormat.hasVideo
    });

    videoFormats.forEach((format) => {
      const sizeInMb = this.getSizeInMb(format);

      const simplifiedFormat: SimplifiedFormat = {
        name: `${simplifiedFormats.length + 1} - ${format.qualityLabel} mp4; ${sizeInMb}`,
        itag: format.itag,
        hasAudio: format.hasAudio,
        hasVideo: format.hasVideo
      };

      simplifiedFormats.push(simplifiedFormat);
    });

    return simplifiedFormats.slice(0, max);
  }

  private getFormatsWithUniqueQuality(formats: videoFormat[]): videoFormat[] {
    const formatsWithUniqueQuality: videoFormat[] = [];

    for (const format of formats) {
      if (formatsWithUniqueQuality.some(elem => elem.qualityLabel == format.qualityLabel)) {
        continue;
      }

      formatsWithUniqueQuality.push(format);
    }

    return formatsWithUniqueQuality;
  }

  private getSizeInMb(format: videoFormat): string {
    const { hasVideo, hasAudio, contentLength } = format;
    const lowestAudioFormat = ytdl.chooseFormat(this.formats, { quality: 'lowestaudio' });

    if (!contentLength) return 'Unknown';

    if (hasVideo && !hasAudio) {
      return `~${toMb(parseInt(contentLength) + parseInt(lowestAudioFormat.contentLength))}`;
    } else {
      // has only audio
      return `~${toMb(parseInt(contentLength))}`;
    }
  }

  private getBestFormatsForVideos(): videoFormat[] {
    const badItags = [394, 395, 396, 397, 398, 399, 400, 401, 402];

    // only video && excluding bad itags
    const sortedFormats = this.formats.filter(format => format.hasVideo && !badItags.includes(format.itag));

    // sorting so videos with audio have a "priority"
    // in order to not waste resourses on merge later
    // "mp4" is better than "webm"
    // but "webm" takes less space on average than "mp4"
    sortedFormats.sort((a, b) => {
      if (a.hasVideo && a.hasAudio) return -1;
      else if (b.hasVideo && b.hasAudio) return 1;

      if (a.container == 'webm') return -1;
      else if (b.container == 'webm') return 1;
      return 0;
    });

    // higher quality => higher priority
    sortedFormats.sort((a, b) => {
      return parseInt(b.qualityLabel) - parseInt(a.qualityLabel);
    });

    // important to get only one format of each quality to
    // avoid like "360 mp4" and "360 webm" at the same time
    return this.getFormatsWithUniqueQuality(sortedFormats);
  }
}
