const toMb = (bytes) => (bytes / 1024 / 1024).toFixed(2) + 'mb'
const getRandom = (max) => Math.floor(Math.random() * max)
module.exports = {
  toMb,
  getRandom
}