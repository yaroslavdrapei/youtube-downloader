const ytdl = require('@distube/ytdl-core');
const { toMb } = require('../utils/utils');

class VideoInfo {
  #info;
  #formats;
  #title;

  constructor(info) {
    this.#info = info;
    this.#formats = this.#info.formats;
    this.#title = this.#info.videoDetails.title;
  }

  get info() {
    return this.#info;
  }

  get formats() {
    return this.#formats;
  }

  get title() {
    return this.#title;
  }

  #getFormatsWithUniqueQuality(formats) {
    const formatsWithUniqueQuality = [];

    for (const format of formats) {
      if (formatsWithUniqueQuality.some(elem => elem.qualityLabel == format.qualityLabel)) {
        continue;
      }

      formatsWithUniqueQuality.push(format);
    }

    return formatsWithUniqueQuality;
  }

  #getSizeInMb(format) {
    const { hasVideo, hasAudio, contentLength } = format;
    const lowestAudioFormat = ytdl.chooseFormat(this.#formats, { quality: 'lowestaudio' });

    if (!contentLength) return 'Unknown';

    if (hasVideo && !hasAudio) {
      return `~${toMb(parseInt(contentLength) + parseInt(lowestAudioFormat.contentLength))}`;
    } else {
      // has only audio
      return `~${toMb(contentLength)}`;
    }
  }

  #getBestFormatsForVideos() {
    const badItags = [394, 395, 396, 397, 398, 399, 400, 401, 402];

    // only video && excluding bad itags
    const sortedFormats = this.#formats.filter(format => format.hasVideo && !badItags.includes(format.itag));

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
    return this.#getFormatsWithUniqueQuality(sortedFormats);
  }

  getFormatByItag(itag) {
    for (const format of this.#formats) {
      if (format.itag === itag) {
        return format;
      }
    }

    throw Error(`No such itag ${itag}`);
  }

  getSimplifiedFormats(max = 10) {
    const videoFormats = this.#getBestFormatsForVideos();
    const simplifiedFormats = [];

    // separately adding 1 mp3 format for music
    const bestAudioFormat = ytdl.chooseFormat(this.#formats, { quality: 'highestaudio' });

    simplifiedFormats.push({
      name: `${simplifiedFormats.length + 1} - Audio; ${this.#getSizeInMb(bestAudioFormat)}`,
      itag: bestAudioFormat.itag,
    });

    videoFormats.forEach((format) => {
      const sizeInMb = this.#getSizeInMb(format);

      simplifiedFormats.push({
        name: `${simplifiedFormats.length + 1} - ${format.qualityLabel} mp4; ${sizeInMb}`,
        itag: format.itag,
      });
    });

    return simplifiedFormats.slice(0, max);
  }
}

module.exports = VideoInfo;
