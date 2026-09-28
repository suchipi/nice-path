import { test, expect } from "vitest";
import { Path } from "./index";

test("Path.splitToSegments", async () => {
  const result = [
    Path.splitToSegments("/some/path/some/where"),
    Path.splitToSegments("/with/trailing/slash/"),
    Path.splitToSegments("./this/one's/relative"),
    Path.splitToSegments(".."),
    Path.splitToSegments("../yeah"),
    Path.splitToSegments("hi"),
    Path.splitToSegments("hello/mario"),
    Path.splitToSegments("///what/"),
    Path.splitToSegments("/who//tf//keeps putting/double/slashes/"),
  ];

  expect(result).toMatchInlineSnapshot(`
    [
      [
        "",
        "some",
        "path",
        "some",
        "where",
      ],
      [
        "",
        "with",
        "trailing",
        "slash",
      ],
      [
        ".",
        "this",
        "one's",
        "relative",
      ],
      [
        "..",
      ],
      [
        "..",
        "yeah",
      ],
      [
        "hi",
      ],
      [
        "hello",
        "mario",
      ],
      [
        "",
        "what",
      ],
      [
        "",
        "who",
        "tf",
        "keeps putting",
        "double",
        "slashes",
      ],
    ]
  `);
});

test("Path.splitToSegments (windows-style paths)", async () => {
  const result = [
    Path.splitToSegments("C:\\some\\path\\some\\where"),
    Path.splitToSegments("D:\\with\\trailing\\slash\\"),
    Path.splitToSegments(".\\this\\one's\\relative"),
    Path.splitToSegments(".."),
    Path.splitToSegments("..\\yeah"),
    Path.splitToSegments("hi"),
    Path.splitToSegments("hello\\mario"),
    Path.splitToSegments("E:\\what\\"),
    Path.splitToSegments(
      "Z:\\\\who\\\\tf\\\\keeps putting\\\\double\\\\slashes\\\\",
    ),
    Path.splitToSegments("\\\\SERVERNAME\\ShareName$\\file.txt"),
  ];

  expect(result).toMatchInlineSnapshot(`
    [
      [
        "C:",
        "some",
        "path",
        "some",
        "where",
      ],
      [
        "D:",
        "with",
        "trailing",
        "slash",
      ],
      [
        ".",
        "this",
        "one's",
        "relative",
      ],
      [
        "..",
      ],
      [
        "..",
        "yeah",
      ],
      [
        "hi",
      ],
      [
        "hello",
        "mario",
      ],
      [
        "E:",
        "what",
      ],
      [
        "Z:",
        "who",
        "tf",
        "keeps putting",
        "double",
        "slashes",
      ],
      [
        "",
        "",
        "SERVERNAME",
        "ShareName$",
        "file.txt",
      ],
    ]
  `);
});

test("Path.detectSeparator", async () => {
  const result = [
    Path.detectSeparator("./hi/there", "/"),
    Path.detectSeparator(".\\hi\\there", "/"),
    Path.detectSeparator("hi", "/"),
    Path.detectSeparator("hi", "\\"),
    Path.detectSeparator("hi", null),
  ];

  expect(result).toMatchInlineSnapshot(`
    [
      "/",
      "\\",
      "/",
      "\\",
      null,
    ]
  `);
});

test("Path.normalize with absolute path with . and ..s in it", async () => {
  const result = Path.normalize("/hi/./there/yeah/../yup/./");
  expect(result).toMatchInlineSnapshot(`
    Path {
      "segments": [
        "",
        "hi",
        "there",
        "yup",
      ],
      "separator": "/",
    }
  `);
});

test("Path.normalize with non-absolute path with . and ..s in it", async () => {
  const result = Path.normalize("hi/./there/yeah/../yup/./");
  expect(result).toMatchInlineSnapshot(`
    Path {
      "segments": [
        "hi",
        "there",
        "yup",
      ],
      "separator": "/",
    }
  `);
});

test("Path.normalize with already-absolute path", async () => {
  const result = Path.normalize("/hi/there/yeah");
  expect(result).toMatchInlineSnapshot(`
    Path {
      "segments": [
        "",
        "hi",
        "there",
        "yeah",
      ],
      "separator": "/",
    }
  `);
});

