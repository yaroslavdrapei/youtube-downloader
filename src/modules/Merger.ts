import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import { InformUser } from '../types/types';

export class Merger {
  public progressBarMessageCallback: InformUser;

  public constructor(progressBarMessageCallback: InformUser=console.log) {
    this.progressBarMessageCallback = progressBarMessageCallback;
  }
  
  public async mergeVideoAudio(outputPath: string, videoPath: string, audioPath: string): Promise<string> {
    ffmpeg.setFfmpegPath(ffmpegPath as string);

    let dots = 0;

    return new Promise((resolve, reject) => {
      ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .output(outputPath)
      .videoCodec('copy') 
      .audioCodec('aac')
      .on('progress', () => {
        this.progressBarMessageCallback(`Merging files${'.'.repeat(dots)}`);
        dots++;
        if (dots > 3) dots = 0;
      })
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', err => {
        reject(`Error occurred: ${err}`);
      })
      .run();
    });
  }
}
