export type TextStats = {
  chars: number;
  spaces: number;
  charsWithSpaces: number;
  lines: number;
  newlines: number;
  charsWithNewlines: number;
  words: number;
};

export function calculateTextStats(text: string): TextStats {
  const normalizedNewlines = text.replaceAll(/\r\n?/g, "\n");
  const newlineMatches = normalizedNewlines.match(/\n/g);
  const spaceMatches = normalizedNewlines.match(/[^\S\n]/g);
  const nonWhitespace = normalizedNewlines.replaceAll(/\s/g, "");
  const words =
    normalizedNewlines.trim().length === 0 ? 0 : normalizedNewlines.trim().split(/\s+/u).length;

  const chars = Array.from(nonWhitespace).length;
  const spaces = spaceMatches?.length ?? 0;
  const newlines = newlineMatches?.length ?? 0;
  const lines = countLines(normalizedNewlines);
  const charsWithSpaces = chars + spaces;

  return {
    chars,
    spaces,
    charsWithSpaces,
    lines,
    newlines,
    charsWithNewlines: charsWithSpaces + newlines,
    words,
  };
}

export function countLines(text: string): number {
  if (text.length === 0) {
    return 0;
  }
  const lines = text.split("\n");
  if (lines[lines.length - 1] === "") {
    return Math.max(lines.length - 1, 0);
  }
  return lines.length;
}
