import { ReadStream } from "fs";
import { toMb } from '../utils/utils';
import { InformUser } from "../types/types";

class StreamData {
  public downloaded;
  public total;
  public ended;
  constructor(downloaded: number, total: number, ended: boolean) {
    this.downloaded = downloaded;
    this.total = total;
    this.ended = ended;
  }
}

class ProgressData {
  public data = [new StreamData(0, 0, false)];

  public init(length: number) {
    for (let i = 0; i < length-1; i++) {
      this.data.push(new StreamData(0, 0, false));
    }
  }

  public totalSize() {
    let total = 0;
    this.data.forEach(data => total += data.total);
    return total;
  }

  public downloadedSize() {
    let downloaded = 0;
    this.data.forEach(data => downloaded += data.downloaded);
    return downloaded;
  }

  public allEnded = () => this.data.every(data => data.ended);
}

export default class ProgressBarStream {
  private prompt: string;
  private frequency: number;
  private informUser: InformUser;
  private intervalId: NodeJS.Timeout | null = null;
  private progressData = new ProgressData();

  constructor(frequency: number, prompt: string, informUser: InformUser) {
    this.frequency = frequency;
    this.prompt = prompt;
    this.informUser = informUser;
  }

  start(streams: ReadStream[]) {
    this.progressData.init(streams.length);

    this.intervalId = setInterval(() => this.showProgress(), this.frequency);

    streams.forEach((stream, i) => {
      stream.on('progress', (_, downloaded, total) => {
        this.progressData.data[i].downloaded = downloaded;
        this.progressData.data[i].total = total;
      });

      stream.on('end', (err: string) => {
        if (err) {
          console.log(err);
        } else {
          this.progressData.data[i].ended = true;
          if (this.progressData.allEnded()) {
            this.stop();
            this.informUser(`${this.prompt} has finished downloading\nTotal size: ${(this.progressData.totalSize())}`);
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

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
