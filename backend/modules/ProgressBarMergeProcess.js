const ProgressBar = require('./ProgressBar');
const { toMb } = require('../../shared/utils');

class ProgressBarMergeProcess extends ProgressBar {
  constructor(ffmpegProcess, indexOfProgressStream, frequency) {
    super(frequency);
    this.intervalId = setInterval(() => this.showProgress(), this.frequency);

    ffmpegProcess.stdio[indexOfProgressStream].on('data', (chunk) => {
      this.progressData = chunk;
    });

    ffmpegProcess.on('exit', () => {
      clearInterval(this.intervalId);
      console.log('Merged!');
    });
  }

  showProgress() {
    const lines = this.progressData.toString().trim().split('\n');
    const args = {};
    for (const l of lines) {
      const [key, value] = l.split('=');
      args[key.trim()] = value;
    }

    const total = toMb(parseInt(args['total_size']));
    if (total !== 'NaNmb') {
      console.log(`Merging: ${total} merged; bitrate:${args['bitrate']}`);
    } else {
      console.log('Erroring');
    }
  }
}

module.exports = ProgressBarMergeProcess;