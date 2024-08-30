const { spawn } = require('node:child_process');
const path = require('node:path');
const ffmpeg = require('ffmpeg-static');
const ProgressBarMergeProcess = require('./ProgressBarMergeProcess');
const { getBuffer } = require('../utils/utils');
const fs = require('node:fs');

const PROGRESS_STREAM_INDEX = 2;

class Merger {
  constructor({ progressBarMessageCallback }) {
    this.progressBarMessageCallback = progressBarMessageCallback;
  }
  
  async mergeVideoAudio(videoStream, audioStream) {
    const ffmpegProcess = spawn(ffmpeg, [
      // Set inputs
      '-i', 'pipe:3',
      '-i', 'pipe:4',
      // progress
      '-progress', `pipe:${PROGRESS_STREAM_INDEX}`,
      // Map audio & video from streams
      '-map', '0:a',
      '-map', '1:v',
      // Keep encoding
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-movflags', '+frag_keyframe+empty_moov',
      // Define output format as MP4 and pipe output
      '-f', 'mp4', 'pipe:5',
    ], {
      stdio: [
        'inherit', 'inherit', 'pipe', 
        'pipe', 'pipe', 'pipe'
      ]
    });

    audioStream.pipe(ffmpegProcess.stdio[3]);
    videoStream.pipe(ffmpegProcess.stdio[4]);
  
    const progressBar = new ProgressBarMergeProcess(1000, this.progressBarMessageCallback);
    progressBar.start(ffmpegProcess, PROGRESS_STREAM_INDEX);

    ffmpegProcess.on('exit', () => console.log('Exited successfully'));
    ffmpegProcess.on('error', err => {
      console.log(err);
      // progressBar.stop();
    });

    return await getBuffer(ffmpegProcess.stdio[5]);
  };
}

module.exports = Merger;