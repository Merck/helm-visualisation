export declare type SequenceData = {
  monomers: string[],
  links: number[],
  shape: number,
};

export declare type ConnectionsData = {
  seqFrom: {
    seqIndex: number;
    monomerIndex: number;
  };
  seqTo: {
    seqIndex: number;
    monomerIndex: number;
  };
};

export declare type ParsedHELM = {
  sequences: SequenceData[];
  connectionsBetweenSequences: ConnectionsData[];
};

export function parse(HELMString: string): ParsedHELM;

export function generateSVG(
  parsedHELM: ParsedHELM,
  originalSequence?: SequenceData[],
  seqIndex?: number,
  linear?: boolean,
): HTMLElement & SVGElement;

export declare type Color = {
  background: string;
  color: string;
  border: string;
}

export declare type ColorSchema = {
  default: Color;
  indexNumberColor: string;
  linkColor: string;
  comparison: {
    equal: Partial<Color>;
    notEqual: Partial<Color>;
  };
  monomers: {
    [key: string]: Partial<Color>;
  };
}

export declare type Config = {
  colorSchema: ColorSchema;
  polymerShapes: {
    [key: string]: number;
  };
  connectionLineWidth: number;
  defaultConnectionLineLength: number;
  internalConnectionPadding: number;
  internalConnectionHeight: number;
  marginBetweenSubSequences: number;
  monomerEdgeWidth: number;
  monomerSize: number;
  cLinkAngleCorrectionInternal: number;
  cLinkAngleCorrectionExternal: number;
}

export declare type NewConfig = Partial<Config>

export function setConfig(newConfig: NewConfig): Config;
export function resetConfig(): Config;

export const config: Config;
