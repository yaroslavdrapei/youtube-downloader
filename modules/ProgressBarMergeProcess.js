const ProgressBar = require('./ProgressBar');
const { toMb, ffmpegProcessProgressParser } = require('../utils/utils');

class ProgressBarMergeProcess extends ProgressBar {
  progressData = 0;
  constructor(frequency, informUser) {
    super(frequency, informUser);
  }

  start(ffmpegProcess, indexOfProgressStream) {
    this.intervalId = setInterval(() => this.showProgress(), this.frequency);

    this.informUser('Merging files..\nIt might take some time');

    ffmpegProcess.stdio[indexOfProgressStream].on('data', (chunk) => {
      this.progressData = chunk;
    });

    ffmpegProcess.on('exit', () => {
      this.stop();
      this.informUser('Merged!');
    });
  }

  showProgress() {
    const args = ffmpegProcessProgressParser(this.progressData);

    const total = toMb(parseInt(args['total_size']));
    if (total !== 'NaNmb') {
      const message = `Merging files: ${total} merged; bitrate: ${args['bitrate']}`;

      // not using informUser here because i'm not sure if user needs this information
      console.log(message);
    } else {
      this.informUser('Error has occurred');
      this.stop();
    }
  }
}

module.exports = ProgressBarMergeProcess;