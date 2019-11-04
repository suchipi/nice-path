// @ts-ignore
import { Path, AbsolutePath, RelativePath, UnqualifiedPath } from "..";

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

  test("fromAbsolute", () => {
    const p = Path.fromAbsolute("/foo/bar");
    expect(p).toBeInstanceOf(AbsolutePath);

    const p2 = Path.fromAbsolute("C:\\foo\\bar");
    expect(p2).toBeInstanceOf(AbsolutePath);

    const p3 = Path.fromAbsolute("\\\\SERVER\\$Share");
    expect(p3).toBeInstanceOf(AbsolutePath);

    expect(() => {
      Path.fromAbsolute("./foo/bar");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected to receive an absolute path, but received a relative path instead"`
    );

    expect(() => {
      Path.fromAbsolute("foo/bar");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected to receive an absolute path, but received an unqualified path instead"`
    );
  });

  test("fromRelative", () => {
    const p = Path.fromRelative("./foo/bar");
    expect(p).toBeInstanceOf(RelativePath);

    expect(() => {
      Path.fromRelative("/foo/bar");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected to receive an relative path, but received a absolute path instead"`
    );

    expect(() => {
      Path.fromRelative("foo/bar");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected to receive an relative path, but received an unqualified path instead"`
    );
  });

  test("fromUnqualified", () => {
    const p = Path.fromUnqualified("foo/bar");
    expect(p).toBeInstanceOf(UnqualifiedPath);

    expect(() => {
      Path.fromUnqualified("/foo/bar");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected to receive an unqualified path, but received a absolute path instead"`
    );

    expect(() => {
      Path.fromUnqualified("./foo/bar");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected to receive an unqualified path, but received a relative path instead"`
    );

    expect(() => {
      Path.fromUnqualified("C:\\Users");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected to receive an unqualified path, but received a absolute path instead"`
    );

    expect(() => {
      Path.fromUnqualified("\\\\SERVER\\$Share");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected to receive an unqualified path, but received a absolute path instead"`
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

  test("AbsolutePath toRelative", () => {
    const p1 = Path.from("/foo/bar");
    const p2 = p1.toRelative("/foo");
    expect(p2.raw).toBe("./bar");

    const p3 = p1.toRelative(Path.from("/foo"));
    expect(p3.raw).toBe("./bar");

    const p4 = Path.from("\\\\SERVER\\$Share\\Bla");
    const p5 = p4.toRelative("\\\\SERVER\\$Share");
    expect(p5.raw).toBe(".\\Bla");
  });
});
