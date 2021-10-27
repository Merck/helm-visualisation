const { config } = require('../config');

function calculatePositionsInCircle(
  monomers,
  start,
  end,
  shape,
  seqIndex,
  originalIndex,
  monomerPositionsInsideCircles,
) {
  const seqLength = Math.abs(end - start) + 1;
  const diameter = (seqLength * config.defaultConnectionLineLength) / Math.PI + config.monomerSize;
  const radius = diameter / 2;
  const sectorAngle = (2 * Math.PI) / seqLength;
  const firstLastDistance = Math.sin(sectorAngle / 2) * radius * 2;
  const points = [];

  // put first monomer of circle
  points.push({
    shape,
    x: radius - firstLastDistance / 2,
    y: 0,
    symbol: monomers[start],
    seqInfo: {
      seqIndex,
      subSeqIndex: originalIndex,
      monomerIndex: start,
    },
  });
  monomerPositionsInsideCircles.add(start);

  let maxX = radius + firstLastDistance / 2;
  let currentAngle = Math.PI * 3 + sectorAngle * 1.5;
  for (let i = start + 1; i < end; i += 1) {
    const x = radius * Math.sin(currentAngle) + radius;
    const y = radius * Math.cos(currentAngle) + radius;
    currentAngle += sectorAngle;

    maxX = Math.max(maxX, x);

    points.push({
      shape,
      x,
      y,
      symbol: monomers[i],
      seqInfo: {
        seqIndex,
        subSeqIndex: originalIndex,
        monomerIndex: i,
      },
    });

    monomerPositionsInsideCircles.add(i);
  }

  // put last monomer of circle
  points.push({
    shape,
    x: radius + firstLastDistance / 2,
    y: 0,
    symbol: monomers[end],
    seqInfo: {
      seqIndex,
      subSeqIndex: originalIndex,
      monomerIndex: end,
    },
  });
  monomerPositionsInsideCircles.add(end);

  const width = maxX + config.monomerSize / 2;
  const height = width;

  return {
    points,
    width,
    height,
  };
}

function prepareCLinks(links, parsedCLinks) {
  let maxCLinksOverlapped = 0;
  let ranges = [];

  links.forEach((link) => {
    let isIncluded = false;

    ranges = ranges.map((item, i) => {
      const [range, quantity] = item;
      const [start, end] = range;

      const isLinkStartInsideRange = link[0] >= start && link[0] <= end;
      const isLinkEndInsideRange = link[1] >= start && link[1] <= end;
      const isRangeStartInsideLink = start >= link[0] && start <= link[1];
      const isRangeEndInsideLink = end >= link[0] && end <= link[1];

      if (
        isLinkStartInsideRange || isLinkEndInsideRange
        || isRangeStartInsideLink || isRangeEndInsideLink
      ) {
        isIncluded = true;
        maxCLinksOverlapped = Math.max(maxCLinksOverlapped, quantity + 1);
        parsedCLinks[i].push(link);
        return [
          [
            Math.min(link[0], start),
            Math.max(link[1], end),
          ],
          quantity + 1,
        ];
      }

      return [[start, end], quantity];
    });

    if (!isIncluded) {
      ranges.push([link, 1]);
      parsedCLinks.push([link]);
      maxCLinksOverlapped = Math.max(maxCLinksOverlapped, 1);
    }
  });

  return maxCLinksOverlapped;
}

