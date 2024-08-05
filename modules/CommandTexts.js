const fs = require('fs');

class CommandTexts {
  #blocks;
  start;
  help;
  constructor() {
    this.#blocks = JSON.parse(fs.readFileSync('./command-text-blocks.json'));
    this.start = `${this.#blocks.welcome}\n\n${this.#blocks.guide}`;
    this.help = `${this.#blocks.guide}\n\n${this.#blocks.faq}`;
  }
}

module.exports = CommandTexts;