test("Path.normalize with non-absolute path with no . or .. in it", async () => {
  const result = Path.normalize("hi/there/yeah");
  expect(result).toMatchInlineSnapshot(`
    Path {
      "segments": [
        "hi",
        "there",
        "yeah",
      ],
      "separator": "/",
    }
  `);
});

test("Path.normalize with non-absolute path with leading .", async () => {
  const result = Path.normalize("./hi/there/yeah");
  expect(result).toMatchInlineSnapshot(`
    Path {
      "segments": [
        ".",
        "hi",
        "there",
        "yeah",
      ],
      "separator": "/",
    }
  `);
});

test("Path.normalize with non-absolute path with leading ..", async () => {
  const result = Path.normalize("../hi/there/yeah");
  expect(result).toMatchInlineSnapshot(`
    Path {
      "segments": [
        "..",
        "hi",
        "there",
        "yeah",
      ],
      "separator": "/",
    }
  `);
});

test("Path.normalize with non-absolute path with two leading ..", async () => {
  const result = Path.normalize("../../hi/there/yeah");
  expect(result).toMatchInlineSnapshot(`
    Path {
      "segments": [
        "..",
        "..",
        "hi",
        "there",
        "yeah",
      ],
      "separator": "/",
    }
  `);
});

test("Path.relativeTo", async () => {
  const result = [
    new Path("/tmp/a/b/c").relativeTo("/tmp").toString(),
    new Path("/tmp/a/b/c").relativeTo("/").toString(),
    new Path("/tmp/a/b/c").relativeTo("/tmp/a/b/c/d/e").toString(),
    new Path("/tmp/a/b/c").relativeTo("/tmp/a/b/f/g/h").toString(),

    new Path("/home/suchipi/Code/something/src/index.ts")
      .relativeTo("/home/suchipi/Code/something")
      .toString(),
    new Path("/home/suchipi/Code/something/src/index.ts")
      .relativeTo("/home/suchipi/Code/something", { noLeadingDot: true })
      .toString(),

    new Path("/home/suchipi/Code/something/src/index.ts")
      .relativeTo("/home/suchipi/Code/something-else")
      .toString(),
    new Path("/home/suchipi/Code/something/src/index.ts")
      .relativeTo("/home/suchipi/Code/something-else", { noLeadingDot: true })
      .toString(),
  ];
  expect(result).toMatchInlineSnapshot(`
    [
      "./a/b/c",
      "./tmp/a/b/c",
      "../..",
      "../../../c",
      "./src/index.ts",
      "src/index.ts",
      "../something/src/index.ts",
      "../something/src/index.ts",
    ]
  `);
});

test("Path constructor with fs root strings", async () => {
  const path = new Path("/");
  const path2 = new Path("\\\\");

  const result = { path, path2 };
  expect(result).toMatchInlineSnapshot(`
    {
      "path": Path {
        "segments": [
          "",
        ],
        "separator": "/",
      },
      "path2": Path {
        "segments": [
          "",
          "",
        ],
        "separator": "\\",
      },
    }
  `);
});

test("Path constructor with absolute paths", async () => {
  const path = new Path("/tmp");
  const path2 = new Path("\\\\SERVERNAME\\ShareName$");

  const result = { path, path2 };

  expect(result).toMatchInlineSnapshot(`
    {
      "path": Path {
        "segments": [
          "",
          "tmp",
        ],
        "separator": "/",
      },
      "path2": Path {
        "segments": [
          "",
          "",
          "SERVERNAME",
          "ShareName$",
        ],
        "separator": "\\",
      },
    }
  `);
});

test("Path.startsWith", async () => {
  const base = "/tmp/blah/whatever";

  const p = new Path(base, "something", "yeah");
  const p2 = new Path(base, "something-else", "yeah", "yup");
  const p3 = new Path(base, "something");

  expect(p.startsWith(base)).toBe(true);
  expect(p2.startsWith(base)).toBe(true);
  expect(p3.startsWith(base)).toBe(true);
  expect(p.startsWith(p)).toBe(true);
  expect(p2.startsWith(p2)).toBe(true);
  expect(p3.startsWith(p3)).toBe(true);

  expect(p.startsWith(p2)).toBe(false);
  expect(p2.startsWith(p)).toBe(false);
  expect(p2.startsWith(p3)).toBe(false);

  expect(p.startsWith(p3)).toBe(true);
});

