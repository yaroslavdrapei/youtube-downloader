const path = require('node:path');
const TelegramBot = require('node-telegram-bot-api');
const VideoInfo = require('./VideoInfo');
const Downloader = require('./Downloader');
const { deleteFile } = require('../utils/utils');

class MyBot extends TelegramBot {
  #infoHolder = {};
  constructor(token, options) {
    super(token, {...options});
  }

  async sendFormats(chatId, info) {
    this.#infoHolder[chatId] = new VideoInfo(info);

    const formats = this.#infoHolder[chatId].getSimplifiedFormats(10);

    const message = "Choose a format (enter the number)\n" + formats.map(f => f.name).join('\n');

    await this.sendMessage(chatId, message);
  }

  async sendFile(chatId, buffer, extension, title) {
    const contentType = extension == '.mp4' ? 'video/mp4' : 'audio/mpeg';

    const options = {
      filename: title+extension,
      contentType
    };

    if (extension == '.mp4') {
      await this.sendVideo(chatId, buffer, { caption: title }, options);
    } else {
      await this.sendAudio(chatId, buffer, {}, options);
    }
  }

  async downloadByInfo(chatId, formatIndex) {
    const infoHolder = this.#infoHolder[chatId];

    if (!infoHolder) {
      this.sendMessage(chatId, 'Enter the link first');
      return;
    }

    const formats = infoHolder.getSimplifiedFormats(10);

    if (formatIndex < 1 || formatIndex > formats.length) {
      this.sendMessage(`Enter number from 1 to ${formats.length}`);
      return;
    }
    
    const format = infoHolder.getFormatByItag(formats[formatIndex-1].itag);

    const messageId = (await this.sendMessage(chatId, 'Started downloading...')).message_id;

    const sendProgressUpdateToUser = (message) => {
      this.editMessageText(
        message,
        { chat_id: chatId, message_id: messageId }
      );
    };

    const downloader = new Downloader({
      progressBarMessageCallback: sendProgressUpdateToUser
    });

    try {
      const buffer = await downloader.download(format, infoHolder.info);
  
      this.editMessageText(`Video is being sent to you`, { chat_id: chatId, message_id: messageId });
  
      await this.sendFile(chatId, buffer, 
        formatIndex == 1 ? '.mp3' : '.mp4', 
        infoHolder.title
      );

      this.deleteMessage(chatId, messageId);
    } catch (err) {
      console.log(err);
      console.log(typeof err);
      this.sendMessage(chatId, `Error has occurred while downloading\nMore info: ${err}`);
    }
  }

  setCommand(command, message) {
    this.onText('/' + command, msg => {
      const chatId = msg.chat.id;

      this.sendMessage(chatId, message);
    });
  }
}

module.exports = MyBot;