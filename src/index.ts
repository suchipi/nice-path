import fs from "fs";
import path from "path";
import util from "util";

function getSeparator(pathString: string): string {
  let sep = "/";
  if (!pathString.includes(sep)) {
    sep = "\\";
    if (!pathString.includes(sep)) {
      sep = path.sep;
    }
  }
  return sep;
}

function getSegments(pathString: string): Array<string> {
  const sep = getSeparator(pathString);
  const segments = pathString.split(sep).filter(Boolean);
  return segments;
}

// Normal path.join always uses path.sep and removes leading . or .. segments,
// so this is a safer alternative.
function safeJoin(pathsOrSegments: Array<string>, sep: string) {
  const trimmedSegments = pathsOrSegments.map(
    (pathOrSegment, pathOrSegmentIndex) =>
      pathOrSegment
        .split(sep)
        .filter((segment) => {
          if (pathOrSegmentIndex === 0) {
            return true;
          } else {
            return Boolean(segment);
          }
        })
        .join(sep)
  );

  return trimmedSegments.join(sep);
}

function detectPathKind(pathString: string) {
  const sep = getSeparator(pathString);
  const segments = getSegments(pathString);

  if (
    pathString.startsWith(sep) ||
    pathString.startsWith("\\\\") ||
    pathString.match(/^[A-Z]:/i)
  ) {
    return "absolute";
  } else if (segments[0] === "." || segments[0] === "..") {
    return "relative";
  } else {
    return "unqualified";
  }
}

export class Path<Kind extends "absolute" | "relative" | "unqualified"> {
  kind: Kind;
  raw: string;

  constructor(raw: string, kind: Kind) {
    this.raw = raw;
    this.kind = kind;
  }

  toString() {
    return this.raw;
  }

  static fromAbsolute(absolutePath: string): AbsolutePath {
    const kind = detectPathKind(absolutePath);
    if (kind !== "absolute") {
      throw new Error(
        `Expected to receive an absolute path, but received a${
          kind === "unqualified" ? "n" : ""
        } ${kind} path instead`
      );
    }

    return new AbsolutePath(absolutePath);
  }

  static fromRelative(relativePath: string) {
    const kind = detectPathKind(relativePath);
    if (kind !== "relative") {
      throw new Error(
        `Expected to receive an relative path, but received a${
          kind === "unqualified" ? "n" : ""
        } ${kind} path instead`
      );
    }

    return new RelativePath(relativePath);
  }

  static fromUnqualified(unqualifiedPath: string) {
    const kind = detectPathKind(unqualifiedPath);
    if (kind !== "unqualified") {
      throw new Error(
        `Expected to receive an unqualified path, but received a ${kind} path instead`
      );
    }

    return new UnqualifiedPath(unqualifiedPath);
  }

  static from(raw: string) {
    const kind = detectPathKind(raw);
    switch (kind) {
      case "absolute":
        return new AbsolutePath(raw);
      case "relative":
        return new RelativePath(raw);
      case "unqualified":
        return new UnqualifiedPath(raw);
      default: {
        throw new Error("Unable to detect path type from input string");
      }
    }
  }

  isAbsolute(): this is AbsolutePath {
    return this.kind === "absolute";
  }

  isRelative(): this is RelativePath {
    return this.kind === "relative";
  }

  isUnqualified(): this is UnqualifiedPath {
    return this.kind === "unqualified";
  }

  hasTrailingSlash(): boolean {
    const sep = getSeparator(this.raw);
    return this.raw.endsWith(sep);
  }

  append(...segments: Array<string>): Path<Kind> {
    const sep = getSeparator(this.raw);
    return new Path<Kind>(safeJoin([this.raw, ...segments], sep), this.kind);
  }
}

export class AbsolutePath extends Path<"absolute"> {
  constructor(raw: string) {
    super(raw, "absolute");
  }

