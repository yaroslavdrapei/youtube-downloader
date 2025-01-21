import dotenv from 'dotenv';

dotenv.config();

import { MyBot } from './modules/MyBot';
import { CommandTexts } from './modules/CommandTexts';
import { SimplifiedFormat, VideoInfo } from './types/types';
import YTDlpWrap from 'yt-dlp-wrap';

YTDlpWrap.downloadFromGithub('./yt-dlp', undefined, 'linux');
const ytdlpwrap = new YTDlpWrap('./yt-dlp');

const token = process.env.BOT_TOKEN_PROD;
const port = process.env.PORT || 8081;

const bot = new MyBot(token as string, { polling: true, baseApiUrl: `http://telegram-server:${port}` });

const commandTexts = new CommandTexts();

let formatsMessageId: number | null = null;

bot.setCommand('start', commandTexts.start);
bot.setCommand('help', commandTexts.help);

bot.onText(/^https:\/\/.+/, async (msg) => {
  const chatId = msg.chat.id;
  const link = msg.text ?? '';

  if (formatsMessageId) {
    bot.deleteMessage(chatId, formatsMessageId);
    formatsMessageId = null;
  }

  try {
    const info: VideoInfo = JSON.parse(await ytdlpwrap.execPromise([link, '-j']));
    formatsMessageId = await bot.sendFormats(chatId, link, info);
  } catch (e) {
    bot.sendMessage(chatId, 'Invalid link');
    console.log(e);
    return;
  }
});

bot.on('callback_query', (callbackQuery) => {
  const simplifiedFormat: SimplifiedFormat = JSON.parse(callbackQuery.data!);
  const chatId = callbackQuery.message!.chat.id;

  bot.deleteMessage(chatId, callbackQuery.message!.message_id);
  formatsMessageId = null;

  bot.download(chatId, simplifiedFormat);
});
