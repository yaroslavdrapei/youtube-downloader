import { InformUser } from '../types/types';

export abstract class ProgressBar {
  protected _intervalId: NodeJS.Timeout | null = null;
  protected _frequency: number;
  public informUser: InformUser;

  public constructor(frequency: number, informUser = console.log) {
    this._frequency = frequency;
    this.informUser = informUser;
  }

  public get frequency(): number {
    return this._frequency;
  }

  public set frequency(value: number) {
    this._frequency = value > 1000 ? value : 1000;
  }

  public showProgress(): void {}
  public stop(): void {
    if (this._intervalId) clearInterval(this._intervalId);
  }
}
