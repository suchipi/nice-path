const WIN32_DRIVE_LETTER_REGEXP = /^[A-Za-z]:$/;

function isWin32DriveLetter(pathString: string) {
  return WIN32_DRIVE_LETTER_REGEXP.test(pathString);
}

function validateSegments(
  segments: Array<string>,
  separator: string,
): Array<string> {
  return segments.filter((part, index) => {
    // first part can be "" to represent left side of root "/"
    // second part can be "" to support windows UNC paths
    if (part === "" && index === 0) {
      return true;
    } else if (
      part === "" &&
      index === 1 &&
      separator === "\\" &&
      segments[0] === ""
    ) {
      return true;
    }

    return Boolean(part);
  });
}

/** An object that represents a filesystem path. */
export class Path {
  /** Split one or more path strings into an array of path segments. */
  static splitToSegments(inputParts: Array<string> | string): Array<string> {
    if (!Array.isArray(inputParts)) {
      inputParts = [inputParts];
    }

    const separator = Path.detectSeparator(inputParts, "/");

    return validateSegments(
      inputParts.map((part) => part.split(/(?:\/|\\)/g)).flat(1),
      separator,
    );
  }

  /**
   * Search the provided path string or strings for a path separator character
   * (either forward slash or backslash), and return it. If none is found,
   * return `fallback`.
   */
  static detectSeparator<Fallback extends string | null = string>(
    input: Array<string> | string,
    fallback: Fallback,
  ): string | Fallback {
    let testStr = input;
    if (Array.isArray(input)) {
      testStr = input.join("|");
    }

    for (const char of testStr) {
      if (char === "/") {
        return "/";
      } else if (char === "\\") {
        return "\\";
      }
    }

    return fallback;
  }

  /**
   * Concatenates the input path(s) and then resolves all non-leading `.` and
   * `..` segments.
   */
  static normalize(
    ...inputs: Array<string | Path | Array<string | Path>>
  ): Path {
    return new Path(...inputs).normalize();
  }

  /**
   * Return whether the provided path is absolute; that is, whether it
   * starts with either `/`, `\`, or a drive letter (ie `C:`).
   */
  static isAbsolute(path: string | Path): boolean {
    if (path instanceof Path) {
      return path.isAbsolute();
    } else {
      return new Path(path).isAbsolute();
    }
  }

  /**
   * An array of the path segments that make up this path.
   *
   * For `/tmp/foo.txt`, it'd be `["", "tmp", "foo.txt"]`.
   *
   * For `C:\something\somewhere.txt`, it'd be `["C:", "something", "somewhere.txt"]`.
   */
  segments: Array<string>;

  /**
   * The path separator that should be used to turn this path into a string.
   *
   * Will be either `/` or `\`.
   */
  separator: string;

  /** Create a new Path object using the provided input(s). */
  constructor(...inputs: Array<string | Path | Array<string | Path>>) {
    const parts = inputs
      .flat(1)
      .map((part) => (typeof part === "string" ? part : part.segments))
      .flat(1);

    this.segments = Path.splitToSegments(parts);
    this.separator = Path.detectSeparator(parts, "/");
  }

  /**
   * Create a new Path object using the provided segments and, optionally,
   * separator.
   *
   * NOTE: this doesn't set the `segments` directly; it passes them through a
   * filtering step first, to remove any double-slashes or etc. To set the
   * `.segments` directly, use {@link fromRaw}.
   */
  static from(segments: Array<string>, separator?: string) {
    const separatorToUse = separator || Path.detectSeparator(segments, "/");
    const path = new Path();
    path.segments = validateSegments(segments, separatorToUse);
    path.separator = separatorToUse;
    return path;
  }

  /**
   * Create a new Path object using the provided segments and separator.
   *
   * NOTE: this method doesn't do any sort of validation on `segments`; as such,
   * it can be used to construct an invalid Path object. Consider using
   * {@link from} instead.
   */
  static fromRaw(segments: Array<string>, separator: string) {
    const path = new Path();
    path.segments = segments;
    path.separator = separator;
    return path;
  }

