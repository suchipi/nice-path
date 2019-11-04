// @ts-ignore
const fs = require("fs");
const mockFs = require("mock-fs");
import { Path, AbsolutePath, RelativePath, UnqualifiedPath } from ".";

describe("Path", () => {
  test("toString (absolute)", () => {
    const p = new Path("/foo/bar", "absolute");
    expect(p.toString()).toBe("/foo/bar");
  });

  test("toString (relative)", () => {
    const p = new Path("./foo/bar", "relative");
    expect(p.toString()).toBe("./foo/bar");
  });

  test("toString (unqualified)", () => {
    const p = new Path("foo/bar", "unqualified");
    expect(p.toString()).toBe("foo/bar");
  });

  test("raw (absolute)", () => {
    const p = new Path("/foo/bar", "absolute");
    expect(p.raw).toBe("/foo/bar");
  });

  test("raw (relative)", () => {
    const p = new Path("./foo/bar", "relative");
    expect(p.raw).toBe("./foo/bar");
  });

  test("raw (unqualified)", () => {
    const p = new Path("foo/bar", "unqualified");
    expect(p.raw).toBe("foo/bar");
  });

  test("fromAbsolutePathString", () => {
    const p = Path.fromAbsolutePathString("/foo/bar");
    expect(p).toBeInstanceOf(AbsolutePath);

    const p2 = Path.fromAbsolutePathString("C:\\foo\\bar");
    expect(p2).toBeInstanceOf(AbsolutePath);

    const p3 = Path.fromAbsolutePathString("\\\\SERVER\\$Share");
    expect(p3).toBeInstanceOf(AbsolutePath);

    expect(() => {
      Path.fromAbsolutePathString("./foo/bar");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected to receive an absolute path, but received a relative path instead"`
    );

    expect(() => {
      Path.fromAbsolutePathString("foo/bar");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected to receive an absolute path, but received an unqualified path instead"`
    );
  });

  test("fromRelativePathString", () => {
    const p = Path.fromRelativePathString("./foo/bar");
    expect(p).toBeInstanceOf(RelativePath);

    expect(() => {
      Path.fromRelativePathString("/foo/bar");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected to receive a relative path, but received an absolute path instead"`
    );

    expect(() => {
      Path.fromRelativePathString("foo/bar");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected to receive a relative path, but received an unqualified path instead"`
    );
  });

  test("fromUnqualifiedPathString", () => {
    const p = Path.fromUnqualifiedPathString("foo/bar");
    expect(p).toBeInstanceOf(UnqualifiedPath);

    expect(() => {
      Path.fromUnqualifiedPathString("/foo/bar");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected to receive an unqualified path, but received an absolute path instead"`
    );

    expect(() => {
      Path.fromUnqualifiedPathString("./foo/bar");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected to receive an unqualified path, but received a relative path instead"`
    );

    expect(() => {
      Path.fromUnqualifiedPathString("C:\\Users");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected to receive an unqualified path, but received an absolute path instead"`
    );

    expect(() => {
      Path.fromUnqualifiedPathString("\\\\SERVER\\$Share");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected to receive an unqualified path, but received an absolute path instead"`
    );
  });

  test("from", () => {
    const p1 = Path.from("/foo/bar");
    expect(p1).toBeInstanceOf(AbsolutePath);

    const p2 = Path.from("foo/bar");
    expect(p2).toBeInstanceOf(UnqualifiedPath);

    const p3 = Path.from("./foo/bar");
    expect(p3).toBeInstanceOf(RelativePath);

    const p4 = Path.from("C:\\Users");
    expect(p4).toBeInstanceOf(AbsolutePath);

    const p5 = Path.from("\\\\SERVER\\$Share");
    expect(p5).toBeInstanceOf(AbsolutePath);
  });

  test("isAbsolute", () => {
    const p1 = Path.from("/foo/bar");
    expect(p1.isAbsolute()).toBe(true);

    const p2 = Path.from("foo/bar");
    expect(p2.isAbsolute()).toBe(false);

    const p3 = Path.from("./foo/bar");
    expect(p3.isAbsolute()).toBe(false);

    const p4 = Path.from("C:\\Users");
    expect(p4.isAbsolute()).toBe(true);

    const p5 = Path.from("\\\\SERVER\\$Share");
    expect(p5.isAbsolute()).toBe(true);
  });

  test("isRelative", () => {
    const p1 = Path.from("/foo/bar");
    expect(p1.isRelative()).toBe(false);

    const p2 = Path.from("foo/bar");
    expect(p2.isRelative()).toBe(false);

    const p3 = Path.from("./foo/bar");
    expect(p3.isRelative()).toBe(true);

    const p4 = Path.from("C:\\Users");
    expect(p4.isRelative()).toBe(false);
  });

  test("isUnqualified", () => {
    const p1 = Path.from("/foo/bar");
    expect(p1.isUnqualified()).toBe(false);

    const p2 = Path.from("foo/bar");
    expect(p2.isUnqualified()).toBe(true);

    const p3 = Path.from("./foo/bar");
    expect(p3.isUnqualified()).toBe(false);

    const p4 = Path.from("C:\\Users");
    expect(p4.isUnqualified()).toBe(false);
  });

  test("hasTrailingSlash", () => {
    const p1 = Path.from("/foo/bar");
    expect(p1.hasTrailingSlash()).toBe(false);

    const p2 = Path.from("foo/bar");
    expect(p2.hasTrailingSlash()).toBe(false);

    const p3 = Path.from("./foo/bar");
    expect(p3.hasTrailingSlash()).toBe(false);

    const pwin1 = Path.from("C:\\Windows");
    expect(pwin1.hasTrailingSlash()).toBe(false);

    const p4 = Path.from("/foo/bar/");
    expect(p4.hasTrailingSlash()).toBe(true);

    const p5 = Path.from("foo/bar/");
    expect(p5.hasTrailingSlash()).toBe(true);

    const p6 = Path.from("./foo/bar/");
    expect(p6.hasTrailingSlash()).toBe(true);

    const pwin2 = Path.from("C:\\Windows\\");
    expect(pwin2.hasTrailingSlash()).toBe(true);
  });

  test("append (absolute)", () => {
    const p1 = Path.from("/foo/bar");

    const p2 = p1.append("baz");
    expect(p2.raw).toBe("/foo/bar/baz");

    const p3 = p1.append("baz", "qux");
    expect(p3.raw).toBe("/foo/bar/baz/qux");
  });

  test("append (absolute - win32)", () => {
    const p1 = Path.from("C:\\Users");

    const p2 = p1.append("baz");
    expect(p2.raw).toBe("C:\\Users\\baz");

    const p3 = p1.append("baz", "qux");
    expect(p3.raw).toBe("C:\\Users\\baz\\qux");
  });

  test("append (absolute - win32 UNC)", () => {
    const p1 = Path.from("\\\\Foo");

    const p2 = p1.append("baz");
    expect(p2.raw).toBe("\\\\Foo\\baz");

    const p3 = p1.append("baz", "qux");
    expect(p3.raw).toBe("\\\\Foo\\baz\\qux");
  });

  test("append (relative)", () => {
    const p1 = Path.from("./foo/bar");

    const p2 = p1.append("baz");
    expect(p2.raw).toBe("./foo/bar/baz");

    const p3 = p1.append("baz", "qux");
    expect(p3.raw).toBe("./foo/bar/baz/qux");
  });

  test("append (relative - win32)", () => {
    const p1 = Path.from(".\\foo\\bar");

    const p2 = p1.append("baz");
    expect(p2.raw).toBe(".\\foo\\bar\\baz");

    const p3 = p1.append("baz", "qux");
    expect(p3.raw).toBe(".\\foo\\bar\\baz\\qux");
  });

  test("append (unqualified)", () => {
    const p1 = Path.from("foo/bar");

    const p2 = p1.append("baz");
    expect(p2.raw).toBe("foo/bar/baz");

    const p3 = p1.append("baz", "qux");
    expect(p3.raw).toBe("foo/bar/baz/qux");
  });

  test("append (unqualified - win32)", () => {
    const p1 = Path.from("foo\\bar");

    const p2 = p1.append("baz");
    expect(p2.raw).toBe("foo\\bar\\baz");

    const p3 = p1.append("baz", "qux");
    expect(p3.raw).toBe("foo\\bar\\baz\\qux");
  });

  test("resolve", () => {
    expect(Path.from("/foo/..").resolve().raw).toBe("/");
    expect(Path.from("/foo/../bar").resolve().raw).toBe("/bar");
    expect(Path.from("/foo/./bar").resolve().raw).toBe("/foo/bar");
    expect(Path.from("/foo/bar/baz/../../qux").resolve().raw).toBe("/foo/qux");

    expect(Path.from("C:\\foo\\..").resolve().raw).toBe("C:");
    expect(Path.from("C:\\foo\\..\\bar").resolve().raw).toBe("C:\\bar");
    expect(Path.from("C:\\foo\\.\\bar").resolve().raw).toBe("C:\\foo\\bar");
    expect(Path.from("C:\\foo\\bar\\baz\\..\\..\\qux").resolve().raw).toBe(
      "C:\\foo\\qux"
    );

    expect(Path.from("\\\\SERVER\\foo\\..").resolve().raw).toBe("\\\\SERVER");
    expect(Path.from("\\\\SERVER\\foo\\..\\bar").resolve().raw).toBe(
      "\\\\SERVER\\bar"
    );
    expect(Path.from("\\\\SERVER\\foo\\.\\bar").resolve().raw).toBe(
      "\\\\SERVER\\foo\\bar"
    );
    expect(
      Path.from("\\\\SERVER\\foo\\bar\\baz\\..\\..\\qux").resolve().raw
    ).toBe("\\\\SERVER\\foo\\qux");
  });

  test("AbsolutePath relativeTo", () => {
    const p1 = Path.fromAbsolutePathString("/foo/bar");
    const p2 = p1.relativeTo("/foo");
    expect(p2.raw).toBe("./bar");

    const p3 = p1.relativeTo(Path.fromAbsolutePathString("/foo"));
    expect(p3.raw).toBe("./bar");

    const p4 = Path.fromAbsolutePathString("\\\\SERVER\\$Share\\Bla");
    const p5 = p4.relativeTo("\\\\SERVER\\$Share");
    expect(p5.raw).toBe(".\\Bla");

    const p6 = Path.fromAbsolutePathString("/foo/bar/baz");
    const p7 = p6.relativeTo("/foo/bar");
    expect(p7.raw).toBe("./baz");

    const p8 = Path.fromAbsolutePathString("/foo/qux/baz");
    const p9 = p8.relativeTo("/foo/bar");
    expect(p9.raw).toBe("../qux/baz");

    const p10 = Path.fromAbsolutePathString("/foo");
    const p11 = p10.relativeTo("/foo/bar");
    expect(p11.raw).toBe("..");

    const p12 = Path.fromAbsolutePathString("/foo/qux");
    const p13 = p12.relativeTo("/foo/bar/baz");
    expect(p13.raw).toBe("../../qux");

    const p14 = Path.fromAbsolutePathString("/a/b/c");
    const p15 = p14.relativeTo("/d/e/f");
    expect(p15.raw).toBe("../../../a/b/c");

    expect(() => {
      Path.fromAbsolutePathString("/a/b/c").relativeTo("a");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected to receive an absolute path, but received an unqualified path instead"`
    );

    expect(() => {
      Path.fromAbsolutePathString("/a/b/c").relativeTo("C:\\Woo");
    }).toThrowErrorMatchingInlineSnapshot(
      `"The two paths being compared are not in the same namespace; the first path (\\"/a/b/c\\") has root kind \\"leading-slash\\" but the second path (\\"C:\\\\\\\\Woo\\") has root kind '\\"letter-drive\\"'."`
    );

    expect(() => {
      Path.fromAbsolutePathString("/a/b/c").relativeTo("\\\\Woop\\woop");
    }).toThrowErrorMatchingInlineSnapshot(
      `"The two paths being compared are not in the same namespace; the first path (\\"/a/b/c\\") has root kind \\"leading-slash\\" but the second path (\\"\\\\\\\\\\\\\\\\Woop\\\\\\\\woop\\") has root kind '\\"unc\\"'."`
    );

    expect(() => {
      Path.fromAbsolutePathString("C:\\Bla").relativeTo("A:\\");
    }).toThrowErrorMatchingInlineSnapshot(
      `"The two paths being compared are not on the same drive; comparing \\"C:\\\\\\\\Bla\\" and \\"A:\\\\\\\\\\""`
    );

    expect(() => {
      Path.fromAbsolutePathString("\\\\Bla\\sos").relativeTo("\\\\Blah\\sauce");
    }).toThrowErrorMatchingInlineSnapshot(
      `"The two paths being compared are not on the same UNC host; comparing \\"\\\\\\\\\\\\\\\\Bla\\\\\\\\sos\\" and \\"\\\\\\\\\\\\\\\\Blah\\\\\\\\sauce\\""`
    );
  });

  test("AbsolutePath append", () => {
    const p1 = Path.fromAbsolutePathString("/foo/bar").append("baz");
    expect(p1).toBeInstanceOf(AbsolutePath);
    expect(p1.raw).toBe("/foo/bar/baz");

    const p2 = Path.fromAbsolutePathString("C:\\foo\\bar").append("baz");
    expect(p2.raw).toBe("C:\\foo\\bar\\baz");

    const p3 = Path.fromAbsolutePathString("\\\\foo\\bar").append("baz");
    expect(p3.raw).toBe("\\\\foo\\bar\\baz");
  });

  test("AbsolutePath parentDirectory", () => {
    const p1 = Path.fromAbsolutePathString("/foo/bar").parentDirectory();
    expect(p1.raw).toBe("/foo");

    const p2 = Path.fromAbsolutePathString("C:\\foo\\bar").parentDirectory();
    expect(p2.raw).toBe("C:\\foo");

    const p3 = Path.fromAbsolutePathString("\\\\foo\\bar").parentDirectory();
    expect(p3.raw).toBe("\\\\foo");
  });

  test("RelativePath append", () => {
    const p1 = Path.fromRelativePathString("./foo/bar").append("baz");
    expect(p1).toBeInstanceOf(RelativePath);
    expect(p1.raw).toBe("./foo/bar/baz");

    const p2 = Path.fromRelativePathString(".\\foo\\bar").append("baz");
    expect(p2).toBeInstanceOf(RelativePath);
    expect(p2.raw).toBe(".\\foo\\bar\\baz");
  });

  test("RelativePath toAbsolute (using Path object)", () => {
    const p1 = Path.fromRelativePathString("./foo/bar").toAbsolute(
      Path.fromAbsolutePathString("/woop")
    );
    expect(p1.raw).toBe("/woop/foo/bar");

    const p2 = Path.fromRelativePathString("../foo/bar").toAbsolute(
      Path.fromAbsolutePathString("/woop")
    );
    expect(p2.raw).toBe("/foo/bar");

    const p3 = Path.fromRelativePathString(".\\foo\\bar").toAbsolute(
      Path.fromAbsolutePathString("C:\\woop")
    );
    expect(p3.raw).toBe("C:\\woop\\foo\\bar");

    const p4 = Path.fromRelativePathString("..\\foo\\bar").toAbsolute(
      Path.fromAbsolutePathString("C:\\woop")
    );
    expect(p4.raw).toBe("C:\\foo\\bar");
  });

  test("RelativePath toAbsolute (using string)", () => {
    const p1 = Path.fromRelativePathString("./foo/bar").toAbsolute("/woop");
    expect(p1.raw).toBe("/woop/foo/bar");

    const p2 = Path.fromRelativePathString("../foo/bar").toAbsolute("/woop");
    expect(p2.raw).toBe("/foo/bar");

    const p3 = Path.fromRelativePathString(".\\foo\\bar").toAbsolute(
      "C:\\woop"
    );
    expect(p3.raw).toBe("C:\\woop\\foo\\bar");

    const p4 = Path.fromRelativePathString("..\\foo\\bar").toAbsolute(
      "C:\\woop"
    );
    expect(p4.raw).toBe("C:\\foo\\bar");
  });

  test("RelativePath toUnqualified", () => {
    const p1 = Path.fromRelativePathString("./foo/bar").toUnqualified();
    expect(p1.raw).toBe("foo/bar");

    const p2 = Path.fromRelativePathString("../foo/bar").toUnqualified();
    expect(p2.raw).toBe("foo/bar");

    const p3 = Path.fromRelativePathString(
      "../.././../foo/../bar"
    ).toUnqualified();
    expect(p3.raw).toBe("foo/../bar");

    const p4 = Path.fromRelativePathString(".\\foo\\bar").toUnqualified();
    expect(p4.raw).toBe("foo\\bar");

    const p5 = Path.fromRelativePathString("..\\foo\\bar").toUnqualified();
    expect(p5.raw).toBe("foo\\bar");

    const p6 = Path.fromRelativePathString(
      "..\\..\\.\\..\\foo\\..\\bar"
    ).toUnqualified();
    expect(p6.raw).toBe("foo\\..\\bar");
  });

  test("UnqualifiedPath toAbsolute (using Path object)", () => {
    const p1 = Path.fromUnqualifiedPathString("foo/bar").toAbsolute(
      Path.fromAbsolutePathString("/woop")
    );
    expect(p1.raw).toBe("/woop/foo/bar");

    const p3 = Path.fromUnqualifiedPathString("foo\\bar").toAbsolute(
      Path.fromAbsolutePathString("C:\\woop")
    );
    expect(p3.raw).toBe("C:\\woop\\foo\\bar");
  });

  test("UnqualifiedPath toAbsolute (using string)", () => {
    const p1 = Path.fromUnqualifiedPathString("foo/bar").toAbsolute("/woop");
    expect(p1.raw).toBe("/woop/foo/bar");

    const p3 = Path.fromUnqualifiedPathString("foo\\bar").toAbsolute(
      "C:\\woop"
    );
    expect(p3.raw).toBe("C:\\woop\\foo\\bar");
  });

  test("UnqualifiedPath append", () => {
    const p1 = Path.fromUnqualifiedPathString("foo/bar");
    expect(p1.append("qux")).toBeInstanceOf(UnqualifiedPath);
    expect(p1.append("qux").raw).toBe("foo/bar/qux");
    expect(p1.append("qux", "woop").raw).toBe("foo/bar/qux/woop");

    const p2 = Path.fromUnqualifiedPathString("foo\\bar");
    expect(p2.append("qux").raw).toBe("foo\\bar\\qux");
    expect(p2.append("qux", "woop").raw).toBe("foo\\bar\\qux\\woop");
  });

  test("UnqualifiedPath prepend", () => {
    const p1 = Path.fromUnqualifiedPathString("foo/bar");
    expect(p1.prepend("qux")).toBeInstanceOf(UnqualifiedPath);
    expect(p1.prepend("qux").raw).toBe("qux/foo/bar");
    expect(p1.prepend("qux", "woop").raw).toBe("qux/woop/foo/bar");

    const p2 = Path.fromUnqualifiedPathString("foo\\bar");
    expect(p2.prepend("qux").raw).toBe("qux\\foo\\bar");
    expect(p2.prepend("qux", "woop").raw).toBe("qux\\woop\\foo\\bar");
  });

  test("Path removeTrailingSlash", () => {
    const p1 = Path.from("/hi/mom/");
    expect(p1.removeTrailingSlash().raw).toBe("/hi/mom");

    const p2 = Path.from("C:\\hi\\mom\\");
    expect(p2.removeTrailingSlash().raw).toBe("C:\\hi\\mom");

    const p3 = Path.from("/hi/mom////");
    expect(p3.removeTrailingSlash().raw).toBe("/hi/mom");

    const p4 = Path.from("C:\\hi\\mom\\\\\\\\\\");
    expect(p4.removeTrailingSlash().raw).toBe("C:\\hi\\mom");
  });

  describe("fs helper stuff", () => {
    beforeEach(() => {
      mockFs({
        "/tmp": {
          a: "",
          b: "",
          c: "",
        },
      });
    });

    afterEach(mockFs.restore);

    test("readdir", async () => {
      const p1 = Path.fromAbsolutePathString("/tmp");

      const opts = { encoding: "utf8" };

      const dirs = await p1.readdir(opts);

      expect(dirs).toEqual([
        expect.any(AbsolutePath),
        expect.any(AbsolutePath),
        expect.any(AbsolutePath),
      ]);

      expect(dirs).toEqual([
        expect.objectContaining({ raw: "/tmp/a" }),
        expect.objectContaining({ raw: "/tmp/b" }),
        expect.objectContaining({ raw: "/tmp/c" }),
      ]);
    });

    test("readdirSync", () => {
      const p1 = Path.fromAbsolutePathString("/tmp");

      const opts = { encoding: "utf8" };

      const dirs = p1.readdirSync(opts);

      expect(dirs).toEqual([
        expect.any(AbsolutePath),
        expect.any(AbsolutePath),
        expect.any(AbsolutePath),
      ]);

      expect(dirs).toEqual([
        expect.objectContaining({ raw: "/tmp/a" }),
        expect.objectContaining({ raw: "/tmp/b" }),
        expect.objectContaining({ raw: "/tmp/c" }),
      ]);
    });
  });
});
