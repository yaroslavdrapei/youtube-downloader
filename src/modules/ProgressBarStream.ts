import { ReadStream } from 'fs';
import { toMb } from '../utils/utils';
import { InformUser } from '../types/types';
import { ProgressBar } from './ProgressBar';

class StreamData {
  public downloaded = 0;
  public total = 0;
  public ended = false;
}

class ProgressData {
  public data = [new StreamData()];

  public init(length: number): void {
    for (let i = 0; i < length - 1; i++) {
      this.data.push(new StreamData());
    }
  }

  public totalSize(): number {
    let total = 0;
    this.data.forEach((data) => (total += data.total));
    return total;
  }

  public downloadedSize(): number {
    let downloaded = 0;
    this.data.forEach((data) => (downloaded += data.downloaded));
    return downloaded;
  }

  public allEnded = (): boolean => this.data.every((data) => data.ended);
}

export class ProgressBarStream extends ProgressBar {
  private _progressData = new ProgressData();
  public prompt: string;

  public constructor(frequency: number, prompt: string, informUser: InformUser) {
    super(frequency, informUser);
    this.prompt = prompt;
  }

  public start(streams: ReadStream[]): void {
    this._progressData.init(streams.length);

    this._intervalId = setInterval(() => this.showProgress(), this.frequency);

    streams.forEach((stream, i) => {
      stream.on('progress', (_, downloaded, total) => {
        this._progressData.data[i].downloaded = downloaded;
        this._progressData.data[i].total = total;
      });

      stream.on('end', (err: string) => {
        if (err) {
          console.log(err);
        } else {
          this._progressData.data[i].ended = true;
          if (this._progressData.allEnded()) {
            this.stop();
            this.informUser(
              `${this.prompt} has finished downloading\nTotal size: ${toMb(this._progressData.totalSize())}`
            );
          }
        }
      });
    });
  }

  public override showProgress(): void {
    const downloaded = this._progressData.downloadedSize();
    const total = this._progressData.totalSize();

    const message = `${this.prompt}: ${toMb(downloaded)}/${toMb(total)} (${((downloaded / total) * 100).toFixed(2)}%)`;

    this.informUser(message);
  }
}
