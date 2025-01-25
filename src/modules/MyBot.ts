import TelegramBot, {
  ChatId,
  ConstructorOptions,
  InlineKeyboardButton,
  Message,
  SendPhotoOptions
} from 'node-telegram-bot-api';
import { Video } from './Video';
import { Downloader } from './Downloader';
import { ChatVideoData, SimplifiedFormat, VideoInfo } from '../types/types';
import path from 'node:path';
import { deleteFolder } from '../utils/utils';

export class MyBot extends TelegramBot {
  private chats: ChatVideoData = {};
  public constructor(token: string, options: ConstructorOptions) {
    super(token, { ...options });
  }

  public async sendFormats(chatId: ChatId, link: string, info: VideoInfo): Promise<number> {
    this.chats[chatId] = new Video(link, info);

    const BUTTONS_PER_ROW = 2;

    const formats: SimplifiedFormat[] = this.chats[chatId].simplifiedFormats;
    const thumbnailUrl = this.chats[chatId].thumbnail;
    const buttons: InlineKeyboardButton[] = formats.map((format) => {
      const name = format.name as string;

      delete format.name;

      return { text: name, callback_data: JSON.stringify(format) };
    });

    const options: SendPhotoOptions = {
      reply_markup: {
        inline_keyboard: this.buildButtonGrid(buttons, BUTTONS_PER_ROW)
      },

      caption: this.chats[chatId].title
    };

    if (!thumbnailUrl) {
      return (await this.sendMessage(chatId, this.chats[chatId].title, options)).message_id;
    }

    // in case if path to thumbnail is not correct just send a title with formats
    try {
      return (await this.sendPhoto(chatId, thumbnailUrl, options)).message_id;
    } catch (e) {
      console.log(e);
      return (await this.sendMessage(chatId, this.chats[chatId].title, options)).message_id;
    }
  }

  public async sendFile(chatId: ChatId, pathToFile: string): Promise<void> {
    const parsedFilename = path.parse(pathToFile);

    const options = {
      filename: parsedFilename.base,
      contentType: parsedFilename.ext == '.mp4' ? 'video/mp4' : 'audio/mpeg'
    };

    if (parsedFilename.ext == '.mp4') {
      await this.sendVideo(chatId, pathToFile, { caption: parsedFilename.name }, options);
      return;
    }

    await this.sendAudio(chatId, pathToFile, {}, options);
  }

  public async download(chatId: ChatId, format: SimplifiedFormat): Promise<void> {
    const currentVideo: Video | undefined = this.chats[chatId];

    if (!currentVideo) {
      this.sendMessage(chatId, 'Enter the link first');
      return;
    }

    const messageId = (await this.sendMessage(chatId, 'Started downloading...')).message_id;

    const downloader = new Downloader(this.createEditMessageText(chatId, messageId));

    let pathToFile = '';

    try {
      pathToFile = await downloader.download(currentVideo, format);
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
      this.sendMessage(
        chatId,
        'Error occurred while sending the video. It has probably exceeded limit of 2GB. Try lowering the quality and try again'
      );
      deleteFolder(path.parse(pathToFile).dir);
      return;
    }

    try {
      this.deleteMessage(chatId, messageId);
    } catch (e) {
      console.log(e);
    } finally {
      deleteFolder(path.parse(pathToFile).dir);
      delete this.chats[chatId];
    }
  }

  public setCommand(command: string, message: string): void {
    this.onText(('/' + command) as unknown as RegExp, (msg) => {
      const chatId = msg.chat.id;

      this.sendMessage(chatId, message);
    });
  }

  private buildButtonGrid = (buttons: InlineKeyboardButton[], buttonsPerRow = 1): InlineKeyboardButton[][] => {
    const buttonsMarkup: InlineKeyboardButton[][] = [[]];

    buttons.forEach((btn, i) => {
      if (i % buttonsPerRow == 0) {
        buttonsMarkup.push([]);
      }

      buttonsMarkup.at(-1)?.push(btn);
    });

    return buttonsMarkup;
  };

  private createEditMessageText = (
    chatId: ChatId,
    messageId: number
  ): ((message: string) => Promise<boolean | Message>) => {
    const resultFunc = (message: string): Promise<boolean | Message> => {
      return this.editMessageText(message, { chat_id: chatId, message_id: messageId });
    };

    return resultFunc;
  };
}