  /**
   * Resolve all non-leading `.` and `..` segments in this path.
   */
  normalize(): Path {
    // we clone this cause we're gonna mutate it
    const segments = [...this.segments];

    const newSegments: Array<string> = [];
    let currentSegment: string | undefined;
    while (segments.length > 0) {
      currentSegment = segments.shift();

      switch (currentSegment) {
        case ".": {
          if (newSegments.length === 0) {
            newSegments.push(currentSegment);
          }
          break;
        }
        case "..": {
          if (newSegments.length === 0) {
            newSegments.push(currentSegment);
          } else {
            newSegments.pop();
          }

          break;
        }
        default: {
          if (currentSegment != null) {
            newSegments.push(currentSegment);
          }
          break;
        }
      }
    }

    return Path.fromRaw(newSegments, this.separator);
  }

  /**
   * Create a new Path by appending additional path segments onto the end of
   * this Path's segments.
   *
   * The returned path will use this path's separator.
   */
  concat(...others: Array<string | Path | Array<string | Path>>): Path {
    const otherSegments = new Path(others.flat(1)).segments;
    return Path.from(this.segments.concat(otherSegments), this.separator);
  }

  /**
   * Return whether this path is absolute; that is, whether it starts with
   * either `/`, `\`, or a drive letter (ie `C:`).
   */
  isAbsolute(): boolean {
    const firstPart = this.segments[0];

    // empty first component indicates that path starts with leading slash.
    // could be unix fs root, or windows unc path
    if (firstPart === "") return true;

    // windows drive
    if (/^[A-Za-z]:/.test(firstPart)) return true;

    return false;
  }

  /**
   * Make a second Path object containing the same segments and separator as
   * this one.
   */
  clone(): this {
    const theClone = (this.constructor as typeof Path).fromRaw(
      [...this.segments],
      this.separator,
    );
    return theClone as any;
  }

  /**
   * Express this path relative to `dir`.
   *
   * @param dir - The directory to create a new path relative to.
   * @param options - Options that affect the resulting path.
   */
  relativeTo(
    dir: Path | string,
    options: { noLeadingDot?: boolean } = {},
  ): Path {
    if (!(dir instanceof Path)) {
      dir = new Path(dir);
    }

    const ownSegments = [...this.segments];
    const dirSegments = [...dir.segments];

    while (ownSegments[0] === dirSegments[0]) {
      ownSegments.shift();
      dirSegments.shift();
    }

    if (dirSegments.length === 0) {
      if (options.noLeadingDot) {
        return Path.from(ownSegments, this.separator);
      } else {
        return Path.from([".", ...ownSegments], this.separator);
      }
    } else {
      const dotDots = dirSegments.map((_) => "..");
      return Path.from([...dotDots, ...ownSegments], this.separator);
    }
  }

  /**
   * Turn this path into a string by joining its segments using its separator.
   */
  toString(): string {
    let result = this.segments.join(this.separator);
    if (result == "") {
      return "/";
    } else {
      if (isWin32DriveLetter(result)) {
        return result + this.separator;
      } else {
        return result;
      }
    }
  }

  /**
   * Return the final path segment of this path. If this path has no path
   * segments, the empty string is returned.
   */
  basename(): string {
    const last = this.segments[this.segments.length - 1];
    return last || "";
  }

  /**
   * Return the trailing extension of this path. Set option `full` to `true` to
   * get a compound extension like ".d.ts" instead of ".ts".
   */
  extname(options: { full?: boolean } = {}): string {
    const filename = this.basename();
    const parts = filename.split(".");

    if (parts.length === 1) {
      return "";
    }

    if (options.full) {
      return "." + parts.slice(1).join(".");
    } else {
      return "." + parts[parts.length - 1];
    }
  }

  /**
   * Return a new Path containing all of the path segments in this one except
   * for the last one; ie. the path to the directory that contains this path.
   */
  dirname(): Path {
    return this.replaceLast([]);
  }

  /**
   * Return whether this path starts with the provided value, by comparing one
   * path segment at a time.
   *
   * The starting segments of this path must *exactly* match the segments in the
   * provided value.
   *
   * This means that, given two Paths A and B:
   *
   * ```
   *   A: Path { /home/user/.config }
   *   B: Path { /home/user/.config2 }
   * ```
   *
   * Path B does *not* start with Path A, because `".config" !== ".config2"`.
   */
  startsWith(value: string | Path | Array<string | Path>): boolean {
    value = new Path(value);

    return value.segments.every(
      (segment, index) => this.segments[index] === segment,
    );
  }

