import fs from "fs";
import path from "path";
import util from "util";

const readdirP = util.promisify(fs.readdir);

function aOrAn(nextWord: string) {
  return /^[aeiou]/i.test(nextWord) ? "an" : "a";
}

function pathKindErrorMessage(expected: string, actual: string): string {
  return `Expected to receive ${aOrAn(
    expected
  )} ${expected} path, but received ${aOrAn(actual)} ${actual} path instead`;
}

function comparisonRootKindMismatchErrorMessage(
  firstPath: string,
  secondPath: string
) {
  const firstRootKind = detectRootKind(firstPath);
  const secondRootKind = detectRootKind(secondPath);

  return (
    `The two paths being compared are not in the same namespace; ` +
    `the first path (${JSON.stringify(
      firstPath
    )}) has root kind ${JSON.stringify(firstRootKind)} ` +
    `but the second path (${JSON.stringify(secondPath)}) has root kind ` +
    `'${JSON.stringify(secondRootKind)}'.`
  );
}

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

function detectRootKind(
  pathString: string
): "leading-slash" | "letter-drive" | "unc" {
  const sep = getSeparator(pathString);
  if (pathString.match(/^[A-Z]:/i)) {
    return "letter-drive";
  } else if (pathString.startsWith("\\\\")) {
    return "unc";
  } else if (pathString.startsWith(sep)) {
    return "leading-slash";
  } else {
    throw new Error(
      `Unable to detect root kind from path string: '${pathString}'. Is it an absolute path?`
    );
  }
}

