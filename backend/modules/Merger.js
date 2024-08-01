const { spawn } = require('node:child_process');
const path = require('node:path');
const ffmpeg = require('ffmpeg-static');
const ProgressBarMergeProcess = require('./ProgressBarMergeProcess');

const PROGRESS_STREAM_INDEX = 2;

class Merger {
  static mergeVideoAudio(dest, filename) {
    const ffmpegProcess = spawn(ffmpeg, [
      // Set inputs
      '-i', path.join(dest, 'audio.mp3'),
      '-i', path.join(dest, 'video.mp4'),
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

    console.log('Merging files...');
  
    new ProgressBarMergeProcess(ffmpegProcess, PROGRESS_STREAM_INDEX, 2000);

    return new Promise((resolve, reject) => {    
      ffmpegProcess.on('exit', () => resolve());
      ffmpegProcess.on('error', () => reject());
    });
  };
}

module.exports = Merger;