test("Path.endsWith", async () => {
  const base = "/tmp/blah/whatever";

  const p = new Path(base, "something", "yup");
  const p2 = new Path(base, "something-else", "yeah", "yup");
  const p3 = new Path("yeah", "yup");

  expect(p.endsWith(p)).toBe(true);
  expect(p2.endsWith(p2)).toBe(true);
  expect(p3.endsWith(p3)).toBe(true);

  expect(p.endsWith(p2)).toBe(false);
  expect(p2.endsWith(p)).toBe(false);
  expect(p.endsWith(p3)).toBe(false);

  expect(p2.endsWith(p3)).toBe(true);
});

test("Path.indexOf", async () => {
  const p = new Path("/tmp/something/yeah/yup");

  const result = [
    p.indexOf("not here"),
    p.indexOf("/tmp"),
    // weird quirk of how we store segments: first segment in unix-style absolute path is ""
    p.indexOf("tmp"),
    p.indexOf("yup"),
    p.indexOf("something"),

    // You can specify search index... best way to test that is to make it miss something, I guess
    p.indexOf("tmp", 2),
    p.indexOf("yup", 2), // works because yup is after index 2
  ];

  expect(result).toMatchInlineSnapshot(`
    [
      -1,
      0,
      1,
      4,
      2,
      -1,
      4,
    ]
  `);
});

test("Path.replace", async () => {
  const base = "/home/blah/whatever";

  const p = new Path(base, "something", "yup", "yeah");

  const result = [
    p.replace("something", "something-else"),
    p.replace("something/yup", "something/nah"),
    p.replace("something/yup", "something-again"),
    p.replace(base, "/tmp"),
    p.replace(["something", "yup", "yeah"], "/mhm"),
  ];

  expect(result).toMatchInlineSnapshot(`
    [
      Path {
        "segments": [
          "",
          "home",
          "blah",
          "whatever",
          "something-else",
          "yup",
          "yeah",
        ],
        "separator": "/",
      },
      Path {
        "segments": [
          "",
          "home",
          "blah",
          "whatever",
          "something",
          "nah",
          "yeah",
        ],
        "separator": "/",
      },
      Path {
        "segments": [
          "",
          "home",
          "blah",
          "whatever",
          "something-again",
          "yeah",
        ],
        "separator": "/",
      },
      Path {
        "segments": [
          "",
          "tmp",
          "something",
          "yup",
          "yeah",
        ],
        "separator": "/",
      },
      Path {
        "segments": [
          "",
          "home",
          "blah",
          "whatever",
          "mhm",
        ],
        "separator": "/",
      },
    ]
  `);
});

test("Path.replaceAll", async () => {
  const p = new Path("/one/two/three/two/one/zero");
  const result1 = p.replaceAll("one", "nine/ten");

  // replaceAll avoids an infinite loop by only replacing forwards
  const result2 = p.replaceAll("one", "one");

  expect([result1, result2]).toMatchInlineSnapshot(`
    [
      Path {
        "segments": [
          "",
          "nine",
          "ten",
          "two",
          "three",
          "two",
          "nine",
          "ten",
          "zero",
        ],
        "separator": "/",
      },
      Path {
        "segments": [
          "",
          "one",
          "two",
          "three",
          "two",
          "one",
          "zero",
        ],
        "separator": "/",
      },
    ]
  `);
});

test("Path.replaceLast", async () => {
  const p = new Path("/one/two/three/two/one/zero");
  const result = p.replaceLast("twenty-two");

  expect(result).toMatchInlineSnapshot(`
    Path {
      "segments": [
        "",
        "one",
        "two",
        "three",
        "two",
        "one",
        "twenty-two",
      ],
      "separator": "/",
    }
  `);
});

test("Path.basename", async () => {
  const p = new Path("/one/two/three/two/one/zero.help.txt");
  const result = p.basename();

  expect(result).toMatchInlineSnapshot(`"zero.help.txt"`);
});

