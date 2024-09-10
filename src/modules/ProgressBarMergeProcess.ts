import { ChildProcess } from "child_process";
import { ffmpegProcessProgressParser, toMb } from "../utils/utils";
import { InformUser } from "../types/types";

export default class ProgressBarMergeProcess {
  private progressData: Buffer | null = null;
  public frequency: number;
  public informUser: InformUser;
  public intervalId: NodeJS.Timeout | null = null;
  constructor(frequency: number, informUser: InformUser) {
    this.frequency = frequency;
    this.informUser = informUser;
  }

  start(ffmpegProcess: ChildProcess, indexOfProgressStream: number) {
    this.intervalId = setInterval(() => this.showProgress(), this.frequency);

    this.informUser('Merging files..\nIt might take some time');

    ffmpegProcess.stdio[indexOfProgressStream]?.on('data', (chunk: Buffer) => {
      this.progressData = chunk;
    });

    ffmpegProcess.on('exit', () => {
      this.stop();
      this.informUser('Merged!');
    });
  }

  showProgress() {
    const args = ffmpegProcessProgressParser(this.progressData ? this.progressData : new Buffer('default'));

    const total = toMb(parseInt(args.total_size ?? 'NaNmb'));
    if (total !== 'NaNmb') {
      const message = `Merging files: ${total} merged; bitrate: ${args['bitrate']}`;

      // not using informUser here because i'm not sure if user needs this information
      console.log(message);
    } else {
      this.informUser('Error has occurred');
      this.stop();
    }
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}