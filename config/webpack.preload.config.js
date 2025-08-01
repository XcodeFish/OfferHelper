const path = require('path');

module.exports = {
  target: 'electron-preload',
  entry: './src/preload/index.ts',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'preload/index.js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, '../tsconfig.main.json')
          }
        },
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@/shared': path.resolve(__dirname, '../src/shared')
    }
  },
  node: {
    __dirname: false,
    __filename: false
  }
};