test("Path.extname", async () => {
  const p = new Path("/one/two/three/two/one/zero.help.txt");
  const result = p.extname();

  expect(result).toMatchInlineSnapshot(`".txt"`);
});

test("Path.extname full", async () => {
  const p = new Path("/one/two/three/two/one/zero.help.txt");
  const result = p.extname({ full: true });
  expect(result).toMatchInlineSnapshot(`".help.txt"`);
});

test("Path.dirname", async () => {
  const p = new Path("/one/two/three/two/one/zero.help.txt");
  const result = p.dirname();
  expect(result).toMatchInlineSnapshot(`
    Path {
      "segments": [
        "",
        "one",
        "two",
        "three",
        "two",
        "one",
      ],
      "separator": "/",
    }
  `);
});

test("Path.fromRaw", async () => {
  const p = Path.fromRaw(["one", "two", "three"], "\\");
  expect(p).toMatchInlineSnapshot(`
    Path {
      "segments": [
        "one",
        "two",
        "three",
      ],
      "separator": "\\",
    }
  `);
});

test("Path.fromRaw, invalid inputs", async () => {
  const p = Path.fromRaw(["", "", "", "one", "", "two", "three"], "\\");
  expect(p).toMatchInlineSnapshot(`
    Path {
      "segments": [
        "",
        "",
        "",
        "one",
        "",
        "two",
        "three",
      ],
      "separator": "\\",
    }
  `);
});

test("Path.from", async () => {
  const p = Path.from(["one", "two", "three"], "\\");
  expect(p).toMatchInlineSnapshot(`
    Path {
      "segments": [
        "one",
        "two",
        "three",
      ],
      "separator": "\\",
    }
  `);
});

test("Path.from, invalid inputs", async () => {
  const p = Path.from(["", "", "", "one", "", "two", "three"], "\\");
  expect(p).toMatchInlineSnapshot(`
    Path {
      "segments": [
        "",
        "",
        "one",
        "two",
        "three",
      ],
      "separator": "\\",
    }
  `);

  // NOTE: different number of allowed leading empty segments depending on separator
  const p2 = Path.from(["", "", "", "one", "", "two", "three"], "/");
  expect(p2).toMatchInlineSnapshot(`
    Path {
      "segments": [
        "",
        "one",
        "two",
        "three",
      ],
      "separator": "/",
    }
  `);
});

test("Path.from, unspecified separator", async () => {
  // defaults to "/"
  const p = Path.from(["one", "", "two", "three"]);
  expect(p).toMatchInlineSnapshot(`
    Path {
      "segments": [
        "one",
        "two",
        "three",
      ],
      "separator": "/",
    }
  `);

  // uses one from input segments if possible
  const p2 = Path.from(["", "", "", "one", "", "two\\three", "four"]);
  expect(p2).toMatchInlineSnapshot(`
    Path {
      "segments": [
        "",
        "",
        "one",
        "two\\three",
        "four",
      ],
      "separator": "\\",
    }
  `);

  // ...but specified separator takes priority over that
  const p3 = Path.from(["", "", "", "one", "", "two\\three", "four"], "/");
  expect(p3).toMatchInlineSnapshot(`
    Path {
      "segments": [
        "",
        "one",
        "two\\three",
        "four",
      ],
      "separator": "/",
    }
  `);
});

test("Path.clone", async () => {
  const p = new Path("/one/two/three/two/one/zero.help.txt");
  const p2 = p.clone();

  const result = [
    p,
    p2,
    p === p2,
    p.segments === p2.segments,
    p.separator === p2.separator,
  ];

  expect(result).toMatchInlineSnapshot(`
    [
      Path {
        "segments": [
          "",
          "one",
          "two",
          "three",
          "two",
          "one",
          "zero.help.txt",
        ],
        "separator": "/",
      },
      Path {
        "segments": [
          "",
          "one",
          "two",
          "three",
          "two",
          "one",
          "zero.help.txt",
        ],
        "separator": "/",
      },
      false,
      false,
      true,
    ]
  `);
});

function makeInvalidEmptyPath() {
  const path = new Path("");
  path.segments = [];
  return path;
}

