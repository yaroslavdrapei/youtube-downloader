const fs = require('node:fs');
const path = require('node:path');
const ytdl = require('@distube/ytdl-core');
const sanitizeFilename = require('sanitize-filename');
const { deleteFile, generateRandomSeed } = require('../utils/utils');
const Merger = require('./Merger');
const ProgressBarStream = require('./ProgressBarStream');

class Downloader {
  constructor({ progressBarMessageCallback }) {
    this.storagePath = process.env.BOT_STORAGE_PATH;
    this.info = null;
    this.progressBarMessageCallback = progressBarMessageCallback;
  }

  #generateFilenamesForVideoAudio() {
    const seed = generateRandomSeed(15);

    return {
      video: `video${seed}.mp4`,
      audio: `audio${seed}.mp3`,
    };
  }

  async #basicDownload(itag, extension) {
    // need to choose from audioonly formats for music
    const formats = extension == '.mp3' ? ytdl.filterFormats(this.info.formats, 'audioonly') : this.info.formats;
    const format = ytdl.chooseFormat(formats, { quality: itag });

    const filePath = path.join(this.storagePath, this.videoTitle + extension);

    const output = fs.createWriteStream(filePath);

    const returnedStream = ytdl.downloadFromInfo(this.info, { format: format });

    const streamErrorPromise = new Promise((resolve, reject) => {
      const progressBar = new ProgressBarStream(2500, 'Video', this.progressBarMessageCallback);
      progressBar.start([returnedStream]);

      returnedStream.on('error', (err) => {
        progressBar.stop();
        reject(err);
      });

      returnedStream.pipe(output);

      output.on('finish', resolve);
    });

    await streamErrorPromise;

    return filePath;
  }

  async #mergeDownload(itag) {
    const videoFormat = ytdl.chooseFormat(ytdl.filterFormats(this.info.formats, 'videoonly'), { quality: itag });
    const audioFormat = ytdl.chooseFormat(ytdl.filterFormats(this.info.formats, 'audioonly'), {
      quality: 'lowestaudio',
    });

    const formats = [videoFormat, audioFormat];

    const progressBar = new ProgressBarStream(2500, 'Video', this.progressBarMessageCallback);

    const { video: videoFilename, audio: audioFilename } = this.#generateFilenamesForVideoAudio();

    const inputStreams = [];
    const streamErrorPromises = [];

    formats.forEach((format, i) => {
      const streamErrorPromise = new Promise((resolve, reject) => {
        const inputStream = ytdl.downloadFromInfo(this.info, { format });
        inputStreams.push(inputStream);

        inputStream.on('error', (err) => {
          progressBar.stop();
          reject(err);
        });

        const outputStream = fs.createWriteStream(path.join(this.storagePath, i == 0 ? videoFilename : audioFilename));

        outputStream.on('finish', resolve);

        inputStream.pipe(outputStream);
      });

      streamErrorPromises.push(streamErrorPromise);
    });

    progressBar.start(inputStreams, this.progressBarMessageCallback);

    // just waiting for files to finish downloading
    await Promise.all(streamErrorPromises);

    const filePath = path.join(this.storagePath, this.videoTitle) + '.mp4';

    const merger = new Merger({ progressBarMessageCallback: this.progressBarMessageCallback });

    await merger.mergeVideoAudio(this.storagePath, this.videoTitle + '.mp4', videoFilename, audioFilename);

    deleteFile(path.join(this.storagePath, videoFilename));
    deleteFile(path.join(this.storagePath, audioFilename));

    return filePath;
  }

  async download(format, info) {
    this.info = info;
    this.videoTitle = sanitizeFilename(this.info.videoDetails.title);

    const { itag, hasVideo, hasAudio } = format;
    let pathToFile;

    try {
      if (hasVideo && !hasAudio) {
        pathToFile = await this.#mergeDownload(itag);
      } else if (hasVideo && hasAudio) {
        pathToFile = await this.#basicDownload(itag, '.mp4');
      } else {
        // (!hasVideo && hasAudio)
        pathToFile = await this.#basicDownload(itag, '.mp3');
      }

      return pathToFile;
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

module.exports = Downloader;
