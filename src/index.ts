import ytdl from "@distube/ytdl-core";
import dotenv from "dotenv";
import { MyBot } from "./modules/MyBot";
import { CommandTexts } from "./modules/CommandTexts";
import { SimplifiedFormat } from "./types/types";

dotenv.config();

const token = process.env.BOT_TOKEN_DEV;
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

  if (!ytdl.validateURL(link)) {
    bot.sendMessage(chatId, 'Invalid link! Try again');
    return;
  }

  const info = await ytdl.getInfo(link);

  formatsMessageId = await bot.sendFormats(chatId, link, info);
});

bot.on('callback_query', callbackQuery => {
  const simplifiedFormat: SimplifiedFormat = JSON.parse(callbackQuery.data!);
  const chatId = callbackQuery.message!.chat.id;

  bot.deleteMessage(chatId, callbackQuery.message!.message_id);
  formatsMessageId = null;

  bot.download(chatId, simplifiedFormat);
});
