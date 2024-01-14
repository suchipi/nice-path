# nice-path

`nice-path` provides a class that represents a filesystem path (POSIX-style or Win32-style), which has various nice methods on it that make it easy to work with.

## Example

```ts
import { Path } from "nice-path";

const here = new Path(__dirname);
console.log(here);
// Path {
//   segments: ["", "home", "suchipi", "Code", "nice-path"],
//   separator: "/"
// }

here.toString(); // "/home/suchipi/Code/nice-path"
here.isAbsolute(); // true

const readme = here.concat("README.md");
console.log(readme);
// Path {
//   segments: [
//     "",
//     "home",
//     "suchipi",
//     "Code",
//     "nice-path",
//     "README.md"
//   ],
//   separator: "/"
// }
readme.basename(); // "README.md"
readme.extname(); // ".md"
readme.dirname(); // Path object with same contents as 'here'

// normalize resolves . and .. components
const homeDir = here.concat("../../.").normalize();
console.log(homeDir);
// Path {
//   segments: [
//     "",
//     "home",
//     "suchipi"
//   ],
//   separator: "/"
// }

here.relativeTo(homeDir).toString(); // "./Code/nice-path"
readme.relativeTo(homeDir).toString(); // "./Code/nice-path/README.txt"

// There are also several other methods which aren't in this example.
```

## API Documentation

### Overview

This package has one named export: "Path", which is a class.

The "Path" class has the following instance properties:

- segments (Array of string)
- separator (string)

and the following instance methods:

- normalize
- concat
- isAbsolute
- clone
- relativeTo
- toString
- basename
- extname
- dirname
- startsWith
- endsWith
- indexOf
- includes
- replace
- replaceAll
- replaceLast

and the following static methods:

- splitToSegments
- detectSeparator
- normalize
- isAbsolute
- fromRaw

### Details

#### Path (class)

An object that represents a filesystem path. It has the following constructor signature:

```ts
class Path {
  constructor(...inputs: Array<string | Path | Array<string | Path>>);
}
```

You can pass in zero or more arguments to the constructor, where each argument can be either a string, a Path object, or an array of strings and Path objects.

When multiple strings/Paths are provided to the constructor, they will be concatenated together in order, left-to-right.

The resulting object has two properties: `segments`, which is an array of strings containing all the non-slash portions of the Path, and `separator`, which is the slash string that those portions would have between them if this path were represented as a string.

#### `segments: Array<string>` (instance property of Path)

Each `Path` object has a `segments` property, which is an array of strings containing all the non-slash portions of the Path.

For example, given a path object `myPath = new Path("a/b/c/d")`, `myPath.segments` is an array of strings `["a", "b", "c", "d"]`.

You may freely mutate this array in order to add or remove segments, but I recommend you instead use instance methods on the Path object, which take a "separator-aware" approach to looking at path segments.

POSIX-style absolute paths start with a leading slash character, like "/a/b/c". A Path object representing that path, (ie `new Path("/a/b/c")`) would have the following path segments:

```json
["", "a", "b", "c"]
```

That empty string in the first position represents the "left side" of the first slash. When you use `.toString()` on that Path object, it will become "/a/b/c" again, as expected.

