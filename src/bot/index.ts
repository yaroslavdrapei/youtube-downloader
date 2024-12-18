import ytdl, { videoInfo } from '@distube/ytdl-core';
import dotenv from 'dotenv';
import { MyBot } from './services/MyBot';
import { CommandTexts } from './services/CommandTexts';
import { SimplifiedFormat, YtdlError } from '../shared/types/types';

dotenv.config();

const token = process.env.BOT_TOKEN;
const port = process.env.PORT || 8081;

const bot = new MyBot(token as string, { polling: true, baseApiUrl: `http://localhost:${port}` });

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
    formatsMessageId = await bot.sendFormats(chatId, link);
  } catch (e) {
    console.log(e);
    const errorMessage = (e as YtdlError).message;

    let messageToUser = 'Unknown error';

    if (errorMessage.includes('age')) {
      messageToUser = 'Video is age restricted';
    } else if (errorMessage.includes('bot')) {
      messageToUser = 'Server overload';
    }

    bot.sendMessage(chatId, 'Error occurred: ' + messageToUser);
  }
});

bot.on('callback_query', (callbackQuery) => {
  const simplifiedFormat: SimplifiedFormat = JSON.parse(callbackQuery.data!);
  const chatId = callbackQuery.message!.chat.id;

  bot.deleteMessage(chatId, callbackQuery.message!.message_id);
  formatsMessageId = null;

  bot.download(chatId, simplifiedFormat);
});
