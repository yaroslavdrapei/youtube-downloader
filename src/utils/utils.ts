import fs from 'fs';
import { FfmpegProgressArgs } from '../types/types';

export const toMb = (bytes: number): string => {
  return (bytes / 1024 / 1024).toFixed(2) + 'mb';
};

export const fromKbtoMb = (kb: number): string => {
  return (kb / 1024).toFixed(2) + 'mb';
};

export const deleteFile = (pathToFile: string): void =>
  fs.unlink(pathToFile, (err) => {
    if (err) console.log(err);
  });

export const generateRandomSeed = (length = 10): string => {
  let seed = '';
  for (let i = 0; i < length; i++) {
    seed += Math.floor(Math.random() * 10).toString();
  }
  return seed;
};

export const getBuffer = async (readableStream: NodeJS.ReadStream): Promise<Buffer> => {
  const buffers: Buffer[] = [];

  readableStream.on('data', (chunk: Buffer) => {
    buffers.push(chunk);
  });

  return new Promise<Buffer>((resolve, reject) => {
    readableStream.on('end', () => resolve(Buffer.concat(buffers)));
    readableStream.on('error', reject);
  });
};

export const ffmpegProcessProgressParser = (args: Buffer): FfmpegProgressArgs => {
  const lines = args.toString().trim().split('\n');
  const parsedArgs: FfmpegProgressArgs = {};

  for (const l of lines) {
    const [key, value] = l.split('=');
    parsedArgs[key] = value;
  }

  return parsedArgs;
};
