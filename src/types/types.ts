import { Video } from "../modules/Video";

export type FfmpegProgressArgs = {
  [key: string]: string;
};

export type InformUser = (info: string) => void;

export type SimplifiedFormat = {
  name?: string,
  itag: number,
  hasVideo: boolean,
  hasAudio: boolean
};

export type ChatVideoData = {
  [key: string]: Video;
};

export type YtdlError = {
  message: string;
}