function calculateShapes(sequences, seqIndex, linear) {
  const results = [];

  sequences.forEach(({ monomers, shape, links }, originalIndex) => {
    const points = [];
    let width = 0;
    let height = 0;
    const parsedCLinks = [];

    if (linear) {
      const maxCLinksOverlapped = prepareCLinks(links, parsedCLinks);

      width = monomers.length * config.defaultConnectionLineLength
        + config.monomerSize - config.defaultConnectionLineLength;
      const cLinksOffset = maxCLinksOverlapped * config.internalConnectionPadding;
      height = config.monomerSize + config.monomerEdgeWidth * 2 + cLinksOffset;

      if (maxCLinksOverlapped) {
        height += config.internalConnectionHeight;
      }

      monomers.forEach((monomer, i) => {
        points.push({
          shape,
          x: points.length === 0
            ? config.monomerSize / 2
            : points[i - 1].x + config.defaultConnectionLineLength,
          y: config.monomerSize / 2 + maxCLinksOverlapped + config.monomerEdgeWidth,
          symbol: monomer,
          seqInfo: {
            seqIndex,
            subSeqIndex: originalIndex,
            monomerIndex: i,
          },
        });
      });
    } else {
      const circles = {};
      const monomerPositionsInsideCircles = new Set();
      const circleLinks = new Set();

      links.forEach((link) => {
        if (!circleLinks.size) {
          circleLinks.add(link);
          return;
        }

        const linkStart = Math.min(link[0], link[1]);
        const linkEnd = Math.max(link[0], link[1]);

        circleLinks.forEach((potentialCircle) => {
          const circleStart = Math.min(potentialCircle[0], potentialCircle[1]);
          const circleEnd = Math.max(potentialCircle[0], potentialCircle[1]);

          const isLinkStartNotInCircle = linkStart < circleStart || linkStart > circleEnd;
          const isLinkEndNotInCircle = linkEnd < circleStart || linkEnd > circleEnd;
          const isCircleStartNotInLink = circleStart < linkStart || circleStart > linkEnd;
          const isCircleEndNotInLink = circleEnd < linkStart || circleEnd > linkEnd;
          const isLinkSmallerThanCircle = linkEnd - linkStart < circleEnd - circleStart;
          if (
            isLinkStartNotInCircle && isLinkEndNotInCircle
            && isCircleStartNotInLink && isCircleEndNotInLink
          ) {
            circleLinks.add(potentialCircle);
          } else if (isLinkSmallerThanCircle) {
            circleLinks.delete(potentialCircle);
            circleLinks.add(link);
          }
        });
      });

      circleLinks.forEach((link) => {
        const start = Math.min(link[0], link[1]);
        const end = Math.max(link[0], link[1]);
        parsedCLinks.push([[start, end, true]]);
        const circle = calculatePositionsInCircle(
          monomers,
          start,
          end,
          shape,
          seqIndex,
          originalIndex,
          monomerPositionsInsideCircles,
        );

        circles[start] = circle;
      });

      // parse C links
      const cLinks = [];
      links.forEach((link) => {
        if (circleLinks.has(link)) {
          return;
        }

        const linkStart = Math.min(link[0], link[1]);
        const linkEnd = Math.max(link[0], link[1]);

        circleLinks.forEach((circleLink) => {
          const circleStart = Math.min(circleLink[0], circleLink[1]);
          const circleEnd = Math.max(circleLink[0], circleLink[1]);
          const isLinkStartNotInCircle = linkStart <= circleStart || linkStart >= circleEnd;
          const isLinkEndNotInCircle = linkEnd <= circleStart || linkEnd >= circleEnd;
          if (isLinkStartNotInCircle && isLinkEndNotInCircle) {
            cLinks.push(link);
          } else {
            // true means that we will draw it as a regular link and not as a C link
            parsedCLinks.push([[...link, true]]);
          }
        });
      });

      let additionalHeight = 0;
      const maxCLinksOverlapped = prepareCLinks(cLinks, parsedCLinks);
      if (maxCLinksOverlapped) {
        additionalHeight = maxCLinksOverlapped * config.internalConnectionPadding;
      }

      let currentX = config.monomerSize / 2;
      monomers.forEach((monomer, i) => {
        const y = points.length === 0
          ? config.monomerSize / 2 + config.monomerEdgeWidth + additionalHeight
          : points[i - 1].y;

        const circle = circles[i];
        if (circle) {
          const difY = y - circle.points[0].y;
          points.push(...circle.points.map((p) => ({
            ...p,
            x: p.x + currentX,
            y: p.y + difY,
          })));
          currentX += circle.width + config.defaultConnectionLineLength;
          return;
        }

        if (monomerPositionsInsideCircles.has(i)) {
          return;
        }

        points.push({
          shape,
          x: currentX,
          y,
          symbol: monomer,
          seqInfo: {
            seqIndex,
            subSeqIndex: originalIndex,
            monomerIndex: i,
          },
        });

        currentX += config.defaultConnectionLineLength;
      });

      points.forEach(({ x, y }) => {
        width = Math.max(x, width);
        height = Math.max(y, height);
      });

      width += config.monomerSize;
      height += config.monomerSize + additionalHeight;
    }

    results.push({
      points,
      width,
      height,
      originalIndex,
      links: parsedCLinks,
    });
  });

  return results;
}

