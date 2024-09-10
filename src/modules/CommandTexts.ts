import { readFileSync } from 'fs';

export default class CommandTexts {
  private blocks;
  public start;
  public help;
  constructor() {
    this.blocks = JSON.parse(readFileSync('./command-text-blocks.json').toString());
    this.start = `${this.blocks.welcome}\n\n${this.blocks.guide}`;
    this.help = `${this.blocks.guide}\n\n${this.blocks.faq}`;
  }
}
