import ytdl from "@distube/ytdl-core";
import { MyBot } from "./modules/MyBot";
import { CommandTexts } from "./modules/CommandTexts";

const token = process.env.bot_token;
const port = process.env.port || 8081;

const bot = new MyBot(token as string, { polling: true, baseApiUrl: `http://localhost:${port}` });

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

  bot.sendFormats(chatId, info);
});

bot.onText(/^\d{1,2}$/, async (msg) => {
  const chatId = msg.chat.id;
  const index = parseInt(msg.text ?? '');

  bot.downloadByInfo(chatId, index);
});
