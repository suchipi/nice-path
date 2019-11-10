# nice-path

`nice-path` is a replacement for the [Node.js](https://nodejs.org/) `path` builtin module.

## The Problem

When using `path` in Node, paths are represented as strings. Because of this, it's easy to mix up absolute paths and relative paths, and when using Flow or TypeScript, it's hard to define and enforce whether a function you're writing needs absolute or relative paths. These problems mean there are a lot of things you need to remember to handle when working with paths.

Additionally, Node's `path` module cannot handle paths for OSes other than the one where it is running; if you use `path.join` on a Windows-style path on a Unix system, then it behaves incorrectly. This can be problematic when writing cross-platform applications, or when paths from one computer are used on another.

## This Solution

This package treats paths as first-class objects, and distinguishes between absolute paths, relative paths, and "unqualified" paths (relative paths without any leading `./`). It can handle paths from Windows on Unix systems and vice versa (including UNC paths).

## Usage Example

```ts
import { Path, AbsolutePath } from "nice-path";
import fs from "fs";

const absolutePath = Path.fromAbsolutePathString("/tmp/some-folder/");
absolutePath.raw; // "/tmp/some-folder/"

absolutePath.hasTrailingSlash(); // true

const newPath = absolutePath.removeTrailingSlash(); // AbsolutePath

const tmpDir = absolutePath.parentDirectory(); // AbsolutePath of "/tmp"

const someOtherFolder = tmpDir.append("some", "other-folder"); // AbsolutePath of "/tmp/some/other-folder"

function onlyWorksWithAbsolutePaths(path: AbsolutePath) {
  fs.writeFileSync(path.raw, "hi");
}

const relativePath = Path.fromRelativePathString("./data");

onlyWorksWithAbsolutePaths(relativePath); // TypeScript error

const absoluteData = relativePath.toAbsolute(absolutePath); // AbsolutePath of "/tmp/some-folder/data"

onlyWorksWithAbsolutePaths(absoluteData); // No error
```

## License

MIT
