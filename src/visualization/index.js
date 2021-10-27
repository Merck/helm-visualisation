const { config } = require('../config');
const { calculateShapes, correctPlacementOfShapes } = require('./positioning');
const { buildConnectionsBetweenSequences, buildConnections, buildNodes } = require('./rendering');
const { appendItemsToSVG } = require('./utils');

/**
 * Function for generating SVG objects from parsed data of HELM string
 *
 * @param {Object} data             result of parsing HELM string with monomers sequence
 *                                  and connections between monomers and chains
 *
 * @param {Object} originalSequence array with chains of parsed HELM string to compare
 *                                  monomers from data and highlight mismatches
 *
 * @param {Number} seqIndex         index of a sequence to be put as metadata for rendered monomers
 *                                  (useful in case of many sequences)
 *
 * @param {Boolean} linear          if true - generates svg where each chain is just a line,
 *                                  otherwise - if there is some connection between monomers
 *                                  in one chain, builds it as a circle structure
 *
 * @returns {SVG}                   svg representation of monomers sequence
 */
module.exports = function generateSVG(data, originalSequence, seqIndex, linear = false) {
  const { sequences, connectionsBetweenSequences } = data;
  const shapes = calculateShapes(sequences, seqIndex, linear);
  const {
    correctedShapes,
    correctedLinks,
  } = correctPlacementOfShapes(shapes, connectionsBetweenSequences);

  const svg = document.createElement('svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('version', '1.1');
  svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  svg.setAttribute('fill', 'white');

  let totalWidth = 0;
  let totalHeight = 0;

  const linesBetweenSequences = buildConnectionsBetweenSequences(
    correctedShapes,
    correctedLinks,
  );

  linesBetweenSequences.forEach((line) => {
    const x1RightPos = parseInt(line.getAttribute('x1'), 10) + config.connectionLineWidth;
    const x2RightPos = parseInt(line.getAttribute('x2'), 10) + config.connectionLineWidth;
    totalWidth = Math.max(totalWidth, x1RightPos, x2RightPos);
  });

  appendItemsToSVG(svg, linesBetweenSequences);

  correctedShapes.forEach((shape) => {
    const connections = buildConnections(shape, linear);
    appendItemsToSVG(svg, connections);

    let comparisonSeq;
    if (originalSequence) {
      comparisonSeq = (originalSequence[shape.originalIndex] || {}).monomers || [];
    }

    const nodes = buildNodes(shape.points, comparisonSeq);
    appendItemsToSVG(svg, nodes);

    totalWidth = Math.max(shape.width, totalWidth);
    totalHeight += shape.height + config.marginBetweenSubSequences;
  });

  svg.setAttribute('width', totalWidth);
  svg.setAttribute('height', totalHeight - config.marginBetweenSubSequences);

  return svg;
};
