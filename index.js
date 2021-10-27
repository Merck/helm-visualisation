const parse = require('./src/parse');
const generateSVG = require('./src/visualization');
const { config, setConfig, resetConfig } = require('./src/config');

module.exports = {
  parse,
  generateSVG,
  config,
  setConfig,
  resetConfig,
};
