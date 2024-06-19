const ytdl = require('ytdl-core')
const mergeVideoAudio = require('./mergeVideoAudio')
const { ProgressBarStream } = require('./progressBars')
const sanitizeFilename = require('sanitize-filename')
const fs = require('node:fs')
const downloadsFolder = require('downloads-folder')
const checkPathExistence = require('./checkPathExistence')

class Downloader {
  constructor(info) {
    this.info = info
    this.filename = sanitizeFilename(this.info.videoDetails.title)
  }

  waitingForStreams(streams) {
    return new Promise((resolve, reject) => {
      const areFinished = new Array(streams.length).fill(false)
      for (let i = 0; i < streams.length; i++) {
        const stream = streams[i]
        stream.on('finish', () => {
          areFinished[i] = true
          if (areFinished.every(elem => elem)) {
            resolve()
          }
        })
      }
    })
  }

  basicDownload(itag, extension, prompt) {
    // need to choose from audioonly formats for music
    const formats = extension == '.mp3' ? ytdl.filterFormats(this.info.formats, 'audioonly') : this.info.formats
    const format = ytdl.chooseFormat(formats, { quality: itag })

    this.filename = checkPathExistence(downloadsFolder(), this.filename, extension)

    const output = fs.createWriteStream(downloadsFolder() + '/' + this.filename + extension)

    const returnedStream = ytdl.downloadFromInfo(this.info, { format: format })

    new ProgressBarStream(returnedStream, 2000, prompt)

    returnedStream.pipe(output)
  }

  async mergeDownload(itag) {
    const videoFormat = ytdl.chooseFormat(ytdl.filterFormats(this.info.formats, 'videoonly'), { quality: itag })
    const audioFormat = ytdl.chooseFormat(ytdl.filterFormats(this.info.formats, 'audioonly'), { quality: 'lowestaudio' })

    const videoStream = ytdl.downloadFromInfo(this.info, { format: videoFormat })
    const audioStream = ytdl.downloadFromInfo(this.info, { format: audioFormat })

    new ProgressBarStream(videoStream, 2000, 'Video')
    new ProgressBarStream(audioStream, 2000, 'Audio')

    const outputVideo = fs.createWriteStream('video.mp4')
    const outputAudio = fs.createWriteStream('audio.mp3')

    videoStream.pipe(outputVideo)
    audioStream.pipe(outputAudio)

    // just waiting for files to finish downloading
    await this.waitingForStreams([outputVideo, outputAudio])

    this.filename = checkPathExistence(downloadsFolder(), this.filename, '.mp4')

    console.log('Merging files...')

    await mergeVideoAudio(downloadsFolder() + '/' + this.filename + '.mp4')

    // Delete files as we don't need them anymore
    fs.unlink('video.mp4', (err) => {
      if (err) console.log(err)
    })
    fs.unlink('audio.mp3', (err) => {
      if (err) console.log(err)
    }
    )
  }

  download(data) {
    const { itag, hasVideo, hasAudio } = data

    if (hasVideo && !hasAudio) {
      this.mergeDownload(itag)
    } else if (hasVideo && hasAudio) {
      this.basicDownload(itag, '.mp4', 'Video')
    } else { // (!hasVideo && hasAudio)
      this.basicDownload(itag, '.mp3', 'Audio')
    }
  }
}

module.exports = Downloader