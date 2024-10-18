import TelegramBot, { ChatId, ConstructorOptions } from 'node-telegram-bot-api';
import { VideoInfo } from './VideoInfo';
import { Downloader } from './Downloader';
import { InfoHolder, SimplifiedFormat } from '../types/types';
import { videoInfo } from '@distube/ytdl-core';
import path from 'node:path';
import { deleteFile } from '../utils/utils';

export class MyBot extends TelegramBot {
  private _infoHolder: InfoHolder = {};
  public constructor(token: string, options: ConstructorOptions) {
    super(token, {...options});
  }

  public async sendFormats(chatId: ChatId, info: videoInfo): Promise<void> {
    this._infoHolder[chatId] = new VideoInfo(info);

    const formats: SimplifiedFormat[] = this._infoHolder[chatId].getSimplifiedFormats(10);

    const message = "Choose a format (enter the number)\n" + formats.map(f => f.name).join('\n');

    await this.sendMessage(chatId, message);
  }

  public async sendFile(chatId: ChatId, pathToFile: string): Promise<void> {
    const parsedFilename = path.parse(pathToFile);

    const contentType = parsedFilename.ext == '.mp4' ? 'video/mp4' : 'audio/mpeg';

    if (parsedFilename.ext == '.mp4') {
      await this.sendVideo(chatId, pathToFile, { caption: parsedFilename.name }, {
        filename: parsedFilename.base,
        contentType
      });
    } else {
      await this.sendAudio(chatId, pathToFile, {}, {
        filename: parsedFilename.base,
        contentType
      });
    }
  }

  public async downloadByInfo(chatId: ChatId, formatIndex: number): Promise<void> {
    if (!this._infoHolder[chatId]) {
      this.sendMessage(chatId, 'Enter the link first');
      return;
    }

    const formats = this._infoHolder[chatId].getSimplifiedFormats(10);

    if (formatIndex < 1 || formatIndex > formats.length) {
      this.sendMessage(chatId, `Enter number from 1 to ${formats.length}`);
      return;
    }
    
    const format = this._infoHolder[chatId].getFormatByItag(formats[formatIndex-1].itag);

    const messageId = (await this.sendMessage(chatId, 'Started downloading...')).message_id;

    const sendProgressUpdateToUser = (message: string): void => {
      this.editMessageText(
        message,
        { chat_id: chatId, message_id: messageId }
      );
    };

    const downloader = new Downloader(this._infoHolder[chatId].info, sendProgressUpdateToUser);

    try {
      const pathToFile = await downloader.download(format);
  
      this.editMessageText(`Video is being sent to you`, { chat_id: chatId, message_id: messageId });
  
      await this.sendFile(chatId, pathToFile);

      this.deleteMessage(chatId, messageId);
  
      deleteFile(pathToFile);
    } catch (err) {
      console.log(err);
      console.log(typeof err);
      this.sendMessage(chatId, `Error has occurred while downloading\nMore info: ${err}`);
    }
  }

  public setCommand(command: string, message: string): void {
    this.onText(('/' + command) as unknown as RegExp, msg => {
      const chatId = msg.chat.id;

      this.sendMessage(chatId, message);
    });
  }
};
