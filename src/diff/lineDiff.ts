import { type Change, diffLines } from "diff";

export type LineDiffOptions = {
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
  newlineIsToken?: boolean;
};

export function createLineDiff(
  leftText: string,
  rightText: string,
  options: LineDiffOptions,
): Change[] {
  return diffLines(leftText, rightText, {
    ignoreCase: options.ignoreCase,
    ignoreWhitespace: options.ignoreWhitespace,
    newlineIsToken: options.newlineIsToken ?? true,
  });
}
