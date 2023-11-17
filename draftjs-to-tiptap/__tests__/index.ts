import { draftjsToTiptap } from "../src";

describe("draftjs to tiptap converter", () => {
  test("paragraphs", () => {
    expect(
      draftjsToTiptap({
        blocks: [
          {
            type: "paragraph",
            text: "abcdefghi",
            entityRanges: [],
            inlineStyleRanges: [
              { offset: 1, length: 4, style: "ITALIC" },
              { offset: 3, length: 4, style: "BOLD" },
            ],
          },
        ],
        entityMap: {},
      })
    ).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "a" },
            { type: "text", text: "bc", marks: [{ type: "italic" }] },
            {
              type: "text",
              text: "de",
              marks: [{ type: "italic" }, { type: "bold" }],
            },
            { type: "text", text: "fg", marks: [{ type: "bold" }] },
            { type: "text", text: "hi" },
          ],
        },
      ],
    });
  });

  [
    "header-one",
    "header-two",
    "header-three",
    "header-four",
    "header-five",
    "header-six",
  ].forEach((type, i) => {
    const level = i + 1;

    test(`heading ${level}`, () => {
      expect(
        draftjsToTiptap({
          blocks: [
            {
              type,
              text: "header text",
              entityRanges: [],
              inlineStyleRanges: [],
            },
          ],
          entityMap: {},
        })
      ).toEqual({
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level },
            content: [{ type: "text", text: "header text" }],
          },
        ],
      });
    });
  });

  test("links", () => {
    expect(
      draftjsToTiptap({
        blocks: [
          {
            text: "Link:  road.is",
            type: "unstyled",
            inlineStyleRanges: [],
            entityRanges: [{ offset: 7, length: 7, key: 0 }],
          },
        ],
        entityMap: {
          0: {
            type: "LINK",
            data: { url: "https://www.road.is/" },
          },
        },
      })
    ).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Link:  ",
            },
            {
              type: "text",
              text: "road.is",
              marks: [
                {
                  type: "link",
                  attrs: {
                    href: "https://www.road.is/",
                    target: "_blank",
                    rel: "noopener noreferrer nofollow",
                  },
                },
              ],
            },
          ],
        },
      ],
    });
  });

  test("unordered lists", () => {
    expect(
      draftjsToTiptap({
        blocks: [
          {
            type: "unordered-list-item",
            text: "item one",
            entityRanges: [],
            inlineStyleRanges: [],
          },
          {
            type: "unordered-list-item",
            text: "item two",
            entityRanges: [],
            inlineStyleRanges: [],
          },
        ],
        entityMap: {},
      })
    ).toEqual({
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "item one" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "item two" }],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  test("ordered lists", () => {
    expect(
      draftjsToTiptap({
        blocks: [
          {
            type: "ordered-list-item",
            text: "item one",
            entityRanges: [],
            inlineStyleRanges: [],
          },
          {
            type: "ordered-list-item",
            text: "item two",
            entityRanges: [],
            inlineStyleRanges: [],
          },
        ],
        entityMap: {},
      })
    ).toEqual({
      type: "doc",
      content: [
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "item one" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "item two" }],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  test("unicode emojis", () => {
    expect(
      draftjsToTiptap({
        blocks: [
          {
            type: "paragraph",
            text: "<🧳>",
            entityRanges: [],
            inlineStyleRanges: [
              { offset: 0, length: 1, style: "BOLD" },
              { offset: 2, length: 1, style: "BOLD" },
            ],
          },
          {
            type: "ordered-list-item",
            text: "<✈️>",
            entityRanges: [],
            inlineStyleRanges: [
              { offset: 0, length: 1, style: "BOLD" },
              { offset: 3, length: 1, style: "BOLD" },
            ],
          },
        ],
        entityMap: {},
      })
    ).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "<", marks: [{ type: "bold" }] },
            { type: "text", text: "🧳" },
            { type: "text", text: ">", marks: [{ type: "bold" }] },
          ],
        },
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: "<", marks: [{ type: "bold" }] },
                    { type: "text", text: "✈️" },
                    { type: "text", text: ">", marks: [{ type: "bold" }] },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });
});
