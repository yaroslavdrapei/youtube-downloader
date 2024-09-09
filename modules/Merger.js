const { spawn } = require('node:child_process');
const ffmpeg = require('ffmpeg-static');
const ProgressBarMergeProcess = require('./ProgressBarMergeProcess');
const { getBuffer, ffmpegProcessProgressParser } = require('../utils/utils');

const ffmpegStreamIndexes = {
  progress: 2,
  audio: 3,
  video: 4,
  output: 5,
};

class Merger {
  constructor(progressBarMessageCallback=console.log) {
    this.progressBarMessageCallback = progressBarMessageCallback;
  }
  
  async mergeVideoAudio(videoStream, audioStream) {
    const ffmpegProcess = spawn(ffmpeg, [
      // Set inputs
      '-i', `pipe:${ffmpegStreamIndexes.audio}`,
      '-i', `pipe:${ffmpegStreamIndexes.video}`,
      // progress
      '-progress', `pipe:${ffmpegStreamIndexes.progress}`,
      // Map audio & video from streams
      '-map', '0:a',
      '-map', '1:v',
      // Keep encoding
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-movflags', '+frag_keyframe+empty_moov',
      // Define output format as MP4 and pipe output
      '-f', 'mp4', `pipe:${ffmpegStreamIndexes.output}`,
    ], {
      stdio: [
        'inherit', 'inherit', 'pipe', 
        'pipe', 'pipe', 'pipe'
      ]
    });

    audioStream.pipe(ffmpegProcess.stdio[ffmpegStreamIndexes.audio]);
    videoStream.pipe(ffmpegProcess.stdio[ffmpegStreamIndexes.video]);
  
    const progressBar = new ProgressBarMergeProcess(1000, this.progressBarMessageCallback);
    progressBar.start(ffmpegProcess, ffmpegStreamIndexes.progress);

    ffmpegProcess.on('exit', () => console.log('Exited'));

    return new Promise((resolve, reject) => {
      ffmpegProcess.on('error', err => {
        progressBar.stop();
        reject(err+'39473498');
      });

      // sometime ffmpeg freezes and stops process the video
      // here the amount of the processed data is monitored and
      // if the same amount of progress data was the same for n (10)
      // times in a row = i stop the process and return error
      const processed = [];

      ffmpegProcess.stdio[ffmpegStreamIndexes.progress].on('data', data => {
        const args = ffmpegProcessProgressParser(data);
        const dataProcessed = args.total_size;
  
        if (processed.length < 10) {
          if (dataProcessed) {
            processed.push(dataProcessed);
          }
  
          return;
        }
  
        processed.shift();
        processed.push(dataProcessed);
  
        if (processed[0] == processed[processed.length-1]) {
          progressBar.stop();
          reject('Merging process crashed! Try downloading the video later');
        }
      });

      getBuffer(ffmpegProcess.stdio[ffmpegStreamIndexes.output])
      .then(resolve);
    });
  };
}

module.exports = Merger;