const visConstants = require('../constants/visualisation.json');
const colorSchema = require('../constants/color-schema.json');
const shapes = require('../constants/shapes.json');

const defaultConfig = {
  colorSchema,
  polymerShapes: shapes.MAP_POLYMER_SHAPE,
  connectionLineWidth: visConstants.SVG_LINE_WIDTH,
  defaultConnectionLineLength: visConstants.SVG_DEFAULT_LINE_LENGTH,
  internalConnectionPadding: visConstants.SVG_C_LINK_PADDING_INTERNAL,
  externalConnectionPadding: visConstants.SVG_C_LINK_PADDING_EXTERNAL,
  internalConnectionHeight: visConstants.SVG_C_LINK_HEIGHT,
  marginBetweenSubSequences: visConstants.SVG_Y_SHIFT,
  monomerEdgeWidth: visConstants.SVG_EDGE_WIDTH,
  monomerSize: visConstants.SVG_ITEM_SIZE,
  cLinkAngleCorrectionInternal: visConstants.SVG_C_LINK_ANGLE_CORRECTION_INTERNAL,
  cLinkAngleCorrectionExternal: visConstants.SVG_C_LINK_ANGLE_CORRECTION_EXTERNAL,
};

const config = { ...defaultConfig };

function setConfig(newConfig) {
  if (typeof newConfig !== 'object') {
    return this;
  }

  Object.keys(defaultConfig).forEach((key) => {
    this[key] = newConfig[key] || defaultConfig[key];
  });

  return this;
}

function resetConfig() {
  return setConfig.call(config, {});
}

module.exports = {
  config,
  resetConfig,
  setConfig: setConfig.bind(config),
};
