import { InformUser } from '../types/types';
import { ProgressBar } from './ProgressBar';

export class ProgressBarYtdlp extends ProgressBar {
  private progressData: number = 0;
  public constructor(frequency: number, informUser: InformUser) {
    super(frequency, informUser);
  }

  public start(progress?: number): void {
    if (progress) {
      this.progressData = progress;
    }

    this._intervalId = setInterval(() => this.showProgress(), this.frequency);
  }

  public updateProgress(newProgress?: number): void {
    if (newProgress && this.progressData < newProgress) {
      this.progressData = newProgress;
    }
  }

  public showProgress = (): void => {
    this.informUser(`Progress: ${this.progressData == 0 ? '...' : this.progressData}%`);
  };
}