  /**
   * Return whether this path ends with the provided value, by comparing one
   * path segment at a time.
   *
   * The ending segments of this path must *exactly* match the segments in the
   * provided value.
   *
   * This means that, given two Paths A and B:
   *
   * ```
   *   A: Path { /home/1user/.config }
   *   B: Path { user/.config }
   * ```
   *
   * Path A does *not* end with Path B, because `"1user" !== "user"`.
   */
  endsWith(value: string | Path | Array<string | Path>): boolean {
    value = new Path(value);

    const valueSegmentsReversed = [...value.segments].reverse();
    const ownSegmentsReversed = [...this.segments].reverse();

    return valueSegmentsReversed.every(
      (segment, index) => ownSegmentsReversed[index] === segment,
    );
  }

  /**
   * Return the path segment index at which `value` appears in this path, or
   * `-1` if it doesn't appear in this path.
   *
   * @param value - The value to search for. If the value contains more than one path segment, the returned index will refer to the location of the value's first path segment.
   * @param fromIndex - The index into this path's segments to begin searching at. Defaults to `0`.
   */
  indexOf(
    value: string | Path | Array<string | Path>,
    fromIndex: number = 0,
  ): number {
    value = new Path(value);

    const ownSegmentsLength = this.segments.length;
    for (let i = fromIndex; i < ownSegmentsLength; i++) {
      if (
        value.segments.every((valueSegment, valueIndex) => {
          return this.segments[i + valueIndex] === valueSegment;
        })
      ) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Return whether `value` appears in this path.
   *
   * @param value - The value to search for.
   * @param fromIndex - The index into this path's segments to begin searching at. Defaults to `0`.
   */
  includes(
    value: string | Path | Array<string | Path>,
    fromIndex: number = 0,
  ): boolean {
    return this.indexOf(value, fromIndex) !== -1;
  }

  /**
   * Return a new Path wherein the segments in `value` have been replaced with
   * the segments in `replacement`. If the segments in `value` are not present
   * in this path, a clone of this path is returned.
   *
   * Note that only the first match is replaced.
   *
   * @param value - What should be replaced
   * @param replacement - What it should be replaced with
   *
   * NOTE: to remove segments, use an empty Array for `replacement`.
   */
  replace(
    value: string | Path | Array<string | Path>,
    replacement: string | Path | Array<string | Path>,
  ): Path {
    value = new Path(value);
    replacement = new Path(replacement);

    const matchIndex = this.indexOf(value);

    if (matchIndex === -1) {
      return this.clone();
    } else {
      const newSegments = [
        ...this.segments.slice(0, matchIndex),
        ...replacement.segments,
        ...this.segments.slice(matchIndex + value.segments.length),
      ];
      return Path.from(newSegments, this.separator);
    }
  }

  /**
   * Return a new Path wherein all occurrences of the segments in `value` have
   * been replaced with the segments in `replacement`. If the segments in
   * `value` are not present in this path, a clone of this path is returned.
   *
   * @param value - What should be replaced
   * @param replacement - What it should be replaced with
   */
  replaceAll(
    value: string | Path | Array<string | Path>,
    replacement: string | Path | Array<string | Path>,
  ): Path {
    replacement = new Path(replacement);

    let searchIndex = 0;

    let currentPath: Path = this;

    const ownLength = this.segments.length;
    while (searchIndex < ownLength) {
      const matchingIndex = this.indexOf(value, searchIndex);
      if (matchingIndex === -1) {
        break;
      } else {
        currentPath = currentPath.replace(value, replacement);
        searchIndex = matchingIndex + replacement.segments.length;
      }
    }

    return currentPath;
  }

  /**
   * Return a copy of this path but with the final segment replaced with `replacement`
   *
   * @param replacement - The new final segment(s) for the returned Path
   */
  replaceLast(replacement: string | Path | Array<string | Path>): Path {
    replacement = new Path(replacement);

    const segments = [...this.segments];
    segments.pop();
    segments.push(...replacement.segments);

    return Path.from(segments, this.separator);
  }
}