Windows [UNC paths](https://learn.microsoft.com/en-us/dotnet/standard/io/file-path-formats#unc-paths) have two empty strings at the beginning of the Array.

#### `separator: string` (instance property of Path)

Each `Path` object has a `separator` property, which is the slash string that those portions would have between them if this path were represented as a string. It's always either `/` (forward slash) or `\` (backward slash). If you change this property, the result of calling `.toString()` on the Path object will change:

```ts
// The initial value of separator is inferred from the input path:
const myPath = new Path("hi/there/friend");
console.log(myPath.separator); // prints /

// Using toString() joins the path segments using the separator:
console.log(myPath.toString()); // prints hi/there/friend

// If you change the separator... (note: this is a single backslash character. It has to be "escaped" with another one, which is why there are two.)
myPath.separator = "\\";

// Then toString() uses the new separator instead:
console.log(myPath.toString()); // prints hi\there\friend
```

The initial value of the `separator` property is inferred by searching the input string(s) the Path was constructed with for a slash character and using the first one found. If none is found, a forward slash (`/`) is used.

#### `normalize(): Path` (instance method of Path)

The `normalize` method returns a new Path with all non-leading `.` and `..` segments resolved.

```ts
const myPath = new Path("/some/where/../why/over/./here");
const resolved = myPath.normalize();
console.log(resolved.toString()); // /some/why/over/here
```

If you want to evaluate a relative path (a path with leading `.` or `..` segments) using a base directory, you can concatenate and then normalize them:

```ts
const baseDir = new Path("/home/me");
const relativeDir = new Path("./somewhere/something/../blue");
const resolved = baseDir.concat(relativeDir).normalize();
console.log(resolved.toString()); // /home/me/something/blue
```

#### `concat(...others): Path` (instance method of Path)

The `concat` method creates a new Path by appending additional path segments onto the end of the target Path's segments. The additional path segments are passed to the concat method as either strings, Paths, or Arrays of strings and Paths.

The new Path will use the separator from the target Path.

```ts
const pathOne = new Path("a/one");
const withStuffAdded = pathOne.concat(
  "two",
  "three/four",
  new Path("yeah\\yes"),
);

console.log(withStuffAdded.toString());
// "a/one/two/three/four/yeah/yes"
```

#### `isAbsolute(): boolean` (instance method of Path)

The `isAbsolute` method returns whether the target Path is an absolute path; that is, whether it starts with either `/`, `\`, or a drive letter (ie `C:`).

#### `clone(): Path` (instance method of Path)

The `clone` method makes a second Path object containing the same segments and separator as the target.

#### `relativeTo(dir, options?): Path` (instance method of Path)

The `relativeTo` method expresses the target path as a relative path, relative to the `dir` argument.

The `options` argument, if present, should be an object with the property "noLeadingDot", which is a boolean. The noLeadingDot option controls whether the resulting relative path has a leading `.` segment or not. If this option isn't provided, the leading dot will be present. Note that if the resulting path starts with "..", that will always be present, regardless of the option.

#### `toString(): string` (instance method of Path)

The `toString` method returns a string representation of the target Path by joining its segments using its separator.

#### `basename(): string` (instance method of Path)

The `basename` method returns the final segment string of the target Path. If that Path has no segments, the empty string is returned.

#### `extname(options?): string` (instance method of Path)

The `extname` method returns the trailing extension of the target Path. Pass `{ full: true }` as the "options" argument to get a compound extension like ".d.ts", rather than the final extension (like ".ts").

If the Path doesn't have a trailing extension, the empty string (`""`) is returned.

#### `dirname(): Path` (instance method of Path)

The `dirname` method returns a new Path containing all of the segments in the target Path except for the last one; ie. the path to the directory that contains the target path.

#### `startsWith(value): boolean` (instance method of Path)

TODO

#### `endsWith(value): boolean` (instance method of Path)

TODO

#### `indexOf(value, fromIndex?): number;` (instance method of Path)

TODO

#### `includes(value, fromIndex?): boolean;` (instance method of Path)

TODO

#### `replace(value, replacement): Path;` (instance method of Path)

TODO

#### `replaceAll(value, replacement): Path;` (instance method of Path)

TODO

#### `replaceLast(replacement): Path;` (instance method of Path)

TODO

#### `splitToSegments(inputParts): Array<string>` (static method on Path)

TODO

#### `detectSeparator(input, fallback?)` (static method on Path)

TODO

#### `normalize(...inputs): Path` (static method on Path)

TODO

#### `isAbsolute(path)`: boolean (static method on Path)

TODO

#### `fromRaw(segments, separator): Path` (static method on Path)

TODO

## License

MIT
