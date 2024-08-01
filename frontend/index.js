const TelegramBot = require('node-telegram-bot-api');
const VideoInfo = require('./modules/VideoInfo');
const { validateURL, postRequest, getBuffer } = require('../shared/utils');

const token = '7371964647:AAEEAv5JqQZlh9wfXdt0QgJJ2AYqY2CLxCc';

const bot = new TelegramBot(token, { polling: true, baseApiUrl: 'http://localhost:8081' });

let videoInfo;

bot.onText('/start', msg => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, `
Welcome to Youtube Download Bot
It can download videos up to 2GB
You just need to send the link and choose the format
Feel free to download music or videos in any format you like!`
  );
});

bot.onText(/^https:\/\/.+/, async (msg) => {
  const chatId = msg.chat.id;
  const link = msg.text;

  if (!validateURL(link)) {
    bot.sendMessage(chatId, 'Invalid link! Try again');
    return;
  }

  const response = await postRequest('http://localhost:3000/api/video-info', { link });

  videoInfo = new VideoInfo(await response.json());

  const message = videoInfo
    .getSimplifiedFormats(10)
    .map(format => format.name)
    .join('\n');

  bot.sendMessage(chatId, message);
});

bot.onText(/^\d{1,2}$/, async (msg) => {
  const chatId = msg.chat.id;
  const index = parseInt(msg.text);

  if (!videoInfo) {
    bot.sendMessage(chatId, 'Enter the link first');
    return;
  }

  const userFormats = videoInfo.getSimplifiedFormats(10);

  if (index > userFormats.length || index < 1) {
    bot.sendMessage(chatId, `Enter number from 1 to ${userFormats.length}`);
    return;
  }

  const format = videoInfo.getFormatByItag(userFormats[index - 1].itag);
  let response;

  try {
    response = await postRequest('http://localhost:3000/api/download-by-link', {
      info: videoInfo.info,
      format,
    });
  } catch (err) {
    bot.sendMessage(chatId, `Server crashed: \n${err}`);
    return;
  }

  if (response.status == 403) {
    bot.sendMessage(chatId, await response.text());
    return; 
  }

  bot.sendMessage(chatId, 'Download started');

  const file = await getBuffer(response.body);

  if (format.hasVideo) {
    bot.sendVideo(chatId, file, {}, {
      filename: videoInfo.title + '.mp4',
      contentType: 'video/mp4'
    });
  } else {
    bot.sendAudio(chatId, file, {}, {
      filename: videoInfo.title + '.mp3',
      contentType: 'audio/mpeg',
    });
  }
});
