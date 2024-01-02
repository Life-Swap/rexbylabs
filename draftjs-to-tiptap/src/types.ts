export interface DraftjsInlineRange {
  offset: number;
  length: number;
  style: string;
}

export interface DraftjsEntityRange {
  offset: number;
  length: number;
  key: number;
}

export interface DraftjsBlock {
  type: string;
  text: string;
  inlineStyleRanges?: DraftjsInlineRange[];
  entityRanges?: DraftjsEntityRange[];
}

export interface DraftjsLinkEntity {
  type: "LINK";
  data: {
    url: string;
  };
}

export interface DraftjsMentionEntity {
  type: "mention";
  data: Record<string, any>;
}

export type DraftjsEntityType = DraftjsLinkEntity | DraftjsMentionEntity;

export interface BlockIterator {
  peek: () => DraftjsBlock | null;
  next: () => DraftjsBlock;
}

export interface Config {
  getMentionAttrs?: (entity: DraftjsMentionEntity) => {
    id: string;
    label: string;
  };
  unknownBlockTypeHandler?: (
    block: DraftjsBlock,
    iterator: BlockIterator,
    entityMap: DraftjsEntityType[]
  ) => {
    type: string;
    content: unknown[];
  };
  unknownMarkTypeHandler?: (mark: unknown) => { type: string };
}

export interface Context {
  config: Config;
  iterator: BlockIterator;
  entityMap: DraftjsEntityType[];
}
