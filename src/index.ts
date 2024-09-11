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

/*
  TODO: 0) Remove all trash branches locally and in the remote

  TODO: 1.1) Create a branch fix/merge-crash
  TODO: 1.2) Get back to file system instead of streams in order to avoid merge crash issue
  TODO: 1.3) Merge to refactor/typescript-integration

  TODO: 2.1) Checkout to deploy/docker-compose
  TODO: 2.2) Dockerize the bot
  TODO: 2.3) Create a docker compose file
  TODO: 2.4) Merge with branch refactor/typescript-integration
  TODO: 2.5) Deploy the bot (optional)

  TODO: 3.1) Create a branch refactor/solid-principles
  TODO: 3.2) Rewrite the whole project logic 
  TODO: 3.3) Merge to refactor/typescript-integration
  TODO: 3.4) Merge to master
  
  TODO: 4) Deploy the bot
*/