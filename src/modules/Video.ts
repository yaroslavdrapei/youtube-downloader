import sanitize from 'sanitize-filename';
import { toMb } from '../utils/utils';
import { Format, SimplifiedFormat, VideoInfo } from '../types/types';

export class Video {
  public id: string;
  public link: string;
  public title: string;
  public formats: Format[];
  public simplifiedFormats: SimplifiedFormat[];
  public thumbnail: string | undefined;

  public constructor(link: string, info: VideoInfo, numberOfSimplifiedFormats = 10) {
    this.id = info.id;
    this.link = link;
    this.title = sanitize(info.title);
    this.formats = info.formats;
    this.simplifiedFormats = this.getSimplifiedFormats(numberOfSimplifiedFormats);
    this.thumbnail = info.thumbnail || info.thumbnails?.at(-1)?.url;
  }

  private getSimplifiedFormats(max: number): SimplifiedFormat[] {
    const formats = this.getBestFormatsForVideos();
    const simplifiedFormats: SimplifiedFormat[] = [];

    // separately adding 1 mp3 format for music
    const bestAudioFormat = this.formats.find((f) => f.format_id == '140') as Format;

    simplifiedFormats.push({
      name: `🎼 mp3; ${toMb(bestAudioFormat.filesize)}`,
      itag: +bestAudioFormat.format_id,
      hasAudio: true,
      hasVideo: false
    });

    formats.forEach((format) => {
      const sizeInMb = toMb(format.filesize);

      const simplifiedFormat: SimplifiedFormat = {
        name: `🎥 ${format.format_note}; ${sizeInMb}`,
        itag: +format.format_id,
        hasAudio: format.acodec != 'none',
        hasVideo: true
      };

      simplifiedFormats.push(simplifiedFormat);
    });

    return simplifiedFormats.slice(0, max);
  }

  private getFormatsWithUniqueQuality(formats: Format[]): Format[] {
    const formatsWithUniqueQuality: Format[] = [];

    for (const format of formats) {
      if (formatsWithUniqueQuality.some((elem) => elem.format_note == format.format_note)) {
        continue;
      }

      formatsWithUniqueQuality.push(format);
    }

    return formatsWithUniqueQuality;
  }

  private getBestFormatsForVideos(): Format[] {
    const badItags = [394, 395, 396, 397, 398, 399, 400, 401, 402];

    // only video && excluding bad itags
    const sortedFormats = this.formats.filter(
      (format) =>
        format.resolution != 'audio only' &&
        !badItags.includes(parseInt(format.format_id)) &&
        !['m3u8_native', 'mhtml'].includes(format.protocol) &&
        format.video_ext != 'webm'
    );

    // const formats: Format[] = info.formats.filter(
    //   (f) => !['m3u8_native', 'mhtml'].includes(f.protocol) && f.resolution != 'audio only'
    // );

    // sorting so videos with audio have a "priority"
    // in order to not waste resourses on merge later
    // "mp4" is better than "webm"
    sortedFormats.sort((a, b) => {
      if (a.acodec != 'none') return -1;
      else if (b.acodec != 'none') return 1;

      return 0;
    });

    // higher quality => higher priority
    sortedFormats.sort((a, b) => {
      if (a.height && b.height) {
        return b.height - a.height;
      }

      return 0;
    });

    // important to get only one format of each quality to
    // avoid like "360 mp4" and "360 webm" at the same time
    return this.getFormatsWithUniqueQuality(sortedFormats);
  }
}
