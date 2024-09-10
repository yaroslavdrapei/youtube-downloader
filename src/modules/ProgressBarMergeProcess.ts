import { ChildProcess } from "child_process";
import { ffmpegProcessProgressParser, toMb } from "../utils/utils";
import { InformUser } from "../types/types";
import { ProgressBar } from "./ProgressBar";

export class ProgressBarMergeProcess extends ProgressBar {
  private _progressData: Buffer = Buffer.alloc(0); // default value

  public constructor(frequency: number, informUser: InformUser) {
    super(frequency, informUser);
  }

  public start(ffmpegProcess: ChildProcess, indexOfProgressStream: number): void {
    this._intervalId = setInterval(() => this.showProgress(), this.frequency);

    this.informUser('Merging files..\nIt might take some time');

    ffmpegProcess.stdio[indexOfProgressStream]?.on('data', (chunk: Buffer) => {
      this._progressData = chunk;
    });

    ffmpegProcess.on('exit', () => {
      this.stop();
      this.informUser('Merged!');
    });
  }

  public override showProgress(): void {
    const args = ffmpegProcessProgressParser(this._progressData);

    const total = toMb(parseInt(args.total_size ?? 'NaNmb'));
    if (total !== 'NaNmb') {
      const message = `Merging files: ${total} merged; bitrate: ${args['bitrate']}`;
      this.informUser(message);
    } else {
      this.informUser('Error has occurred');
      this.stop();
    }
  }
}