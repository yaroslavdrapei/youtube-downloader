const fs = require('node:fs')

module.exports = (path, filename, extension) => {
  if (!fs.existsSync(path + '/' + filename + extension)) {
    return filename
  }
  let i = 2
  while (fs.existsSync(path + '/' + filename + ` (${i})` + extension)) i++
  return filename + ` (${i})`
}