test("Path.equals", async () => {
  const pairs = [
    [new Path(""), new Path("")],
    [new Path("/abc/d"), new Path("/abc/d")],
    [new Path("/abc/d"), new Path("abc/d")],
    [new Path("abc/d"), new Path("abc/d")],
    [new Path("/123/4"), new Path("abc/d")],
    [Path.fromRaw(["", "a", "b", "c"], "\\"), new Path("/a/b/c")],
    [Path.fromRaw(["a", "b", "c"], "\\"), new Path("a/b/c")],
    [
      // Note: equals doesn't blow up if the Path is an invalid zero-segment Path object
      makeInvalidEmptyPath(),
      makeInvalidEmptyPath(),
    ],
  ];

  const results = pairs.map(([a, b]) => a.equals(b));

  expect(results).toMatchInlineSnapshot(`
    [
      true,
      true,
      false,
      true,
      false,
      false,
      false,
      true,
    ]
  `);
});

test("Path.hasEqualSegments", async () => {
  const pairs = [
    [new Path(""), new Path("")],
    [new Path("/abc/d"), new Path("/abc/d")],
    [new Path("/abc/d"), new Path("abc/d")],
    [new Path("abc/d"), new Path("abc/d")],
    [new Path("/123/4"), new Path("abc/d")],
    [Path.fromRaw(["", "a", "b", "c"], "\\"), new Path("/a/b/c")],
    [Path.fromRaw(["a", "b", "c"], "\\"), new Path("a/b/c")],
    [
      // Note: hasEqualSegments doesn't blow up if the Path is an invalid zero-segment Path object
      makeInvalidEmptyPath(),
      makeInvalidEmptyPath(),
    ],
  ];

  const results = pairs.map(([a, b]) => a.hasEqualSegments(b));

  expect(results).toMatchInlineSnapshot(`
    [
      true,
      true,
      false,
      true,
      false,
      true,
      true,
      true,
    ]
  `);
});

test("when subclassed, methods return subclass instances", () => {
  class MyPath extends Path {}

  expect(MyPath.normalize("a")).toBeInstanceOf(MyPath);
  expect(MyPath.from(["a"])).toBeInstanceOf(MyPath);
  expect(MyPath.from(["a"], "\\")).toBeInstanceOf(MyPath);
  expect(MyPath.fromRaw(["a"], "/")).toBeInstanceOf(MyPath);

  const myPath = new MyPath("a/b/c");

  expect(myPath.normalize()).toBeInstanceOf(MyPath);
  expect(myPath.concat("b")).toBeInstanceOf(MyPath);
  expect(myPath.clone()).toBeInstanceOf(MyPath);
  expect(myPath.relativeTo("/")).toBeInstanceOf(MyPath);
  expect(myPath.dirname()).toBeInstanceOf(MyPath);
  expect(myPath.replace("a", "d")).toBeInstanceOf(MyPath);
  expect(myPath.replaceAll("a", "d")).toBeInstanceOf(MyPath);
  expect(myPath.replaceLast("q")).toBeInstanceOf(MyPath);
});

test("when subclassed, Path.isPath returns true for the subclass", () => {
  class MyPath extends Path {}
  const myPath = new MyPath("a");

  expect(Path.isPath(myPath)).toBe(true);
  expect(MyPath.isPath(myPath)).toBe(true);
  // NOTE: The below behavior may be unexpected, but is correct. Consider adding
  // eg. "MyPath.isMyPath" to your own subclass implementation.
  expect(MyPath.isPath(new Path("a"))).toBe(true);
});

test("statics work", () => {
  expect(Path.splitToSegments("a/b/c")).toEqual(["a", "b", "c"]);
  expect(Path.detectSeparator("dfs\\fds", null)).toBe("\\");
  expect(Path.normalize("/tmp/somewhere/../yeah").toString()).toBe("/tmp/yeah");
  expect(Path.isAbsolute("/yeah")).toBe(true);
  expect(Path.from(["a/b", "c"], "/").toString()).toBe("a/b/c");
  expect(Path.fromRaw(["a/b", "c"], "/").segments[0]).toBe("a/b");
  expect(Path.isPath(new Path("/"))).toBe(true);
});

