class ProgressBar {
  intervalId = null;
  constructor(frequency, informUser=console.log) {
    this.frequency = frequency;
    this.informUser = informUser;
  }

  start() {}
  showProgress() {}
  stop() {
    clearInterval(this.intervalId);
  }
}

module.exports = ProgressBar;