class ProgressBar {
  progressData = {};
  intervalId = null;
  constructor(frequency) {
    this.frequency = frequency;
  }

  showProgress() {}
  stop() {
    clearInterval(this.intervalId);
  }
}

module.exports = ProgressBar;