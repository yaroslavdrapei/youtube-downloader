import ytdl from "@distube/ytdl-core";
import dotenv from "dotenv";
import { MyBot } from "./modules/MyBot";
import { CommandTexts } from "./modules/CommandTexts";

dotenv.config();

const token = process.env.BOT_TOKEN_PROD;
const port = process.env.PORT || 8081;

const bot = new MyBot(token as string, { polling: true, baseApiUrl: `http://telegram-server:${port}` });

const commandTexts = new CommandTexts();

bot.setCommand('start', commandTexts.start);
bot.setCommand('help', commandTexts.help);

bot.onText(/^https:\/\/.+/, async (msg) => {
  const chatId = msg.chat.id;
  const link = msg.text ?? '';

  if (!ytdl.validateURL(link)) {
    bot.sendMessage(chatId, 'Invalid link! Try again');
    return;
  }

  const info = await ytdl.getInfo(link);

  bot.sendFormats(chatId, link, info);
});

bot.onText(/^\d{1,2}$/, async (msg) => {
  const chatId = msg.chat.id;
  const index = parseInt(msg.text ?? '');

  bot.download(chatId, index);
});
