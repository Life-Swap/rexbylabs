export const isDefined = <T>(x: T): x is NonNullable<T> => x != null;

export const uniq = <T>(xs: T[]): T[] =>
  xs.filter((x, i) => xs.indexOf(x) === i);

export const isPlainObject = (obj: unknown): boolean =>
  obj?.constructor === Object &&
  Object.getPrototypeOf(obj) === Object.prototype;

export const overlaps = (x1: number, x2: number, y1: number, y2: number) =>
  Math.max(x1, y1) < Math.min(x2, y2);

// Couple of unicode aware string functions. Four byte unicode chars behave
// oddly in javascript, and it's important that we slice and dice strings
// identically to draftjs to not cause off by one errors. e.g.
// '🧳'.length is 2, but [...'🧳'] is ['🧳']
// '✈️'.length is 2, but [...'✈️'] is [ '✈', '️' ]
export const ulength = (s: string): number => [...s].length;
export const uslice = (s: string, start: number, end?: number): string =>
  [...s].slice(start, end).join("");
