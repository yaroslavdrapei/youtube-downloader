import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import { InformUser } from '../../shared/types/types';
import { fromKbtoMb } from '../../shared/utils/utils';

export class Merger {
  public progressBarMessageCallback: InformUser;

  public constructor(progressBarMessageCallback: InformUser = console.log) {
    this.progressBarMessageCallback = progressBarMessageCallback;
  }

  public async mergeVideoAudio(outputPath: string, videoPath: string, audioPath: string): Promise<string> {
    ffmpeg.setFfmpegPath(ffmpegPath as string);

    let intervalId: NodeJS.Timeout;
    let processedData = 0;
    const frequency = 3000;

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .output(outputPath)
        .videoCodec('copy')
        .audioCodec('aac')
        .on('progress', (data) => {
          processedData = data.targetSize;

          if (!intervalId) {
            intervalId = setInterval(() => {
              this.progressBarMessageCallback(`Merging files. Data processed: ${fromKbtoMb(processedData)}`);
            }, frequency);
          }
        })
        .on('end', () => {
          resolve(outputPath);
          clearInterval(intervalId);
        })
        .on('error', (err) => {
          reject(`Error occurred: ${err}`);
          clearInterval(intervalId);
        })
        .run();
    });
  }
}
