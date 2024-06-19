const { spawn } = require('node:child_process')
const ffmpeg = require('ffmpeg-static')
const { ProgressBarMergeProcess } = require('./progressBars')

const PROGRESS_STREAM_INDEX = 2

module.exports = (path) => {
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn(ffmpeg, [
      // Set inputs
      '-i', 'audio.mp3',
      '-i', 'video.mp4',
      // progress
      '-progress', `pipe:${PROGRESS_STREAM_INDEX}`,
      // Map audio & video from streams
      '-map', '0:a',
      '-map', '1:v',
      // Keep encoding
      '-c:v', 'copy',
      '-c:a', 'aac',
      // Define output file
      path
    ])
  
    new ProgressBarMergeProcess(ffmpegProcess, PROGRESS_STREAM_INDEX, 2000)
  
    ffmpegProcess.on('exit', () => {
      resolve()
    })
  })
}