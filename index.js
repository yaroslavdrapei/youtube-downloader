const ytdl = require('@distube/ytdl-core');
const MyBot = require('./modules/MyBot');
const CommandTexts = require('./modules/CommandTexts');

const token = process.env.bot_token;
console.log(process.env)

const bot = new MyBot(token, { polling: true, baseApiUrl: 'http://localhost:8081' });

const commandTexts = new CommandTexts();

bot.setCommand('start', commandTexts.start);
bot.setCommand('help', commandTexts.help);

bot.onText(/^https:\/\/.+/, async (msg) => {
  const chatId = msg.chat.id;
  const link = msg.text;

  if (!ytdl.validateURL(link)) {
    bot.sendMessage(chatId, 'Invalid link! Try again');
    return;
  }

  const info = await ytdl.getInfo(link);

  bot.sendFormats(chatId, info);
});

bot.onText(/^\d{1,2}$/, async (msg) => {
  const chatId = msg.chat.id;
  const index = parseInt(msg.text);

  bot.downloadByInfo(chatId, index);
});
