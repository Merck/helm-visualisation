# HELM Visualisation Library

This library was created for parsing and creating SVG representation of any HELM string

## Getting started

For using this library install it via npm

```bash
npm i helm-visualisation
```

## Documentation

There are two parts of representation: parse HELM string and generate SVG from received object.

### parse

`parse` function is used to parse a HELM string into a special object with data about monomers and connections between monomers and chains.

To use this function you need to import it from the package and call it with HELM string as an argument.

| argument   | required | default   | description           |
|------------|----------|-----------|-----------------------|
| HELMString | true     | undefined | String in HELM format |

```javascript
import { parse } from 'helm-visualisation';

const parsedObject = parse('PEPTIDE1{A}$$$');
```

Returned result format:

```javascript
{
    sequences: [
      {
        monomers: ["A", "C"],
        links: [0, 1],
        shape: 5
      },
      {
        monomers: ["A", "C"],
        links: [],
        shape: 5,
      },
    ],
    connectionsBetweenSequences: [
      seqFrom: {
        seqIndex: 0,
        monomerIndex: 1,
      },
      seqTo: {
        seqIndex: 1,
        monomerIndex: 0,
      },
    ],
}
```

### generateSVG

`generateSVG` function gets object from result of [parse](#parse) function and provides SVG object based on it. It also takes a few more arguments:

| argument         | required | default   | description |
|------------------|----------|-----------|-------------|
| data             | true     | undefined | An object that is result of [parse](#parse) function after handling a HELM string |
| originalSequence | false    | undefined | array with chains of parsed HELM string to compare monomers from data and highlight mismatches |
| seqIndex         | false    | undefined | index of a sequence to be put as metadata for rendered monomers (useful in case of many sequences) |
| linear           | false    | false     | if true - generates svg where each chain is just a line, otherwise - if there is some connection between monomers in one chain, builds it as a circle structure |

Usage:

```javascript
import { generateSVG } from 'helm-visualisation';

const svg = generateSVG(parsedHELMString, undefined, 1, true);
```

### config

`config` is an object with settings for visualisation. Access to this object is provided for read only purpose if you need to use some sizes or colors outside of lib.

Available settings

| name                           | value   | description |
|--------------------------------|---------|-------------|
| colorSchema                    | Object  | object with colors for rendering (see [colorSchema](#colorSchema)) |
| polymerShapes                  | Object  | |
| connectionLineWidth            | 2       | width of connection line |
| defaultConnectionLineLength    | 40      | length of connection line between monomers in same linear chain |
| internalConnectionPadding      | 10      | space between links in one linear chain |
| internalConnectionHeight       | 40      | size between monomers and lowest connection line |
| marginBetweenSubSequences      | 15      | space between chains |
| monomerEdgeWidth               | 2       | monomer item's edge size |
| monomerSize                    | 40      | size of monomer item |
| cLinkAngleCorrectionInternal   | 15      | size of incline for C links inside of sequence |
| cLinkAngleCorrectionExternal   | 40      | size of incline for C links between sequences |

```javascript
import { config } from 'helm-visualisation';

console.log(config.monomerSize); // 40
```

### colorSchema

You can provide your own color schema for rendering sequences. It should be the following shape

```typescript
{
  default: {
    background: string;
    color: string;
    border: string;
  };
  indexNumberColor: string;
  linkColor: string;
  comparison: {
    equal: {
      background?: string;
      color?: string;
      border?: string;
    };
    notEqual: {
      background?: string;
      color?: string;
      border?: string;
    };
  };
  monomers: {
    [key: string]: {
      background?: string;
      color?: string;
      border?: string;
    };
  };
}
```

Your custom color schema should contain full `default` object and fields `equal`, `notEqual` and `monomers` should be at least empty objects 

### setConfig

You can use your own config or part of your own rules with `setConfig` function. It takes only one parameter `newConfig` which is an object with some or all new values (see [config](#config)). Returns updated config object.

| name      | value  | description           |
|-----------|--------|-----------------------|
| newConfig | Object | see [config](#config) |

```javascript
import { setConfig } from 'helm-visualisation';

const newConfig = {
  monomerSize: 35,
};

const updatedConfig = setConfig(newConfig);
```

### resetConfig

`resetConfig` function just restores the default configuration from the library

```javascript
import { resetConfig } from 'helm-visualisation';

const defaultConfig = resetConfig();
```
