import { readFileSync } from 'fs';

export class CommandTexts {
  private _blocks;
  public start;
  public help;
  
  public constructor() {
    this._blocks = JSON.parse(readFileSync('./command-text-blocks.json').toString());
    this.start = `${this._blocks.welcome}\n\n${this._blocks.guide}`;
    this.help = `${this._blocks.guide}\n\n${this._blocks.faq}`;
  }
}
