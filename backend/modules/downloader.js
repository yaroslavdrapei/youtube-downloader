const fs = require('node:fs');
const path = require('node:path');
const ytdl = require('@distube/ytdl-core');
const sanitizeFilename = require('sanitize-filename');
const { deleteFile } = require('../../shared/utils');
const Merger = require('./Merger');
const ProgressBarStream = require('./ProgressBarStream');

class Downloader {
  constructor() {
    this.storagePath = 'E:/youtube-bot-database';
    this.info = null;
  }

  async #basicDownload(itag, extension, prompt) {
    // need to choose from audioonly formats for music
    const formats = extension == '.mp3' ? ytdl.filterFormats(this.info.formats, 'audioonly') : this.info.formats;
    const format = ytdl.chooseFormat(formats, { quality: itag });

    const filePath = path.join(this.storagePath, this.videoTitle + extension);

    const output = fs.createWriteStream(filePath);

    const returnedStream = ytdl.downloadFromInfo(this.info, { format: format });

    const streamErrorPromise = new Promise((resolve, reject) => {
      const progressBar = new ProgressBarStream(returnedStream, 2000, prompt);

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
    const audioFormat = ytdl.chooseFormat(ytdl.filterFormats(this.info.formats, 'audioonly'), { quality: 'lowestaudio' });

    const formats = [videoFormat, audioFormat];
    const streamErrorPromises = [];

    formats.forEach((format, i) => {
      const streamErrorPromise = new Promise((resolve, reject) => {
        const inputStream = ytdl.downloadFromInfo(this.info, { format });

        const progressBar = new ProgressBarStream(inputStream, 2000, i == 0 ? 'Video' : 'Audio');

        inputStream.on('error', (err) => {
          console.log('Miniget error !');
          progressBar.stop();
          reject(err);
        });
      
        const outputStream = fs.createWriteStream(path.join(this.storagePath, i == 0 ? 'video.mp4' : 'audio.mp3'));

        outputStream.on('finish', resolve);
  
        inputStream.pipe(outputStream);
      });

      streamErrorPromises.push(streamErrorPromise);
    });

    // just waiting for files to finish downloading
    await Promise.all(streamErrorPromises);
      
    const filePath = path.join(this.storagePath, this.videoTitle) + '.mp4';

    await Merger.mergeVideoAudio(this.storagePath, this.videoTitle + '.mp4');

    deleteFile(path.join(this.storagePath, 'video.mp4'));
    deleteFile(path.join(this.storagePath, 'audio.mp3'));

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
        pathToFile = await this.#basicDownload(itag, '.mp4', 'Video');
      } else {
        // (!hasVideo && hasAudio)
        pathToFile = await this.#basicDownload(itag, '.mp3', 'Audio');
      }
  
      return pathToFile;
    } catch (err) {
      console.log('Download level!');
      return Promise.reject(err);
    }
  }
}

module.exports = Downloader;
