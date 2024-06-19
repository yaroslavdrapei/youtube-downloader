const { toMb } = require('./helpers')

class ProgressBar {
  progressData = {}
  intervalId = null
  constructor(frequency) {
    this.frequency = frequency
  }

  showProgress() {}
}

class ProgressBarStream extends ProgressBar {
  constructor(stream, frequency, prompt) {
    super(frequency)
    this.progressData = {downloaded: 0, total: 0}
    this.intervalId = setInterval(() => this.showProgress(), this.frequency)
    this.prompt = prompt

    stream.on('progress', (_, downloaded, total) => {
      this.progressData.downloaded = downloaded
      this.progressData.total = total
    })

    stream.on('end', (err) => {
      if (err) {
        console.log(err)
      } else {
        this.showProgress()
        clearInterval(this.intervalId)
        console.log(`${this.prompt} downloaded!`)
      }
    })
  }

  showProgress() {
    const { downloaded, total } = this.progressData
    console.log(`${this.prompt}: ${toMb(downloaded)}/${toMb(total)} (${(downloaded/total*100).toFixed(2)}%)`)
  }
}

class ProgressBarMergeProcess extends ProgressBar {
  constructor(ffmpegProcess, indexOfProgressStream, frequency) {
    super(frequency)
    this.intervalId = setInterval(() => this.showProgress(), this.frequency)

    ffmpegProcess.stdio[indexOfProgressStream].on('data', chunk => {
      this.progressData = chunk
    })

    ffmpegProcess.on('exit', () => {
      clearInterval(this.intervalId)
      console.log('Merged!')
    })
  }

  showProgress() {
    const lines = this.progressData.toString().trim().split('\n');
    const args = {};
    for (const l of lines) {
      const [key, value] = l.split('=');
      args[key.trim()] = value;
    }

    const total = toMb(parseInt(args['total_size']))
    if (total !== 'NaNmb') {
      console.log(`Merging: ${total} merged; bitrate:${args['bitrate']}`)
    }
  }
}

module.exports = {
  ProgressBarStream,
  ProgressBarMergeProcess
}