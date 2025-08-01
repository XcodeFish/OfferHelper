const path = require('path');

module.exports = {
  target: 'electron-main',
  entry: './src/main/main.ts',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'main.js'
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
      '@/main': path.resolve(__dirname, '../src/main'),
      '@/shared': path.resolve(__dirname, '../src/shared')
    }
  },
  node: {
    __dirname: false,
    __filename: false
  },
  externals: {
    'sqlite3': 'commonjs sqlite3',
    'better-sqlite3': 'commonjs better-sqlite3'
  }
};