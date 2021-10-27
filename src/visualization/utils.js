const { config } = require('../config');

/**
 * Function for conversion HEX color representation to rgba object
 * @param {string} HEXString a color representation in HEX format
 * @returns {{
 *  r: number;
 *  g: number;
 *  b: number;
 *  a: number;
 * }} an rgba color
 */
function convertHEXtoRGBA(HEXString) {
  const rgba = { a: 1 };
  rgba.r = parseInt(HEXString.substring(0, 2), 16);
  rgba.g = parseInt(HEXString.substring(2, 4), 16);
  rgba.b = parseInt(HEXString.substring(4, 6), 16);
  const alpha = HEXString.substring(6, 8);

  if (alpha) {
    rgba.a = parseInt(alpha, 16) / 255;
  }

  return rgba;
}

/**
 * Util for fill all the optional fields with default color if is not provided
 * and convert HEX colors to rgba for SVG support
 * @param {
 *  background?: string;
 *  color?: string;
 *  border?: string;
 * } colors a set of colors
 * @returns {{
 *  background: string;
 *  color: string;
 *  border: string;
 * }}
 */
function normalizeColors(colors) {
  const defaultColors = config.colorSchema.default;
  const normalizedColors = {
    background: colors.background || defaultColors.background,
    color: colors.color || defaultColors.color,
    border: colors.border || defaultColors.border,
  };

  if (normalizedColors.background.startsWith('#')) {
    const rgba = convertHEXtoRGBA(normalizedColors.background.substring(1));
    normalizedColors.background = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
  }

  if (normalizedColors.color.startsWith('#')) {
    const rgba = convertHEXtoRGBA(normalizedColors.color.substring(1));
    normalizedColors.color = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
  }

  if (normalizedColors.border.startsWith('#')) {
    const rgba = convertHEXtoRGBA(normalizedColors.border.substring(1));
    normalizedColors.border = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
  }

  return normalizedColors;
}

/**
 * Function for getting a colors set for monomer's rendering.
 * It search for colors set inside of configuration object
 * and provides a default set of colors if no such monomer or some field is empty
 *
 * @param {string} symbol the monomer's symbol
 * @param {number} index position of current symbol in a sequence
 * @param {string[]} sequenceToCompare sequence of monomers for compare with
 * @returns {{
 *  background: string;
 *  color: string;
 *  border: string;
 * }}
 */
function getColorsByMonomer(symbol, index, sequenceToCompare) {
  let colors = config.colorSchema.monomers[symbol] || {};
  if (sequenceToCompare) {
    colors = sequenceToCompare[index] === symbol
      ? (config.colorSchema.comparison.equal || {})
      : (config.colorSchema.comparison.notEqual || {});
  }

  return normalizeColors(colors);
}

function signedPower(x, y) {
  return Math.sign(x) * (Math.abs(x) ** y);
}

/**
 * @param {*} points the more points the smoother the shape
 * @param {*} shape 1 = diamond, 2 = ellipse, 3 and more is rounded square (order in power function)
 * @param {*} posX position of element
 * @param {*} posY position of element
 * @param {*} diameterX diameter of element
 * @param {*} diameterY diameter of element
 */
function basicShape(pointsCount, shape, posX, posY, diameterX, diameterY) {
  const power = 2 / shape;
  const angle = (Math.PI * 2) / pointsCount;
  const radiusX = diameterX / 2;
  const radiusY = diameterY / 2;
  const result = [];

  for (let i = 0; i < pointsCount; i += 1) {
    const x = posX + radiusX * signedPower(Math.cos(i * angle), power);
    const y = posY + radiusY * signedPower(Math.sin(i * angle), power);
    result.push([x, y]);
  }

  return result;
}

function appendItemsToSVG(svg, items) {
  items.forEach((item) => {
    svg.appendChild(item);
  });
}

module.exports = {
  getColorsByMonomer,
  signedPower,
  basicShape,
  appendItemsToSVG,
};