test("Path.relativeTo - path equal to dir throws", () => {
  expect(() => {
    new Path("/a/b").relativeTo("/a/b").toString();
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.RelativeToSelfError: Cannot express the value of a path relative to itself]`,
  );

  expect(() => {
    new Path("/a/b").relativeTo("/a/b", { noLeadingDot: true }).toString();
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.RelativeToSelfError: Cannot express the value of a path relative to itself]`,
  );

  expect(() => {
    new Path("a").relativeTo("a").toString();
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.RelativeToSelfError: Cannot express the value of a path relative to itself]`,
  );
});

test("Path.replaceAll - empty replacement removes segments", () => {
  expect([
    new Path("a/b").replaceAll("a", []).toString(),
    new Path("x/a/a/y").replaceAll("a", []).toString(),
  ]).toEqual(["b", "x/y"]);
});

test("Path.replaceAll - replacement longer than the value", () => {
  expect([
    new Path("a/a/a").replaceAll("a", "b/c").toString(),
    new Path("a/x/a").replaceAll("a", "a/b").toString(),
  ]).toEqual(["b/c/b/c/b/c", "a/b/x/a/b"]);
});

test("Path.replaceAll - resulting zero-segment Path is disallowed (throws)", () => {
  expect(() => {
    new Path("a/a/a").replaceAll("a", []).toString();
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.ZeroSegmentsError: 'replaceAll' is attempting to create a Path with zero segments, which is invalid]`,
  );
});

test("Path.replace - empty replacement removes segments", () => {
  expect([
    new Path("a/b").replace("a", []).toString(),
    new Path("x/a/a/y").replace("a", []).toString(),
  ]).toEqual(["b", "x/a/y"]);
});

