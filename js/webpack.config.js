const path = require('path');
const config = require('flarum-webpack-config')();

const coreSrc = path.resolve(__dirname, '../../../vendor/flarum/core/js/src');

config.resolve = config.resolve || {};
config.resolve.alias = Object.assign({}, config.resolve.alias, {
  'flarum/forum': path.join(coreSrc, 'forum'),
  'flarum/admin': path.join(coreSrc, 'admin'),
  'flarum/common': path.join(coreSrc, 'common'),
});

module.exports = config;
