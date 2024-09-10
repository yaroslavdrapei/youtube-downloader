import { VideoInfo } from "../modules/VideoInfo";

export type FfmpegProgressArgs = {
  frame?: string,
  fps?: string,
  stream_0_1_q?: string,
  bitrate?: string,
  total_size?: string,
  out_time_us?: string,
  out_time_ms?: string,
  out_time?: string,
  dup_frames?: string,
  drop_frames?: string,
  speed?: string,
  progress?: string,
}

export type InformUser = (info: string) => void;

export type SimplifiedFormat = {
  name: string,
  itag: number
}

export type InfoHolder = {
  [key: string]: VideoInfo
}