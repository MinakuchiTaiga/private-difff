const MAX_TEXT_FILE_BYTES = 20 * 1024 * 1024;

export const ACCEPT_TEXT_FILE_TYPES = [
  ".txt",
  ".md",
  ".markdown",
  ".html",
  ".htm",
  ".css",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".json",
  ".jsonc",
  ".yaml",
  ".yml",
  ".xml",
  ".svg",
  ".csv",
  ".tsv",
  ".ini",
  ".conf",
  ".config",
  ".toml",
  ".env",
  ".log",
  ".sql",
  ".sh",
  ".bash",
  ".zsh",
  ".py",
  ".rb",
  ".go",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".rs",
  ".php",
  ".vue",
  ".svelte",
  ".astro",
  ".wsl",
].join(",");

const ALLOWED_TEXT_EXTENSIONS = new Set(
  ACCEPT_TEXT_FILE_TYPES.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0),
);

const ALLOWED_TEXT_MIME_TYPES = new Set([
  "application/json",
  "application/xml",
  "application/javascript",
  "application/x-javascript",
  "application/ecmascript",
  "application/sql",
  "application/yaml",
  "application/x-yaml",
  "application/toml",
  "application/x-sh",
]);

export async function readTextFile(file: File | undefined): Promise<string> {
  if (!file) {
    return "";
  }
  if (file.size > MAX_TEXT_FILE_BYTES) {
    throw new Error(
      `ファイルサイズが上限を超えています。${Math.floor(MAX_TEXT_FILE_BYTES / (1024 * 1024))}MB以下にしてください。`,
    );
  }
  if (!isAllowedTextFile(file)) {
    throw new Error("対応しているテキストファイルを選択してください。");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (isLikelyBinaryData(bytes)) {
    throw new Error(
      "テキストファイルとして読み込めませんでした。バイナリファイルの可能性があります。",
    );
  }

  return decodeTextBytes(bytes);
}

function isAllowedTextFile(file: File): boolean {
  const extension = getLowerCaseExtension(file.name);
  if (extension && ALLOWED_TEXT_EXTENSIONS.has(extension)) {
    return true;
  }

  if (file.type.startsWith("text/")) {
    return true;
  }

  return ALLOWED_TEXT_MIME_TYPES.has(file.type.toLowerCase());
}

function getLowerCaseExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex < 0 || dotIndex === filename.length - 1) {
    return "";
  }
  return filename.slice(dotIndex).toLowerCase();
}

function isLikelyBinaryData(bytes: Uint8Array): boolean {
  if (bytes.length === 0) {
    return false;
  }

  if (hasUtf16Bom(bytes) || looksLikeUtf16WithoutBom(bytes)) {
    return false;
  }

  const sampleLength = Math.min(bytes.length, 4096);
  let suspiciousControls = 0;
  for (let index = 0; index < sampleLength; index += 1) {
    const value = bytes[index];
    if (value === 0) {
      return true;
    }
    const isControl = value < 32 && value !== 9 && value !== 10 && value !== 13;
    if (isControl) {
      suspiciousControls += 1;
    }
  }

  return suspiciousControls / sampleLength > 0.3;
}

function decodeTextBytes(bytes: Uint8Array): string {
  if (bytes.length === 0) {
    return "";
  }

  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return decodeWithEncoding(bytes, "utf-8");
  }

  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return decodeWithEncoding(bytes, "utf-16le");
  }

  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return decodeWithEncoding(bytes, "utf-16be");
  }

  if (looksLikeUtf16WithoutBom(bytes)) {
    if (hasEvenZeroBias(bytes)) {
      return decodeWithEncoding(bytes, "utf-16be");
    }
    return decodeWithEncoding(bytes, "utf-16le");
  }

  const candidates = ["utf-8", "shift_jis", "euc-jp", "iso-2022-jp"];
  for (const encoding of candidates) {
    try {
      return decodeWithEncoding(bytes, encoding, true);
    } catch {
      // Try the next candidate encoding.
    }
  }

  return decodeWithEncoding(bytes, "utf-8");
}

function decodeWithEncoding(bytes: Uint8Array, encoding: string, fatal = false): string {
  const decoder = new TextDecoder(encoding, { fatal });
  return decoder.decode(bytes);
}

function hasUtf16Bom(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 2 &&
    ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff))
  );
}

function looksLikeUtf16WithoutBom(bytes: Uint8Array): boolean {
  if (bytes.length < 4) {
    return false;
  }
  const sampleLength = Math.min(bytes.length, 4096);
  const evenZeroRatio = countZerosAtStride(bytes, 0, sampleLength);
  const oddZeroRatio = countZerosAtStride(bytes, 1, sampleLength);
  const hasLePattern = oddZeroRatio > 0.3 && evenZeroRatio < 0.05;
  const hasBePattern = evenZeroRatio > 0.3 && oddZeroRatio < 0.05;
  return hasLePattern || hasBePattern;
}

function hasEvenZeroBias(bytes: Uint8Array): boolean {
  const sampleLength = Math.min(bytes.length, 4096);
  return countZerosAtStride(bytes, 0, sampleLength) > countZerosAtStride(bytes, 1, sampleLength);
}

function countZerosAtStride(bytes: Uint8Array, start: number, end: number): number {
  let zeroCount = 0;
  let total = 0;
  for (let index = start; index < end; index += 2) {
    total += 1;
    if (bytes[index] === 0) {
      zeroCount += 1;
    }
  }
  if (total === 0) {
    return 0;
  }
  return zeroCount / total;
}
