const { toMb } = require('../../shared/utils');
const ProgressBar = require('./ProgressBar');

class ProgressBarStream extends ProgressBar {
  constructor(stream, frequency, prompt) {
    super(frequency);
    this.progressData = { downloaded: 0, total: 0 };
    this.intervalId = setInterval(() => this.showProgress(), this.frequency);
    this.prompt = prompt;

    stream.on('progress', (_, downloaded, total) => {
      this.progressData.downloaded = downloaded;
      this.progressData.total = total;
    });

    stream.on('end', (err) => {
      if (err) {
        console.log(err);
      } else {
        this.showProgress();
        clearInterval(this.intervalId);
        console.log(`${this.prompt} downloaded!`);
      }
    });
  }

  showProgress() {
    const { downloaded, total } = this.progressData;
    console.log(`${this.prompt}: ${toMb(downloaded)}/${toMb(total)} (${((downloaded / total) * 100).toFixed(2)}%)`);
  }
}

module.exports = ProgressBarStream;