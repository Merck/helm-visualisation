const { getColorsByMonomer, basicShape } = require('./utils');
const { config } = require('../config');

function buildLine(fromX, fromY, toX, toY) {
  const line = document.createElement('line');
  line.setAttribute('x1', fromX);
  line.setAttribute('y1', fromY);
  line.setAttribute('x2', toX);
  line.setAttribute('y2', toY);
  line.setAttribute('stroke', config.colorSchema.linkColor);
  line.setAttribute('stroke-width', config.connectionLineWidth);

  return line;
}

function buildCLinksBetweenSequences(fromX, fromY, toX, toY, offset) {
  const angleCorrection = config.cLinkAngleCorrectionExternal;
  const connectionPadding = config.externalConnectionPadding * offset;

  const startLine = buildLine(
    fromX,
    fromY,
    fromX + connectionPadding,
    fromY + angleCorrection,
  );
  const midLine = buildLine(
    fromX + connectionPadding,
    fromY + angleCorrection,
    toX + connectionPadding,
    toY - angleCorrection,
  );
  const endLine = buildLine(
    toX + connectionPadding,
    toY - angleCorrection,
    toX,
    toY,
  );

  return [startLine, midLine, endLine];
}

function buildConnectionsBetweenSequences(shapes, linkBetweenChains) {
  const overlappedLinks = {};

  function extendGap(xPosition, gapIndex, absFromY, absToY) {
    const [start, end, count] = overlappedLinks[xPosition][gapIndex];
    overlappedLinks[xPosition][gapIndex] = [
      Math.min(start, absFromY),
      Math.max(end, absToY),
      count + 1,
    ];

    return count + 1;
  }

  const linksCopy = [...linkBetweenChains];
  linksCopy.sort((a, b) => {
    const aLength = Math.abs(a.seqFrom.seqIndex - a.seqTo.seqIndex);
    const bLength = Math.abs(b.seqFrom.seqIndex - b.seqTo.seqIndex);
    return aLength - bLength;
  });

  const result = [];
  linksCopy.forEach(({ seqFrom, seqTo }) => {
    let offset;
    const fromSeq = shapes[seqFrom.seqIndex];
    const toSeq = shapes[seqTo.seqIndex];

    const fromPoint = fromSeq.points[seqFrom.monomerIndex];
    const toPoint = toSeq.points[seqTo.monomerIndex];
    const absFromY = Math.min(fromPoint.y, toPoint.y);
    const absToY = Math.max(fromPoint.y, toPoint.y);
    const absFromX = Math.min(fromPoint.x, toPoint.x);
    const absToX = Math.max(fromPoint.x, toPoint.x);

    if (fromPoint.x - toPoint.x === 0) {
      overlappedLinks[fromPoint.x] = overlappedLinks[fromPoint.x] || [];

      if (!overlappedLinks[fromPoint.x].length) {
        // array is represents [start of gap, end of gap, how many links already inside]
        overlappedLinks[fromPoint.x].push([absFromY, absToY, 1]);
      } else {
        let startGap = -1;
        let endGap = -1;

        const correctedFromY = absFromY + 1;
        const correctedToY = absToY - 1;

        // check if current link is inside some gap
        overlappedLinks[fromPoint.x].forEach(([start, end], i) => {
          if (start <= correctedFromY && correctedFromY <= end) {
            startGap = i;
          }

          if (start <= correctedToY && correctedToY <= end) {
            endGap = i;
          }
        });

        if (startGap === -1 && endGap === -1) {
          overlappedLinks[fromPoint.x].push([absFromY, absToY, 1]);
        }

        if (startGap !== -1 && endGap === -1) {
          offset = extendGap(fromPoint.x, startGap, absFromY, absToY);
        }

        if (startGap === -1 && endGap !== -1) {
          offset = extendGap(fromPoint.x, endGap, absFromY, absToY);
        }

        if (startGap !== -1 && endGap !== -1) {
          const [newGapStart] = overlappedLinks[fromPoint.x][startGap];
          const [, newGapEnd] = overlappedLinks[fromPoint.x][endGap];

          let maxCount = 0;
          const newOverlappedLink = [];
          overlappedLinks[fromPoint.x].forEach(([start, end, count]) => {
            if (start >= newGapStart && end <= newGapEnd) {
              maxCount = Math.max(maxCount, count);
              return;
            }

            newOverlappedLink.push([start, end, count]);
          });
          offset = maxCount + 1;
          newOverlappedLink.push([newGapStart, newGapEnd, offset]);

          overlappedLinks[fromPoint.x] = newOverlappedLink;
        }
      }
    }

    if (offset) {
      const lines = buildCLinksBetweenSequences(absFromX, absFromY, absToX, absToY, offset);
      result.push(...lines);
    } else {
      const line = buildLine(fromPoint.x, fromPoint.y, toPoint.x, toPoint.y);
      result.push(line);
    }
  });

  return result;
}

