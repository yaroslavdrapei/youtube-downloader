import TelegramBot, { ChatId, ConstructorOptions } from 'node-telegram-bot-api';
import { Video } from './Video';
import { Downloader } from './Downloader';
import { ChatVideoData, SimplifiedFormat } from '../types/types';
import { videoInfo } from '@distube/ytdl-core';
import path from 'node:path';
import { deleteFile } from '../utils/utils';

export class MyBot extends TelegramBot {
  private chats: ChatVideoData = {};
  public constructor(token: string, options: ConstructorOptions) {
    super(token, {...options});
  }

  public async sendFormats(chatId: ChatId, link: string, info: videoInfo): Promise<void> {
    this.chats[chatId] = new Video(link, info);

    const formats: SimplifiedFormat[] = this.chats[chatId].simplifiedFormats;

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

      return;
    }

    await this.sendAudio(chatId, pathToFile, {}, {
      filename: parsedFilename.base,
      contentType
    });
  }

  public async download(chatId: ChatId, formatIndex: number): Promise<void> {
    if (!this.chats[chatId]) {
      this.sendMessage(chatId, 'Enter the link first');
      return;
    }

    const formats = this.chats[chatId].simplifiedFormats;

    if (formatIndex < 1 || formatIndex > formats.length) {
      this.sendMessage(chatId, `Enter number from 1 to ${formats.length}`);
      return;
    }
    
    const format = this.chats[chatId].simplifiedFormats[formatIndex - 1];

    const messageId = (await this.sendMessage(chatId, 'Started downloading...')).message_id;

    const sendProgressUpdateToUser = (message: string): void => {
      this.editMessageText(
        message,
        { chat_id: chatId, message_id: messageId }
      );
    };

    const downloader = new Downloader(sendProgressUpdateToUser);

    let pathToFile: string = '';

    try {
      pathToFile = await downloader.download(this.chats[chatId], format);
    } catch (e) {
      console.log(e);
      this.sendMessage(chatId, `Error has occurred while downloading\nMore info: ${e}`);
      delete this.chats[chatId];
      return;
    }

    try {
      this.editMessageText(`Video is being sent to you`, { chat_id: chatId, message_id: messageId });
    } catch (e) {
      console.log(e);
    }

    try {
      await this.sendFile(chatId, pathToFile);
    } catch (e) {
      console.log(e);
      this.sendMessage(chatId, "Error occurred while sending the video. It has probably exceeded limit of 2GB. Try lowering the quality and try again");
      return;
    }

    try {
      this.deleteMessage(chatId, messageId);
    } catch (e) {
      console.log(e);
    } finally {
      deleteFile(pathToFile);
      delete this.chats[chatId];
    }
  }

  public setCommand(command: string, message: string): void {
    this.onText(('/' + command) as unknown as RegExp, msg => {
      const chatId = msg.chat.id;

      this.sendMessage(chatId, message);
    });
  }
};
