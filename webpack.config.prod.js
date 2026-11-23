const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  plugins: [
    // 각 HTML에 <script>를 직접 넣어두었으므로 자동 삽입(inject)은 끔
    new HtmlWebpackPlugin({
      template: './index.html',
      inject: false,
    }),
    ...['menu', 'about', 'notice', 'location'].map((page) => new HtmlWebpackPlugin({
      template: `./${page}.html`,
      filename: `${page}.html`,
      inject: false,
    })),
    new CopyPlugin({
      patterns: [
        { from: 'img', to: 'img' },
        { from: 'css', to: 'css' },
        { from: 'js/menu-data.js', to: 'js/menu-data.js' },
        { from: 'js/menu.js', to: 'js/menu.js' },
        { from: 'js/notice.js', to: 'js/notice.js' },
        { from: 'js/hours.js', to: 'js/hours.js' },
        { from: 'icon.svg', to: 'icon.svg' },
        { from: 'favicon.ico', to: 'favicon.ico' },
        { from: 'robots.txt', to: 'robots.txt' },
        { from: 'icon.png', to: 'icon.png' },
        { from: '404.html', to: '404.html' },
        { from: 'site.webmanifest', to: 'site.webmanifest' },
      ],
    }),
  ],
});