test("Path.replace - resulting zero-segment Path is disallowed (throws)", () => {
  expect(() => {
    new Path("a").replace("a", []);
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.ZeroSegmentsError: 'replace' is attempting to create a Path with zero segments, which is invalid]`,
  );
});

test("Path.normalize - fully-cancelling paths throw", () => {
  expect(() => {
    Path.normalize("a/..");
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.ZeroSegmentsError: 'normalize' is attempting to create a Path with zero segments, which is invalid]`,
  );

  expect(() => {
    Path.normalize("a/b/../..");
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.ZeroSegmentsError: 'normalize' is attempting to create a Path with zero segments, which is invalid]`,
  );
});

// Intentionally different from POSIX here
test("Path.normalize - Attempting to move outside of fs root with .. throws", () => {
  expect(() => {
    Path.normalize("/../x");
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.NormalizeGoingOutsideRootError: 'normalize' is attempting to resolve '..' above the root of an absolute path, which isn't supported]`,
  );

  expect(() => {
    Path.normalize("/a/../../b");
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.NormalizeGoingOutsideRootError: 'normalize' is attempting to resolve '..' above the root of an absolute path, which isn't supported]`,
  );
});

test("Path.normalize - Attempting to move outside of drive root with .. throws", () => {
  expect(() => {
    Path.normalize(String.raw`C:\..\x`);
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.NormalizeGoingOutsideRootError: 'normalize' is attempting to resolve '..' above the root of an absolute path, which isn't supported]`,
  );

  expect(() => {
    Path.normalize(String.raw`C:\a\..\..\b`);
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.NormalizeGoingOutsideRootError: 'normalize' is attempting to resolve '..' above the root of an absolute path, which isn't supported]`,
  );
});

test("Path.normalize - win32 drive path", () => {
  expect(Path.normalize(String.raw`C:\a\..\b`).toString()).toBe(
    String.raw`C:\b`,
  );
  expect(Path.normalize(String.raw`C:\a\..`).toString()).toBe("C:\\");
});

test("Path.normalize - . right after root", () => {
  expect(Path.normalize("/./x").toString()).toBe("/x");
  expect(Path.normalize(String.raw`C:\.\x`).toString()).toBe(String.raw`C:\x`);
});

test("Path.normalize - UNC path", () => {
  expect(Path.normalize(String.raw`\\server\share\x\..`).toString()).toBe(
    String.raw`\\server\share`,
  );
});

test("Path - using dirname to obtain an empty path throws", () => {
  expect(() => {
    new Path("a.txt").dirname();
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.ZeroSegmentsError: 'replaceLast' is attempting to create a Path with zero segments, which is invalid]`,
  );

  expect(() => {
    new Path(".").dirname();
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.ZeroSegmentsError: 'replaceLast' is attempting to create a Path with zero segments, which is invalid]`,
  );
});

test("Path.isAbsolute", () => {
  const inputs = [
    "/a",
    String.raw`\\server\share`,
    String.raw`C:\a`,
    "C:\\",
    "C:",
    "c:/a",
    "C:a",
    "a:b/c",
    "a/b",
  ];

  expect(inputs.map((input) => Path.isAbsolute(input))).toEqual([
    true,
    true,
    true,
    true,
    true,
    true,
    false,
    false,
    false,
  ]);
});

test("Path.normalize - called on a zero-segment Path throws", () => {
  expect(() => {
    makeInvalidEmptyPath().normalize();
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.ZeroSegmentsError: Cannot normalize a Path with zero segments]`,
  );
});

test("Path.concat - called on a zero-segment Path throws", () => {
  expect(() => {
    makeInvalidEmptyPath().concat("b");
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.ZeroSegmentsError: Cannot concat onto a Path with zero segments]`,
  );
});

test("Path.isAbsolute - called on a zero-segment Path throws", () => {
  expect(() => {
    makeInvalidEmptyPath().isAbsolute();
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.ZeroSegmentsError: Cannot determine whether a Path with zero segments is absolute]`,
  );
});

test("Path.clone - called on a zero-segment Path throws", () => {
  expect(() => {
    makeInvalidEmptyPath().clone();
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.ZeroSegmentsError: Cannot clone a Path with zero segments]`,
  );
});

test("Path.relativeTo - called on a zero-segment Path throws", () => {
  expect(() => {
    makeInvalidEmptyPath().relativeTo("/a/b");
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.ZeroSegmentsError: Cannot express a Path with zero segments relative to another path]`,
  );
});

test("Path.startsWith - called on a zero-segment Path throws", () => {
  expect(() => {
    makeInvalidEmptyPath().startsWith("a");
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.ZeroSegmentsError: Cannot check what a Path with zero segments starts with]`,
  );
});

test("Path.endsWith - called on a zero-segment Path throws", () => {
  expect(() => {
    makeInvalidEmptyPath().endsWith("a");
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.ZeroSegmentsError: Cannot check what a Path with zero segments ends with]`,
  );
});

test("Path.indexOf - called on a zero-segment Path throws", () => {
  expect(() => {
    makeInvalidEmptyPath().indexOf("a");
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.ZeroSegmentsError: Cannot search within a Path with zero segments]`,
  );
});

test("Path.includes - called on a zero-segment Path throws", () => {
  expect(() => {
    makeInvalidEmptyPath().includes("a");
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.ZeroSegmentsError: Cannot search within a Path with zero segments]`,
  );
});

test("Path.replace - called on a zero-segment Path throws", () => {
  expect(() => {
    makeInvalidEmptyPath().replace("a", "b");
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.ZeroSegmentsError: Cannot replace segments within a Path with zero segments]`,
  );
});

test("Path.replaceAll - called on a zero-segment Path throws", () => {
  expect(() => {
    makeInvalidEmptyPath().replaceAll("a", "b");
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.ZeroSegmentsError: Cannot replace segments within a Path with zero segments]`,
  );
});

test("Path.replaceLast - called on a zero-segment Path throws", () => {
  expect(() => {
    makeInvalidEmptyPath().replaceLast("b");
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.ZeroSegmentsError: Cannot replace the last segment of a Path with zero segments]`,
  );
});

test("Path.relativeTo - dir with zero segments throws", () => {
  const emptyDir = makeInvalidEmptyPath();

  expect(() => {
    new Path("/x/y").relativeTo(emptyDir);
  }).toThrowErrorMatchingInlineSnapshot(
    `[PathErrors.ZeroSegmentsError: Cannot express a path relative to a Path with zero segments]`,
  );
});