function buildCLinksInsideSequence(shape, linear) {
  const angleCorrection = config.cLinkAngleCorrectionInternal;
  const { links, points } = shape;
  const lines = [];

  links.forEach((range) => {
    range.forEach((link, i) => {
      const from = points[link[0]];
      const to = points[link[1]];

      if (linear || !link[2]) {
        const topY = config.internalConnectionPadding * i;

        lines.push(
          buildLine(
            from.x,
            from.y,
            from.x + angleCorrection,
            from.y - config.internalConnectionHeight - topY,
          ),
        );
        lines.push(
          buildLine(
            from.x + angleCorrection,
            from.y - config.internalConnectionHeight - topY,
            to.x - angleCorrection,
            to.y - config.internalConnectionHeight - topY,
          ),
        );
        lines.push(buildLine(
          to.x - angleCorrection,
          to.y - config.internalConnectionHeight - topY,
          to.x,
          to.y,
        ));
      } else {
        lines.push(
          buildLine(
            from.x,
            from.y,
            to.x,
            to.y,
          ),
        );
      }
    });
  });

  return lines;
}

function buildConnections(shape, linear) {
  const { points, isCyclic } = shape;
  const lines = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const fromPoint = points[i];
    const toPoint = points[i + 1];

    lines.push(buildLine(fromPoint.x, fromPoint.y, toPoint.x, toPoint.y));
  }

  if (isCyclic) {
    const lastFromPoint = points[points.length - 1];
    const lastToPoint = points[0];
    lines.push(buildLine(lastFromPoint.x, lastFromPoint.y, lastToPoint.x, lastToPoint.y));
  }

  return [
    ...lines,
    ...buildCLinksInsideSequence(shape, linear),
  ];
}

function itemRepresentation(
  x,
  y,
  diameterX,
  diameterY,
  shape,
  monomerColors,
  textLabel,
  seqInfo,
) {
  const normalizedShape = Math.max(shape, 1);
  const radiusX = diameterX / 2;
  const radiusY = diameterY / 2;
  const points = basicShape(
    30,
    normalizedShape,
    radiusX + config.monomerEdgeWidth,
    radiusY + config.monomerEdgeWidth,
    diameterX,
    diameterY,
  )
    .map((p) => (p.join(','))).join(' ');

  const group = document.createElement('g');
  group.setAttribute('transform', `matrix(1,0,0,1,${x - radiusX},${y - radiusY})`);

  // white background for colors with low opacity
  const overlay = document.createElement('polygon');
  overlay.setAttribute('points', points);
  overlay.setAttribute('fill', 'fff');
  overlay.setAttribute('stroke-width', config.monomerEdgeWidth);
  overlay.setAttribute('stroke', 'fff');

  const polygon = document.createElement('polygon');
  polygon.setAttribute('points', points);
  polygon.setAttribute('fill', monomerColors.background);
  polygon.setAttribute('stroke', monomerColors.border);
  polygon.setAttribute('stroke-width', config.monomerEdgeWidth);
  polygon.setAttribute('class', 'monomerSelector');
  polygon.setAttribute('data-symbol', textLabel);
  polygon.setAttribute('data-sub-seq-index', seqInfo.subSeqIndex);
  polygon.setAttribute('data-seq-index', seqInfo.seqIndex);
  polygon.setAttribute('data-monomer-index', seqInfo.monomerIndex);

  // aminoacid abbrev., size and placement of the letters
  let coefficient = 1;
  if (textLabel.length > 1) {
    coefficient = parseInt(textLabel.length / 2, 10);
  }
  let fSize = diameterY / 2 / coefficient;
  let currentLetter = textLabel;
  // This should also correspond to size of the rectangle
  if (fSize < 8) {
    fSize = 8;
    currentLetter = `${textLabel.substring(0, 4)}.`;
  }

  const text = document.createElement('text');
  text.setAttribute('style', 'pointer-events: none;');
  text.setAttribute('dominant-baseline', 'central');
  text.setAttribute('x', radiusX + config.monomerEdgeWidth);
  text.setAttribute('y', radiusY + config.monomerEdgeWidth);
  text.setAttribute('font-family', 'arial');
  text.setAttribute('font-size', fSize);
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill', monomerColors.color);

  const tspan = document.createElement('tspan');
  tspan.innerHTML = currentLetter;
  text.appendChild(tspan);

  group.appendChild(overlay);
  group.appendChild(polygon);
  group.appendChild(text);

  return group;
}

function buildNodes(points, originalSequence) {
  const result = [];

  points.forEach((
    {
      x,
      y,
      shape,
      symbol,
      seqInfo,
    },
    i,
  ) => {
    const monomerColors = getColorsByMonomer(symbol, i, originalSequence);
    const diameter = config.monomerSize
      - Math.floor(config.monomerEdgeWidth + config.monomerSize / 4);
    const radius = diameter / 2;

    const item = itemRepresentation(
      x,
      y,
      diameter,
      diameter,
      shape,
      monomerColors,
      symbol,
      seqInfo,
    );

    // numbering the sequence
    const numSize = Math.max(diameter / 4 - 1, 9);
    const tspan = document.createElement('tspan');
    tspan.innerHTML = i + 1;

    const text = document.createElement('text');
    text.appendChild(tspan);
    text.setAttribute('x', x - radius);
    text.setAttribute('y', y - radius);
    text.setAttribute('font-family', 'arial');
    text.setAttribute('font-size', numSize);
    text.setAttribute('fill', config.colorSchema.indexNumberColor);

    result.push(item);
    result.push(text);
  });

  return result;
}

module.exports = {
  buildConnectionsBetweenSequences,
  buildConnections,
  buildNodes,
};
