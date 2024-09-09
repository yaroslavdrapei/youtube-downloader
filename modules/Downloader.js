const ytdl = require('@distube/ytdl-core');
const sanitizeFilename = require('sanitize-filename');
const { getBuffer } = require('../utils/utils');
const Merger = require('./Merger');
const ProgressBarStream = require('./ProgressBarStream');

class Downloader {
  constructor({ progressBarMessageCallback }) {
    this.info = null;
    this.progressBarMessageCallback = progressBarMessageCallback;
  }

  async #basicDownload(itag, extension) {
    // need to choose from audioonly formats for music
    const formats = extension == '.mp3' ? ytdl.filterFormats(this.info.formats, 'audioonly') : this.info.formats;
    const format = ytdl.chooseFormat(formats, { quality: itag });

    const returnedStream = ytdl.downloadFromInfo(this.info, { format: format });

    return await getBuffer(returnedStream);
  }

  async #mergeDownload(itag) {
    const videoStream = ytdl.downloadFromInfo(this.info, { quality: itag });
    const audioStream = ytdl.downloadFromInfo(this.info, { quality: 'lowestaudio'});

    const progressBar = new ProgressBarStream(2500, 'Video', this.progressBarMessageCallback);

    progressBar.start([videoStream, audioStream], this.progressBarMessageCallback);

    const merger = new Merger();

    try {
      const buffer = await merger.mergeVideoAudio(videoStream, audioStream);
      return buffer;
    } catch (e) {
      progressBar.stop();
      throw new Error(e);
    }
  }

  async download(format, info) {
    this.info = info;
    this.videoTitle = sanitizeFilename(this.info.videoDetails.title);

    const { itag, hasVideo, hasAudio } = format;
    let buffer;

    try {
      if (hasVideo && !hasAudio) {
        buffer = await this.#mergeDownload(itag);
      } else if (hasVideo && hasAudio) {
        buffer = await this.#basicDownload(itag, '.mp4');
      } else {
        // (!hasVideo && hasAudio)
        buffer = await this.#basicDownload(itag, '.mp3');
      }

      return buffer;
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

module.exports = Downloader;
