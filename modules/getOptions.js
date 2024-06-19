module.exports = (formats) => {
  const result = []
  
  result.push({name: `${result.length+1}. Best quality video`, value: {itag: 'highestvideo', hasVideo: true, hasAudio: false}})
  result.push({name: `${result.length+1}. Best quality audio`, value: {itag: 'highestaudio', hasVideo: false, hasAudio: true}})

  result.push(...formats.map(({hasVideo, hasAudio, qualityLabel, audioCodec, container, itag}, i) => {
    const number = result.length+i+1
    const value = {itag, hasVideo, hasAudio}
    if (hasVideo && hasAudio) { // video and audio
      return {name: `${number}. ${qualityLabel} ${container}`, value}
    } else if (hasVideo && !hasAudio) { // only video
      return {name: `${number}. ${qualityLabel} ${container} / no sound`, value}
    } else { // only audio
      return {name: `${number}. ${container} ${audioCodec}`, value}
    }
  }))

  return result
}