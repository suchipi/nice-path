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

test("Path.equals", async () => {
  const pairs = [
    [new Path(), new Path()],
    [new Path(""), new Path("")],
    [new Path("/abc/d"), new Path("/abc/d")],
    [new Path("/abc/d"), new Path("abc/d")],
    [new Path("abc/d"), new Path("abc/d")],
    [new Path("/123/4"), new Path("abc/d")],
    [Path.fromRaw(["", "a", "b", "c"], "\\"), new Path("/a/b/c")],
    [Path.fromRaw(["a", "b", "c"], "\\"), new Path("a/b/c")],
  ];

  const results = pairs.map(([a, b]) => a.equals(b));

  expect(results).toMatchInlineSnapshot(`
    [
      true,
      true,
      true,
      false,
      true,
      false,
      false,
      false,
    ]
  `);
});

test("Path.hasEqualSegments", async () => {
  const pairs = [
    [new Path(), new Path()],
    [new Path(""), new Path("")],
    [new Path("/abc/d"), new Path("/abc/d")],
    [new Path("/abc/d"), new Path("abc/d")],
    [new Path("abc/d"), new Path("abc/d")],
    [new Path("/123/4"), new Path("abc/d")],
    [Path.fromRaw(["", "a", "b", "c"], "\\"), new Path("/a/b/c")],
    [Path.fromRaw(["a", "b", "c"], "\\"), new Path("a/b/c")],
  ];

  const results = pairs.map(([a, b]) => a.hasEqualSegments(b));

  expect(results).toMatchInlineSnapshot(`
    [
      true,
      true,
      true,
      false,
      true,
      false,
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
