import { fileURLToPath } from 'url';
import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: './src/index.ts',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
  target: 'node',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        // TODO: make it work on all OS and copy only executable
        { from: path.resolve(__dirname, 'node_modules/ffmpeg-static'), to: '' }
      ]
    })
  ],
  mode: 'development'
};