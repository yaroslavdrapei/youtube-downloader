const Downloader = require('./modules/Downloader')
const getOptions = require('./modules/getOptions')
const inquirer = require('inquirer')
const ytdl = require('@distube/ytdl-core')

module.exports = async () => {
  const prompt = inquirer.createPromptModule()

  const { link } = await prompt([
    {
      type: 'input',
      name: 'link',
      message: 'Enter the link:'
    },
  ])

  if (!ytdl.validateURL(link)) {
    throw new Error('Invalid link!')
  }

  const info = await ytdl.getInfo(link)
  
  const { quality } = await prompt([
    {
      type: 'checkbox',
      name: 'quality',
      message: 'Choose quality:',
      choices: getOptions(info.formats)
    }
  ])

  const downloader = new Downloader(info)
  downloader.download(quality[0])
}