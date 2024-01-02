import type {
  Context,
  BlockIterator,
  Config,
  DraftjsBlock,
  DraftjsEntityRange,
} from "./types";
import {
  uniq,
  uslice,
  ulength,
  overlaps,
  isDefined,
  isPlainObject,
} from "./utils";

export * from "./types";

const createIterator = (blocks: DraftjsBlock[]): BlockIterator => {
  let i = 0;

  return {
    peek: (offset = 0) => {
      return blocks[i + offset] ?? null;
    },
    next: () => {
      return blocks[i++];
    },
  };
};

export const draftjsToTiptap = (
  draftjsDocument: Record<string, any>,
  config: Config = {}
): { type: "doc"; content: unknown[] } => {
  if (!Array.isArray(draftjsDocument.blocks)) {
    throw new TypeError(
      `invalid draftjs document: expected document blocks to be an array`
    );
  }

  if (!isPlainObject(draftjsDocument.entityMap)) {
    throw new TypeError(
      `invalid draftjs document: expected document entityMap to be an object`
    );
  }

  const { blocks, entityMap } = draftjsDocument;

  const ctx: Context = {
    iterator: createIterator(blocks),
    entityMap,
    config,
  };

  const content: unknown[] = [];
  for (let block = ctx.iterator.next(); block; block = ctx.iterator.next()) {
    const node = draftJsBlockToTiptap(block, ctx);
    if (node) {
      content.push(node);
    }
  }

  return {
    type: "doc",
    content,
  };
};

export const draftJsBlockToTiptap = (block: DraftjsBlock, ctx: Context) => {
  switch (block.type) {
    case "header-one":
      return draftJsHeadingToTiptap(block, 1, ctx);
    case "header-two":
      return draftJsHeadingToTiptap(block, 2, ctx);
    case "header-three":
      return draftJsHeadingToTiptap(block, 3, ctx);
    case "header-four":
      return draftJsHeadingToTiptap(block, 4, ctx);
    case "header-five":
      return draftJsHeadingToTiptap(block, 5, ctx);
    case "header-six":
      return draftJsHeadingToTiptap(block, 6, ctx);
    case "paragraph":
    case "unstyled":
      return draftjsTextToTiptapNode("paragraph", block, ctx);
    case "unordered-list-item":
      return draftJsListToTiptap(
        block,
        ctx,
        "bulletList",
        "unordered-list-item"
      );
    case "ordered-list-item":
      return draftJsListToTiptap(
        block,
        ctx,
        "orderedList",
        "ordered-list-item"
      );
    case "blockquote":
      return draftjsTextToTiptapNode("blockquote", block, ctx);
    case "code-block":
      return {
        ...draftjsTextToTiptapNode("codeBlock", block, ctx),
        attrs: {
          language: null,
        },
      };
  }

  if (ctx.config.unknownBlockTypeHandler) {
    return ctx.config.unknownBlockTypeHandler(
      block,
      ctx.iterator,
      ctx.entityMap
    );
  }

  console.warn(`unknown draftjs block type: ${block.type}`);
  return null;
};

export const draftjsTextToTiptapNode = (
  type: string,
  block: DraftjsBlock,
  ctx: Context
) => ({
  type,
  content: draftjsTextToTiptapContent(block, ctx),
});

export const draftjsTextToTiptapContent = (
  block: DraftjsBlock,
  ctx: Context
) => {
  return draftjsTextToTiptap(block, ctx).map((node) => {
    const mention = node.marks?.filter(
      (mark): mark is ReturnType<typeof draftjsEntityToTiptapMark> =>
        mark.type === "mention"
    )[0];

    // draftjs stores mentions as marks, but tiptap as nodes
    return mention?.type === "mention" ? mention : node;
  });
};

export const draftJsListToTiptap = (
  block: DraftjsBlock,
  ctx: Context,
  toType: string,
  fromType: string
) => {
  const blocks = [block];
  while (ctx.iterator.peek()?.type === fromType) {
    blocks.push(ctx.iterator.next());
  }

  return {
    type: toType,
    content: blocks.map((child) => {
      return {
        type: "listItem",
        content: [draftjsTextToTiptapNode("paragraph", child, ctx)],
      };
    }),
  };
};

export const draftJsHeadingToTiptap = (
  block: DraftjsBlock,
  level: number,
  ctx: Context
) => ({
  type: "heading",
  attrs: { level },
  content: draftjsTextToTiptap(block, ctx),
});

export const draftjsTextToTiptap = (block: DraftjsBlock, ctx: Context) => {
  const { inlineStyleRanges = [], entityRanges = [] } = block;

  const splits = uniq(
    [
      0,
      ulength(block.text),
      ...[...inlineStyleRanges, ...entityRanges].flatMap((x) => [
        x.offset,
        x.offset + x.length,
      ]),
    ].sort((a, b) => a - b)
  );

  return Array.from(splits.slice(1).entries()).map(([i, end]) => {
    const start = splits[i];
    const text = uslice(block.text, start, end);

    const marks = [
      // Links and mentions. Note that tiptap doesn't store mentions as marks,
      // it will get converted to a tiptap node in draftjsTextToTiptapContent
      ...entityRanges
        .filter((x) => overlaps(start, end, x.offset, x.offset + x.length))
        .map((x) => draftjsEntityToTiptapMark(x, ctx)),

      // bold, italic etc.
      ...inlineStyleRanges
        .filter((x) => overlaps(start, end, x.offset, x.offset + x.length))
        .map((x) => ({ type: x.style.toLowerCase() })),
    ].filter(isDefined);

    return {
      type: "text",
      text,
      ...(marks.length > 0 && { marks }),
    };
  });
};

export const draftjsEntityToTiptapMark = (
  range: DraftjsEntityRange,
  ctx: Context
) => {
  const entityType = ctx.entityMap[range.key];

  switch (entityType.type) {
    case "LINK":
      return {
        type: "link",
        attrs: {
          href: entityType.data.url,
          target: "_blank",
          rel: "noopener noreferrer nofollow",
        },
      } as const;

    case "mention":
      if (ctx.config.getMentionAttrs) {
        return {
          type: "mention",
          attrs: ctx.config.getMentionAttrs(entityType),
        } as const;
      }

      if (ctx.config.unknownMarkTypeHandler) {
        return ctx.config.unknownMarkTypeHandler(entityType);
      }

      throw new Error(
        `Don't know how to convert a mention entity. Supply a getMentionAttrs or unknownMarkTypeHandler config to draftjsToTiptap`
      );
  }
};
