import { fileURLToPath } from 'url';
import path from 'path';
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  context: path.resolve(__dirname, 'src'),
  entry: {
    bot: './bot/index.ts',
    backend: './backend/index.ts'
  },
  output: {
    filename: '[name].js',
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
  externals: {
    'ffmpeg-static': 'commonjs2 ffmpeg-static'
  },
  watch: true,
  mode: 'development'
};