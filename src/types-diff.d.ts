declare module "diff" {
  export type Change = {
    value: string;
    added?: boolean;
    removed?: boolean;
    count?: number;
  };

  export type DiffOptions = {
    ignoreCase?: boolean;
    ignoreWhitespace?: boolean;
    newlineIsToken?: boolean;
  };

  export function diffChars(oldText: string, newText: string, options?: DiffOptions): Change[];
  export function diffWords(oldText: string, newText: string, options?: DiffOptions): Change[];
  export function diffLines(oldText: string, newText: string, options?: DiffOptions): Change[];
}