function correctPlacementOfShapes(shapes, linkBetweenChains) {
  let Yoffset = 0;
  const newOrder = shapes.reduce(
    (acc, v, index) => ({
      ...acc,
      [index]: index,
    }),
    {},
  );

  let result = shapes.slice();
  const halfOfItem = config.monomerSize / 2 + config.monomerEdgeWidth;

  const connectionsMap = linkBetweenChains.reduce(
    (acc, link) => {
      const { seqFrom, seqTo } = link;

      if (acc[seqFrom.seqIndex]) {
        acc[seqFrom.seqIndex].push(seqTo.seqIndex);
      } else {
        acc[seqFrom.seqIndex] = [seqTo.seqIndex];
      }

      if (acc[seqTo.seqIndex]) {
        acc[seqTo.seqIndex].push(seqFrom.seqIndex);
      } else {
        acc[seqTo.seqIndex] = [seqFrom.seqIndex];
      }

      return acc;
    },
    {},
  );

  // shuffle chains by links
  linkBetweenChains.forEach((link) => {
    const { seqFrom, seqTo } = link;
    const fromIndex = newOrder[seqFrom.seqIndex];
    const toIndex = newOrder[seqTo.seqIndex];
    const newToIndex = fromIndex + 1;

    // check if distance between sequences more than 1 and that is not a last index
    if (Math.abs(fromIndex - toIndex) > 1 && newToIndex < shapes.length) {
      if (seqTo.seqIndex === toIndex) {
        if (connectionsMap[seqFrom.seqIndex].includes(seqFrom.seqIndex + 1)) {
          result = [
            ...result.slice(0, fromIndex),
            result[toIndex],
            ...result.slice(fromIndex, toIndex),
            ...result.slice(toIndex + 1),
          ];

          for (let i = 0; i < shapes.length; i += 1) {
            if (newOrder[i] === toIndex) {
              newOrder[i] = fromIndex;
            } else if (
              (newOrder[i] > fromIndex && newOrder[i] < toIndex + 1)
              || newOrder[i] === fromIndex
            ) {
              newOrder[i] = Math.min(newOrder[i] + 1, shapes.length - 1);
            }
          }
        } else {
          const swap = result[newOrder[newToIndex]];
          result[newOrder[newToIndex]] = result[toIndex];
          result[toIndex] = swap;

          newOrder[seqTo.seqIndex] = newOrder[newToIndex];
          newOrder[newToIndex] = toIndex;
        }
      } else {
        result = [
          ...result.slice(0, fromIndex),
          result[toIndex],
          ...result.slice(fromIndex, toIndex),
          ...result.slice(toIndex + 1),
        ];

        for (let i = 0; i < shapes.length; i += 1) {
          if (newOrder[i] === toIndex) {
            newOrder[i] = fromIndex;
          } else if (
            (newOrder[i] > fromIndex && newOrder[i] < toIndex + 1)
            || newOrder[i] === fromIndex
          ) {
            newOrder[i] = Math.min(newOrder[i] + 1, shapes.length - 1);
          }
        }
      }
    }
  });

  // normalize links
  const correctedLinks = linkBetweenChains.map((link) => {
    const { seqTo, seqFrom } = link;
    return {
      seqFrom: {
        ...seqFrom,
        seqIndex: newOrder[seqFrom.seqIndex],
      },
      seqTo: {
        ...seqTo,
        seqIndex: newOrder[seqTo.seqIndex],
      },
    };
  });

  let minX = 0;
  // build structure with offsets
  result.forEach((shape, index) => {
    const { points, links, height } = shape;
    let maxX = 0;
    const maxLinksCount = links.reduce(
      (acc, value) => (Math.max(acc, value.length)),
      0,
    );

    let linksOffset = 0;
    if (maxLinksCount) {
      linksOffset = (config.monomerSize / 2 + maxLinksCount * config.internalConnectionPadding)
        - config.internalConnectionPadding;
    }

    let Xoffset = 0;
    correctedLinks.forEach((link) => {
      const { seqFrom, seqTo } = link;
      const fromIndex = seqFrom.seqIndex;
      const toIndex = seqTo.seqIndex;

      if (fromIndex === index && toIndex < index) {
        Xoffset = result[toIndex].points[seqTo.monomerIndex].x
          - shape.points[seqFrom.monomerIndex].x;
      }

      if (toIndex === index && fromIndex < index) {
        Xoffset = result[fromIndex].points[seqFrom.monomerIndex].x
          - shape.points[seqTo.monomerIndex].x;
      }
    });

    // eslint-disable-next-line no-param-reassign
    shape.points = points.map((point) => {
      const newX = point.x + Xoffset;
      minX = Math.min(minX, newX);
      maxX = Math.max(maxX, newX);
      return {
        ...point,
        y: point.y + Yoffset + linksOffset,
        x: newX,
      };
    });
    // eslint-disable-next-line no-param-reassign
    shape.width = maxX + halfOfItem;

    Yoffset += height + config.marginBetweenSubSequences;
  });

  // normalize X coords if we have a negative positions
  if (minX < 0) {
    const correction = Math.abs(minX) + halfOfItem;
    result.forEach((shape) => {
      let maxX = 0;
      // eslint-disable-next-line no-param-reassign
      shape.points = shape.points.map((point) => {
        maxX = Math.max(point.x + correction, maxX);
        return {
          ...point,
          x: point.x + correction,
        };
      });

      // eslint-disable-next-line no-param-reassign
      shape.width = maxX + halfOfItem;
    });
  }

  return {
    correctedLinks,
    correctedShapes: result,
  };
}

module.exports = {
  calculateShapes,
  correctPlacementOfShapes,
};
