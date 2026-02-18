import { type Change, diffChars, diffLines, diffWords } from "diff";

export type DiffMode = "chars" | "words" | "lines";

export type DiffOptions = {
  mode: DiffMode;
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
};

export type DiffSummary = {
  addedSegments: number;
  removedSegments: number;
  unchangedSegments: number;
  addedChars: number;
  removedChars: number;
};

export type DiffResult = {
  parts: Change[];
  summary: DiffSummary;
};

export function createDiff(leftText: string, rightText: string, options: DiffOptions): DiffResult {
  const parts = runDiff(leftText, rightText, options);

  const summary = parts.reduce<DiffSummary>(
    (acc, part) => {
      const charCount = part.value.length;
      if (part.added) {
        acc.addedSegments += 1;
        acc.addedChars += charCount;
        return acc;
      }
      if (part.removed) {
        acc.removedSegments += 1;
        acc.removedChars += charCount;
        return acc;
      }
      acc.unchangedSegments += 1;
      return acc;
    },
    {
      addedSegments: 0,
      removedSegments: 0,
      unchangedSegments: 0,
      addedChars: 0,
      removedChars: 0,
    },
  );

  return { parts, summary };
}

function runDiff(leftText: string, rightText: string, options: DiffOptions): Change[] {
  if (options.mode === "chars") {
    return diffChars(leftText, rightText, {
      ignoreCase: options.ignoreCase,
    });
  }

  if (options.mode === "words") {
    return diffWords(leftText, rightText, {
      ignoreCase: options.ignoreCase,
    });
  }

  return diffLines(leftText, rightText, {
    ignoreCase: options.ignoreCase,
    ignoreWhitespace: options.ignoreWhitespace,
    newlineIsToken: true,
  });
}
