const { toMb } = require('../utils/utils');
const ProgressBar = require('./ProgressBar');

class StreamData {
  downloaded;
  total;
  ended;
  constructor(downloaded, total, ended) {
    this.downloaded = downloaded;
    this.total = total;
    this.ended = ended;
  }
}

class ProgressData {
  data = [new StreamData(0, 0, false)];

  constructor(length) {
    for (let i = 0; i < length-1; i++) {
      this.data.push(new StreamData(0, 0, false));
    }
  }

  totalSize() {
    let total = 0;
    this.data.forEach(data => total += data.total);
    return total;
  }

  downloadedSize() {
    let downloaded = 0;
    this.data.forEach(data => downloaded += data.downloaded);
    return downloaded;
  }

  allEnded = () => this.data.every(data => data.ended);
}

class ProgressBarStream extends ProgressBar {
  constructor(frequency, prompt, informUser) {
    super(frequency, informUser);
    this.prompt = prompt;
  }

  start(streams) {
    this.progressData = new ProgressData(streams.length);

    this.intervalId = setInterval(() => this.showProgress(), this.frequency);

    streams.forEach((stream, i) => {
      stream.on('progress', (_, downloaded, total) => {
        this.progressData.data[i].downloaded = downloaded;
        this.progressData.data[i].total = total;
      });

      stream.on('end', (err) => {
        if (err) {
          console.log(err);
        } else {
          this.progressData.data[i].ended = true;
          if (this.progressData.allEnded()) {
            this.stop();
            this.informUser(`${this.prompt} has finished downloading\nTotal size: ${toMb(this.progressData.totalSize())}`);
          }
        }
      });
    });
  }

  showProgress() {
    const downloaded = this.progressData.downloadedSize();
    const total = this.progressData.totalSize();

    const message = `${this.prompt}: ${toMb(downloaded)}/${toMb(total)} (${((downloaded / total) * 100).toFixed(2)}%)`;

    this.informUser(message);
  }
}

module.exports = ProgressBarStream;
