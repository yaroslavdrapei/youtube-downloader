import { VideoInfo } from "../modules/VideoInfo";

export type FfmpegProgressArgs = {
  [key: string]: string;
};

export type InformUser = (info: string) => void;

export type SimplifiedFormat = {
  name: string;
  itag: number;
};

export type InfoHolder = {
  [key: string]: VideoInfo;
};
