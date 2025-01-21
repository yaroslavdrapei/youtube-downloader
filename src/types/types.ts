import { Video } from '../modules/Video';

export type FfmpegProgressArgs = {
  [key: string]: string;
};

export type InformUser = (info: string) => void;

export type SimplifiedFormat = {
  name?: string;
  itag: number;
  hasVideo: boolean;
  hasAudio: boolean;
};

export type ChatVideoData = {
  [key: string]: Video;
};

export type YtdlError = {
  message: string;
};

export type Format = {
  asr?: number;
  filesize: number;
  format_id: string;
  format_note: string;
  source_preference: number;
  fps?: number;
  audio_channels?: number;
  height?: number;
  quality: number;
  has_drm: boolean;
  tbr: number;
  filesize_approx: number;
  url: string;
  width?: number;
  language?: string;
  language_preference: number;
  preference?: number;
  ext: string;
  vcodec: string;
  acodec: string;
  dynamic_range: string;
  container: string;
  downloader_options: {
    http_chunk_size: number;
  };
  protocol: string;
  video_ext: string;
  audio_ext: string;
  abr: number;
  vbr: number;
  resolution: string;
  aspect_ratio: number;
  http_headers: {
    'User-Agent': string;
    Accept: string;
    'Accept-Language': string;
    'Sec-Fetch-Mode': string;
  };
  format: string;
};

export type Thumbnail = {
  url: string;
  height?: number;
  width?: number;
  preference: number;
  id: string;
  resolution?: string;
};

export type VideoInfo = {
  id: string;
  title: string;
  formats: Format[];
  thumbnail?: string;
  thumbnails?: Thumbnail[];
  original_url: string;
};