  toRelative(relativeTo: AbsolutePath | string) {
    let relativeToString =
      typeof relativeTo === "string" ? relativeTo : relativeTo.raw;

    let raw = path.relative(relativeToString, this.raw);
    const segments = getSegments(raw);
    if (!(segments[0] === "." || segments[0] === "..")) {
      const sep = getSeparator(raw);
      raw = "." + sep + raw;
    }
    return new RelativePath(raw);
  }

  append(...segments: Array<string>): AbsolutePath {
    const normalPath = super.append(...segments);
    return new AbsolutePath(normalPath.raw);
  }

  readdir(
    options?:
      | {
          encoding:
            | "ascii"
            | "utf8"
            | "utf16le"
            | "ucs2"
            | "base64"
            | "latin1"
            | "binary"
            | "hex"
            | null;
        }
      | "ascii"
      | "utf8"
      | "utf16le"
      | "ucs2"
      | "base64"
      | "latin1"
      | "binary"
      | "hex"
      | null
      | undefined
  ): Promise<Array<AbsolutePath>> {
    return util
      .promisify(fs.readdir)(this.raw, options)
      .then((dirs) => {
        return dirs.map((dir) => new AbsolutePath(path.join(this.raw, dir)));
      });
  }

  readdirSync(
    options?:
      | {
          encoding:
            | "ascii"
            | "utf8"
            | "utf16le"
            | "ucs2"
            | "base64"
            | "latin1"
            | "binary"
            | "hex"
            | null;
        }
      | "ascii"
      | "utf8"
      | "utf16le"
      | "ucs2"
      | "base64"
      | "latin1"
      | "binary"
      | "hex"
      | null
      | undefined
  ): Array<AbsolutePath> {
    const dirs = fs.readdirSync(this.raw, options);
    return dirs.map((dir) => new AbsolutePath(path.join(this.raw, dir)));
  }

  parentDirectory(): AbsolutePath {
    return new AbsolutePath(path.dirname(this.raw));
  }
}

export class RelativePath extends Path<"relative"> {
  constructor(raw: string) {
    super(raw, "relative");
  }

  toAbsolute(contextDir: AbsolutePath | string) {
    const contextDirString =
      typeof contextDir === "string" ? contextDir : contextDir.raw;
    return new AbsolutePath(path.resolve(contextDirString, this.raw));
  }

  toUnqualified() {
    const segments = getSegments(this.raw);
    const sep = getSeparator(this.raw);

    let firstNonRelativeSegmentIndex = 0;
    for (const segment of segments) {
      if (segment === "." || segment === "..") {
        firstNonRelativeSegmentIndex++;
      } else {
        break;
      }
    }

    const unqualifiedSegments = segments.slice(firstNonRelativeSegmentIndex);
    const newRaw = safeJoin(unqualifiedSegments, sep);
    return new UnqualifiedPath(newRaw);
  }

  append(...segments: Array<string>): RelativePath {
    const normalPath = super.append(...segments);
    return new RelativePath(normalPath.raw);
  }
}

export class UnqualifiedPath extends Path<"unqualified"> {
  constructor(raw: string) {
    super(raw, "unqualified");
  }

  toAbsolute(contextDir: AbsolutePath | string) {
    const contextDirString =
      typeof contextDir === "string" ? contextDir : contextDir.raw;
    return new AbsolutePath(path.join(contextDirString, this.raw));
  }

  append(...segments: Array<string>): UnqualifiedPath {
    const normalPath = super.append(...segments);
    return new UnqualifiedPath(normalPath.raw);
  }

  prepend(...segments: Array<string>): UnqualifiedPath {
    const sep = getSeparator(this.raw);
    return new UnqualifiedPath(safeJoin([...segments, this.raw], sep));
  }
}

module.exports = Path;
module.exports.Path = Path;
module.exports.AbsolutePath = AbsolutePath;
module.exports.RelativePath = RelativePath;
module.exports.UnqualifiedPath = UnqualifiedPath;