function reconsistuteAbsolutePath(
  originalRaw: string,
  newSegments: Array<string>
) {
  const sep = getSeparator(originalRaw);
  const rootKind = detectRootKind(originalRaw);

  let suffix = safeJoin(newSegments, sep);

  let prefix = "";
  switch (rootKind) {
    case "leading-slash": {
      prefix = sep;
      break;
    }
    case "unc": {
      prefix = sep.repeat(2);
      break;
    }
  }

  return prefix + suffix;
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

  static fromAbsolutePathString(absolutePath: string): AbsolutePath {
    const kind = detectPathKind(absolutePath);
    if (kind !== "absolute") {
      throw new Error(pathKindErrorMessage("absolute", kind));
    }

    return new AbsolutePath(absolutePath);
  }

  static fromRelativePathString(relativePath: string) {
    const kind = detectPathKind(relativePath);
    if (kind !== "relative") {
      throw new Error(pathKindErrorMessage("relative", kind));
    }

    return new RelativePath(relativePath);
  }

  static fromUnqualifiedPathString(unqualifiedPath: string) {
    const kind = detectPathKind(unqualifiedPath);
    if (kind !== "unqualified") {
      throw new Error(pathKindErrorMessage("unqualified", kind));
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

  removeTrailingSlash(): Path<Kind> {
    if (!this.hasTrailingSlash()) {
      return this;
    } else {
      return new Path<Kind>(this.raw.replace(/(?:[/\\])+$/, ""), this.kind);
    }
  }

  append(...segments: Array<string>): Path<Kind> {
    const sep = getSeparator(this.raw);
    return new Path<Kind>(safeJoin([this.raw, ...segments], sep), this.kind);
  }

  resolve(): Path<Kind> {
    const segments = getSegments(this.raw);
    const nextSegments = [];

    for (let i = 0; i < segments.length; i++) {
      const currentSegment = segments[i];

      if (currentSegment === "." && i !== 0) {
        continue;
      } else if (currentSegment === ".." && nextSegments.length > 0) {
        nextSegments.pop();
      } else {
        nextSegments.push(currentSegment);
      }
    }

    const nextRaw = reconsistuteAbsolutePath(this.raw, nextSegments);
    return new Path<Kind>(nextRaw, this.kind);
  }
}

export class AbsolutePath extends Path<"absolute"> {
  constructor(raw: string) {
    super(raw, "absolute");
  }

  relativeTo(relativeTo: AbsolutePath | string) {
    if (typeof relativeTo === "string") {
      const pathKind = detectPathKind(relativeTo);
      if (pathKind !== "absolute") {
        throw new Error(pathKindErrorMessage("absolute", pathKind));
      }
    }

    let relativeToString =
      typeof relativeTo === "string" ? relativeTo : relativeTo.raw;

    const thisRootKind = detectRootKind(this.raw);
    const relativeToRootKind = detectRootKind(relativeToString);

    if (thisRootKind !== relativeToRootKind) {
      throw new Error(
        comparisonRootKindMismatchErrorMessage(this.raw, relativeToString)
      );
    }

    if (
      thisRootKind === "letter-drive" &&
      relativeToRootKind === "letter-drive" &&
      this.raw.slice(0, 1).toUpperCase() !==
        relativeToString.slice(0, 1).toUpperCase()
    ) {
      throw new Error(
        `The two paths being compared are not on the same drive; comparing ` +
          JSON.stringify(this.raw) +
          " and " +
          JSON.stringify(relativeToString)
      );
    }

    const thisSegments = getSegments(this.raw);
    const relativeToSegments = getSegments(relativeToString);

    if (
      thisRootKind === "unc" &&
      relativeToRootKind === "unc" &&
      thisSegments[0] !== relativeToSegments[0]
    ) {
      throw new Error(
        "The two paths being compared are not on the same UNC host; comparing " +
          JSON.stringify(this.raw) +
          " and " +
          JSON.stringify(relativeToString)
      );
    }

    const longerLength = Math.max(
      thisSegments.length,
      relativeToSegments.length
    );
    let lastSharedSegmentIndex = -1;
    for (let i = 0; i < longerLength; i++) {
      const thisSegment = thisSegments[i];
      const relativeToSegment = relativeToSegments[i];

      if (thisSegment === relativeToSegment) {
        lastSharedSegmentIndex = i;
      } else {
        break;
      }
    }

    let nextSegments = [];
    if (lastSharedSegmentIndex === -1) {
      // No shared commonality between the paths
      nextSegments = relativeToSegments.map(() => "..");
      nextSegments.push(...thisSegments);
    } else {
      const remainingThisSegments = [];
      for (let i = 0; i < thisSegments.length; i++) {
        if (i > lastSharedSegmentIndex) {
          remainingThisSegments.push(thisSegments[i]);
        }
      }

      const remainingRelativeToSegments = [];

      for (let i = 0; i < relativeToSegments.length; i++) {
        if (i > lastSharedSegmentIndex) {
          remainingRelativeToSegments.push(thisSegments[i]);
        }
      }

      nextSegments.push(
        ...remainingRelativeToSegments.map(() => ".."),
        ...remainingThisSegments
      );
    }

    if (nextSegments[0] !== "..") {
      nextSegments = [".", ...nextSegments];
    }

    const sep = getSeparator(this.raw);
    const raw = safeJoin(nextSegments, sep);

    return new RelativePath(raw);
  }

  append(...segments: Array<string>): AbsolutePath {
    const normalPath = super.append(...segments);
    return new AbsolutePath(normalPath.raw);
  }

  removeTrailingSlash(): AbsolutePath {
    const normalPath = super.removeTrailingSlash();
    return new AbsolutePath(normalPath.raw);
  }

  resolve(): AbsolutePath {
    const normalPath = super.resolve();
    return new AbsolutePath(normalPath.raw);
  }

  async readdir(
    options?:
      | {
          encoding: string | null;
        }
      | string
      | null
      | undefined
  ): Promise<Array<AbsolutePath>> {
    const dirs = await readdirP(this.raw, options);
    // @ts-ignore
    return dirs.map(
      (dir: string | Buffer) =>
        new AbsolutePath(path.join(this.raw, dir.toString("utf-8")))
    );
  }

  readdirSync(
    options?:
      | {
          encoding: string | null;
        }
      | string
      | null
      | undefined
  ): Array<AbsolutePath> {
    const dirs = fs.readdirSync(this.raw, options);
    // @ts-ignore
    return dirs.map(
      (dir: string | Buffer) =>
        new AbsolutePath(path.join(this.raw, dir.toString("utf-8")))
    );
  }

  parentDirectory(): AbsolutePath {
    const segments = getSegments(this.raw);
    const nextSegments = segments.slice(0, -1);
    const nextRaw = reconsistuteAbsolutePath(this.raw, nextSegments);

    return new AbsolutePath(nextRaw);
  }
}

export class RelativePath extends Path<"relative"> {
  constructor(raw: string) {
    super(raw, "relative");
  }

  toAbsolute(contextDir: AbsolutePath | string) {
    const contextDirPath =
      typeof contextDir === "string"
        ? Path.fromAbsolutePathString(contextDir)
        : contextDir;

    let thisSegments = getSegments(this.raw);

    let nextSegments = [
      contextDirPath.removeTrailingSlash().raw,
      ...thisSegments,
    ];

    return new AbsolutePath(
      safeJoin(nextSegments, getSeparator(contextDirPath.raw))
    ).resolve();
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

  removeTrailingSlash(): RelativePath {
    const normalPath = super.removeTrailingSlash();
    return new RelativePath(normalPath.raw);
  }

  resolve(): RelativePath {
    const normalPath = super.resolve();
    return new RelativePath(normalPath.raw);
  }
}

export class UnqualifiedPath extends Path<"unqualified"> {
  constructor(raw: string) {
    super(raw, "unqualified");
  }

  toAbsolute(contextDir: AbsolutePath | string) {
    const contextDirPath =
      typeof contextDir === "string"
        ? Path.fromAbsolutePathString(contextDir)
        : contextDir;

    let thisSegments = getSegments(this.raw);

    let nextSegments = [
      contextDirPath.removeTrailingSlash().raw,
      ...thisSegments,
    ];

    return new AbsolutePath(
      safeJoin(nextSegments, getSeparator(contextDirPath.raw))
    ).resolve();
  }

  append(...segments: Array<string>): UnqualifiedPath {
    const normalPath = super.append(...segments);
    return new UnqualifiedPath(normalPath.raw);
  }

  prepend(...segments: Array<string>): UnqualifiedPath {
    const sep = getSeparator(this.raw);
    return new UnqualifiedPath(safeJoin([...segments, this.raw], sep));
  }

  removeTrailingSlash(): UnqualifiedPath {
    const normalPath = super.removeTrailingSlash();
    return new UnqualifiedPath(normalPath.raw);
  }

  resolve(): UnqualifiedPath {
    const normalPath = super.resolve();
    return new UnqualifiedPath(normalPath.raw);
  }
}

module.exports = Path;
module.exports.Path = Path;
module.exports.AbsolutePath = AbsolutePath;
module.exports.RelativePath = RelativePath;
module.exports.UnqualifiedPath = UnqualifiedPath;
