const { spawn } = require('node:child_process');
const path = require('node:path');
const ffmpeg = require('ffmpeg-static');
const ProgressBarMergeProcess = require('./ProgressBarMergeProcess');

const PROGRESS_STREAM_INDEX = 2;

class Merger {
  constructor({ progressBarMessageCallback }) {
    this.progressBarMessageCallback = progressBarMessageCallback;
  }
  
  mergeVideoAudio(dest, filename, videoFile, audioFile) {
    const ffmpegProcess = spawn(ffmpeg, [
      // Set inputs
      '-i', path.join(dest, audioFile),
      '-i', path.join(dest, videoFile),
      // progress
      '-progress', `pipe:${PROGRESS_STREAM_INDEX}`,
      // Map audio & video from streams
      '-map', '0:a',
      '-map', '1:v',
      // Keep encoding
      '-c:v', 'copy',
      '-c:a', 'aac',
      // Define output file
      path.join(dest, filename)
    ]);
  
    const progressBar = new ProgressBarMergeProcess(1000, this.progressBarMessageCallback);
    progressBar.start(ffmpegProcess, PROGRESS_STREAM_INDEX);

    return new Promise((resolve, reject) => {    
      ffmpegProcess.on('exit', () => resolve());
      ffmpegProcess.on('error', () => {
        progressBar.stop();
        reject();
      });
    });
  };
}

module.exports = Merger;