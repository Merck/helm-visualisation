const { config } = require('../config');

/**
 * Parse HELM string to determine monomers and links between monomers
 *
 * @param {String} HELMString a HELM string
 * @returns {Object} an object with structure like
 * {
 *    sequences: [
 *      {
 *        monomers: ["A", "C"],
 *        links: [0, 1],
 *        shape: 5
 *      },
 *      {
 *        monomers: ["A", "C"],
 *        links: [],
 *        shape: 5,
 *      },
 *    ],
 *    connectionsBetweenSequences: [
 *      seqFrom: {
 *        seqIndex: 0,
 *        monomerIndex: 1,
 *      },
 *      seqTo: {
 *        seqIndex: 1,
 *        monomerIndex: 0,
 *      },
 *    ],
 * }
 */
module.exports = function parse(HELMString) {
  // parse HELM sequence
  const monomerSubstrings = Array.from(HELMString.matchAll(/[0-9]{(.+?)}/g), (v) => v[1]);
  const polymerTypes = HELMString.match(/[A-Z1-9]+(?={)/g);

  const connectionsMatch = HELMString.match(/(?<=\$)(.+?)?(?=\$)/);
  let allConnections = [];
  if (connectionsMatch) {
    allConnections = connectionsMatch[0].split('|');
  }

  if (!monomerSubstrings) {
    throw new Error('Wrong HELM string format, please check the input string');
  }

  const sequences = [];
  const connectionsBetweenSequences = [];

  monomerSubstrings.forEach((subStr, i) => {
    const sequence = {};
    const peptideSequence = subStr.split('.').map((monomer) => {
      if (monomer.startsWith('[')) {
        return monomer.substring(1, monomer.length - 1);
      }

      return monomer;
    });
    sequence.monomers = peptideSequence;

    // shapes defined by polymer type
    sequence.shape = config.polymerShapes[polymerTypes[i].replace(/\d/g, '')] || config.polymerShapes.PEPTIDE;

    const links = [];
    // let cyclic = false;

    if (allConnections) {
      const prefix = polymerTypes[i];

      allConnections.forEach((connection) => {
        if (connection.includes(prefix)) {
          const items = connection.replace(/\s/g, '').split(',');
          // checking for links in one chain
          if (items[0] === items[1] || items.length < 3) {
            let link = items[items.length - 1]
              .match(/[0-9]+(?=:)/g)
              .map((l) => parseInt(l, 10));

            if (link[0] > link[1]) {
              link = [link[1] - 1, link[0] - 1];
            } else {
              link = [link[0] - 1, link[1] - 1];
            }
            links.push(link);
          } else if (items[0] !== prefix) {
            const link = items[items.length - 1]
              .match(/[0-9]+(?=:)/g)
              .map((l) => parseInt(l, 10));
            const connectedChainStart = polymerTypes.indexOf(items[0]);
            const connectedChainEnd = polymerTypes.indexOf(items[1]);
            if (connectedChainStart !== -1 && connectedChainEnd !== -1) {
              const data = {
                seqFrom: {
                  seqIndex: connectedChainStart,
                  monomerIndex: link[0] - 1,
                },
                seqTo: {
                  seqIndex: connectedChainEnd,
                  monomerIndex: link[1] - 1,
                },
              };
              connectionsBetweenSequences.push(data);
            }
          }
        }
      });
    }

    sequence.links = links;
    sequences.push(sequence);
  });

  return {
    sequences,
    connectionsBetweenSequences,
  };
};
