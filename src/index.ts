import * as PathErrors from "./errors";

export { PathErrors };

function arrayHasHoles(array: Array<unknown>): boolean {
  for (let i = 0; i < array.length; i++) {
    if (!(i in array)) {
      return true;
    }
  }
  return false;
}

function throwIfSegmentsArrayHasHoles(
  array: Array<string>,
  message = "Unexpected hole(s) in segments Array",
) {
  if (arrayHasHoles(array)) {
    throw new PathErrors.HolesInSegmentsError(message);
  }
}

function throwIfSegmentsArrayIsEmpty(
  array: Array<string>,
  message = "Cannot create a Path with zero segments",
) {
  if (array.length === 0) {
    throw new PathErrors.ZeroSegmentsError(message);
  }
}

/** An object that represents a filesystem path. */
export class Path {
  /** Used by {@link _isWin32DriveLetter}. */
  protected static _WIN32_DRIVE_LETTER_REGEXP = /^[A-Za-z]:$/;

  /** Used by {@link Path.prototype.toString} and {@link Path.prototype.isAbsolute}. */
  protected static _isWin32DriveLetter(pathString: string) {
    return this._WIN32_DRIVE_LETTER_REGEXP.test(pathString);
  }

  /** Filter out empty path segments except for 1-2 leading empty segments. */
  protected static _validateSegments(
    segments: Array<string>,
    separator: string,
  ): Array<string> {
    throwIfSegmentsArrayHasHoles(segments);

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

  /** Split one or more path strings into an array of path segments. */
  static splitToSegments(inputParts: Array<string> | string): Array<string> {
    if (!Array.isArray(inputParts)) {
      inputParts = [inputParts];
    }

    const separator = (this as typeof Path).detectSeparator(inputParts, "/");

    return this._validateSegments(
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
  static normalize(...inputs: Array<string | Path | Array<string | Path>>) {
    return new (this as typeof Path)(...inputs).normalize();
  }

  /**
   * Return whether the provided path is absolute; that is, whether it
   * starts with either `/`, `\`, or a drive letter (ie `C:`).
   */
  static isAbsolute(path: string | Path): boolean {
    if (this.isPath(path)) {
      return path.isAbsolute();
    } else {
      return new (this as typeof Path)(path).isAbsolute();
    }
  }

  /**
   * An array of the path segments that make up this path.
   *
   * For `/tmp/foo.txt`, it'd be `["", "tmp", "foo.txt"]`.
   *
   * For `C:\something\somewhere.txt`, it'd be `["C:", "something", "somewhere.txt"]`.
   *
   * It is invalid for a Path to have zero segments.
   */
  segments!: Array<string>;

  /**
   * The path separator that should be used to turn this path into a string.
   *
   * Will be either `/` or `\`.
   */
  separator!: string;

  protected __is_Path!: true;

  /** Same as constructor but without the zero-length or holes checks */
  protected static _internalConstructorAllowInvalid(
    inputs: Array<string | Path | Array<string | Path>>,
    target: Path = Object.create((this as typeof Path).prototype),
  ) {
    const parts = inputs
      .flat(1)
      .map((part) => (typeof part === "string" ? part : part.segments))
      .flat(1);

    target.segments = (this as typeof Path).splitToSegments(parts);
    target.separator = (this as typeof Path).detectSeparator(parts, "/");

    Object.defineProperty(target, "__is_Path", {
      configurable: true,
      enumerable: false,
      value: true,
    });

    return target;
  }

  /** Create a new Path object using the provided input(s). */
  constructor(...inputs: Array<string | Path | Array<string | Path>>) {
    (this.constructor as typeof Path)._internalConstructorAllowInvalid(
      inputs,
      this,
    );

    // @ts-ignore use-before-assign (assigned in _internalConstructorAllowInvalid)
    throwIfSegmentsArrayIsEmpty(this.segments);
    // @ts-ignore use-before-assign (assigned in _internalConstructorAllowInvalid)
    throwIfSegmentsArrayHasHoles(this.segments);
  }

  /**
   * Create a new Path object using the provided segments and, optionally,
   * separator.
   *
   * NOTE: this doesn't set the `segments` directly; it passes them through a
   * filtering step first, to remove any double-slashes or etc. To set the
   * `.segments` directly, use {@link fromRaw}.
   */
  static from(segments: Array<string>, separator?: string): Path {
    throwIfSegmentsArrayHasHoles(segments);
    const separatorToUse =
      separator || (this as typeof Path).detectSeparator(segments, "/");
    const path = (this as typeof Path)._internalConstructorAllowInvalid([]);
    path.segments = this._validateSegments(segments, separatorToUse);
    throwIfSegmentsArrayIsEmpty(path.segments);
    path.separator = separatorToUse;
    return path;
  }

  /**
   * Create a new Path object using the provided segments and separator.
   *
   * NOTE: this method doesn't do full validation on `segments`; as such,
   * it can be used to construct an invalid Path object. Consider using
   * {@link from} instead.
   */
  static fromRaw(segments: Array<string>, separator: string): Path {
    throwIfSegmentsArrayIsEmpty(segments);
    throwIfSegmentsArrayHasHoles(segments);

    const path = (this as typeof Path)._internalConstructorAllowInvalid([]);
    path.segments = segments;
    path.separator = separator;
    return path;
  }

  /**
   * Resolve all non-leading `.` and `..` segments in this path.
   */
  normalize(): this {
    throwIfSegmentsArrayIsEmpty(
      this.segments,
      "Cannot normalize a Path with zero segments",
    );

    const segments = this.segments;
    const thisIsAbsolute = this.isAbsolute();

    const bodyStart = thisIsAbsolute
      ? segments[1] === ""
        ? /* UNC path */ 2
        : /* fs root or drive letter */ 1
      : /* relative/unqualified */ 0;

    const newSegments = segments.slice(0, bodyStart);

    for (let i = bodyStart; i < segments.length; i++) {
      const segment = segments[i];
      if (segment === "") continue;

      if (segment === ".") {
        if (!thisIsAbsolute && newSegments.length === bodyStart) {
          newSegments.push(".");
        }
        continue;
      }

      if (segment === "..") {
        const last =
          newSegments.length > bodyStart
            ? newSegments[newSegments.length - 1]
            : undefined;
        if (last === ".") {
          newSegments.pop();
          newSegments.push("..");
        } else if (last != null && last !== "..") {
          newSegments.pop();
        } else if (!thisIsAbsolute) {
          newSegments.push("..");
        } else {
          throw new PathErrors.NormalizeGoingOutsideRootError(
            "'normalize' is attempting to resolve '..' above the root of an absolute path, which isn't supported",
          );
        }
        continue;
      }

      newSegments.push(segment);
    }

    throwIfSegmentsArrayIsEmpty(
      newSegments,
      "'normalize' is attempting to create a Path with zero segments, which is invalid",
    );

    return (this.constructor as typeof Path).fromRaw(
      newSegments,
      this.separator,
    ) as this;
  }

  /**
   * Create a new Path by appending additional path segments onto the end of
   * this Path's segments.
   *
   * The returned path will use this path's separator.
   */
  concat(...others: Array<string | Path | Array<string | Path>>): this {
    throwIfSegmentsArrayIsEmpty(
      this.segments,
      "Cannot concat onto a Path with zero segments",
    );

    const otherSegments = (
      this.constructor as typeof Path
    )._internalConstructorAllowInvalid(others.flat(1)).segments;
    return (this.constructor as typeof Path).from(
      this.segments.concat(otherSegments),
      this.separator,
    ) as this;
  }

  /**
   * Return whether this path is absolute; that is, whether it starts with
   * either `/`, `\`, or a drive letter (ie `C:`).
   */
  isAbsolute(): boolean {
    throwIfSegmentsArrayIsEmpty(
      this.segments,
      "Cannot determine whether a Path with zero segments is absolute",
    );

    const firstPart = this.segments[0];

    // empty first component indicates that path starts with leading slash.
    // could be unix fs root, or windows unc path
    if (firstPart === "") return true;

    if ((this.constructor as typeof Path)._isWin32DriveLetter(firstPart)) {
      return true;
    }

    return false;
  }

  /**
   * Make a second Path object containing the same segments and separator as
   * this one.
   */
  clone(): this {
    throwIfSegmentsArrayIsEmpty(
      this.segments,
      "Cannot clone a Path with zero segments",
    );

    const theClone = (this.constructor as typeof Path).fromRaw(
      [...this.segments],
      this.separator,
    );
    return theClone as any;
  }

  /**
   * Returns a boolean indicating whether `other` is a Path instance.
   *
   * Works cross-context/realm/iframe/etc.
   *
   * @param other - Any value
   */
  static isPath(other: unknown): other is Path {
    return (
      typeof other === "object" &&
      other !== null &&
      (other as Path).__is_Path === true
    );
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
  ): this {
    throwIfSegmentsArrayIsEmpty(
      this.segments,
      "Cannot express a Path with zero segments relative to another path",
    );

    if (!(this.constructor as typeof Path).isPath(dir)) {
      dir = new (this.constructor as typeof Path)(dir);
    }

    throwIfSegmentsArrayIsEmpty(
      dir.segments,
      "Cannot express a path relative to a Path with zero segments",
    );

    if (this.hasEqualSegments(dir)) {
      throw new PathErrors.RelativeToSelfError(
        "Cannot express the value of a path relative to itself",
      );
    }

    const ownSegments = [...this.segments];
    const dirSegments = [...dir.segments];

    while (
      ownSegments.length > 0 &&
      dirSegments.length > 0 &&
      ownSegments[0] === dirSegments[0]
    ) {
      ownSegments.shift();
      dirSegments.shift();
    }

    if (dirSegments.length === 0) {
      if (options.noLeadingDot) {
        return (this.constructor as typeof Path).from(
          ownSegments,
          this.separator,
        ) as this;
      } else {
        return (this.constructor as typeof Path).from(
          [".", ...ownSegments],
          this.separator,
        ) as this;
      }
    } else {
      const dotDots = dirSegments.map((_) => "..");
      return (this.constructor as typeof Path).from(
        [...dotDots, ...ownSegments],
        this.separator,
      ) as this;
    }
  }

  /**
   * Turn this path into a string by joining its segments using its separator.
   */
  toString(): string {
    throwIfSegmentsArrayIsEmpty(
      this.segments,
      "Invalid Path with zero segments cannot be stringified",
    );
    throwIfSegmentsArrayHasHoles(
      this.segments,
      "Invalid Path with hole(s) in segments Array cannot be stringified",
    );

    let result = this.segments.join(this.separator);
    if ((this.constructor as typeof Path)._isWin32DriveLetter(result)) {
      return result + this.separator;
    } else {
      return result;
    }
  }

  /**
   * Return the final path segment of this path.
   */
  basename(): string {
    throwIfSegmentsArrayIsEmpty(
      this.segments,
      "Cannot obtain basename from a Path with zero segments",
    );
    throwIfSegmentsArrayHasHoles(this.segments);

    const last = this.segments[this.segments.length - 1];
    return last;
  }

  /**
   * Return the trailing extension of this path. Set option `full` to `true` to
   * get a compound extension like ".d.ts" instead of ".ts".
   */
  extname(options: { full?: boolean } = {}): string {
    throwIfSegmentsArrayIsEmpty(
      this.segments,
      "Cannot obtain extname from a Path with zero segments",
    );
    throwIfSegmentsArrayHasHoles(this.segments);

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
  dirname(): this {
    throwIfSegmentsArrayIsEmpty(
      this.segments,
      "Cannot obtain dirname from a Path with zero segments",
    );
    throwIfSegmentsArrayHasHoles(this.segments);

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
    throwIfSegmentsArrayIsEmpty(
      this.segments,
      "Cannot check what a Path with zero segments starts with",
    );

    value = new (this.constructor as typeof Path)(value);

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
    throwIfSegmentsArrayIsEmpty(
      this.segments,
      "Cannot check what a Path with zero segments ends with",
    );

    value = new (this.constructor as typeof Path)(value);

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
    throwIfSegmentsArrayIsEmpty(
      this.segments,
      "Cannot search within a Path with zero segments",
    );

    value = new (this.constructor as typeof Path)(value);

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
  ): this {
    throwIfSegmentsArrayIsEmpty(
      this.segments,
      "Cannot replace segments within a Path with zero segments",
    );

    value = new (this.constructor as typeof Path)(value);
    replacement = (
      this.constructor as typeof Path
    )._internalConstructorAllowInvalid([replacement]);

    const matchIndex = this.indexOf(value);

    if (matchIndex === -1) {
      return this.clone();
    } else {
      const newSegments = [
        ...this.segments.slice(0, matchIndex),
        ...replacement.segments,
        ...this.segments.slice(matchIndex + value.segments.length),
      ];
      throwIfSegmentsArrayIsEmpty(
        newSegments,
        "'replace' is attempting to create a Path with zero segments, which is invalid",
      );
      return (this.constructor as typeof Path).from(
        newSegments,
        this.separator,
      ) as this;
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
  ): this {
    throwIfSegmentsArrayIsEmpty(
      this.segments,
      "Cannot replace segments within a Path with zero segments",
    );

    const target = (
      this.constructor as typeof Path
    )._internalConstructorAllowInvalid([value]).segments;
    const replacementSegments = (
      this.constructor as typeof Path
    )._internalConstructorAllowInvalid([replacement]).segments;
    const ownSegments = this.segments;
    const resultingSegments: Array<string> = [];

    let index = 0;
    while (index < ownSegments.length) {
      const matches =
        target.length > 0 &&
        index + target.length <= ownSegments.length &&
        target.every(
          (segment, offset) => ownSegments[index + offset] === segment,
        );
      if (matches) {
        resultingSegments.push(...replacementSegments);
        index += target.length;
      } else {
        resultingSegments.push(ownSegments[index]);
        index++;
      }
    }

    throwIfSegmentsArrayIsEmpty(
      resultingSegments,
      "'replaceAll' is attempting to create a Path with zero segments, which is invalid",
    );

    return (this.constructor as typeof Path).from(
      resultingSegments,
      this.separator,
    ) as this;
  }

  /**
   * Return a copy of this path but with the final segment replaced with `replacement`
   *
   * @param replacement - The new final segment(s) for the returned Path
   */
  replaceLast(replacement: string | Path | Array<string | Path>): this {
    throwIfSegmentsArrayIsEmpty(
      this.segments,
      "Cannot replace the last segment of a Path with zero segments",
    );

    replacement = (
      this.constructor as typeof Path
    )._internalConstructorAllowInvalid([replacement]);

    const segments = [...this.segments];
    segments.pop();
    segments.push(...replacement.segments);

    throwIfSegmentsArrayIsEmpty(
      segments,
      "'replaceLast' is attempting to create a Path with zero segments, which is invalid",
    );
    throwIfSegmentsArrayHasHoles(segments);

    return (this.constructor as typeof Path).from(
      segments,
      this.separator,
    ) as this;
  }

  /**
   * Return a boolean indicating whether this Path has the same separator and
   * segments as another Path.
   *
   * To check only segments and not separator, use {@link Path.prototype.hasEqualSegments}.
   */
  equals(other: string | Path | Array<string | Path>): boolean {
    if (!(this.constructor as typeof Path).isPath(other)) {
      // It's surprising if an error is thrown about invalid Paths when you're
      // just trying to compare them, so we bypass the constructor's error
      // checks.
      other = (
        this.constructor as typeof Path
      )._internalConstructorAllowInvalid([other]);
    }

    return other.separator === this.separator && this.hasEqualSegments(other);
  }

  /**
   * Return a boolean indicating whether this Path has the same segments as
   * another Path. **Separator is not checked; use {@link Path.prototype.equals} for that.**
   */
  hasEqualSegments(other: string | Path | Array<string | Path>): boolean {
    if (!(this.constructor as typeof Path).isPath(other)) {
      // It's surprising if an error is thrown about invalid Paths when you're
      // just trying to compare them, so we bypass the constructor's error
      // checks.
      other = (
        this.constructor as typeof Path
      )._internalConstructorAllowInvalid([other]);
    }

    return (
      this.segments.length === other.segments.length &&
      this.segments.every((segment, index) => {
        return segment === other.segments[index];
      })
    );
  }
}
